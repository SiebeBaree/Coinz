import type { ChatInputCommandInteraction, ColorResolvable, ModalSubmitInteraction, User } from 'discord.js';
import {
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ComponentType,
} from 'discord.js';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import { getMember } from '../../lib/database';
import type { IMember, IPlot } from '../../models/member';
import Member from '../../models/member';
import UserStats from '../../models/userStats';
import { filter, parsePlots } from '../../utils';

type PlotsToUpdate = {
    [key: string]: number | string;
};

const soilQuality: {
    [cropId: string]: {
        requiredSoilQuality: number;
        removedSoilQuality: number;
    };
} = {
    potato: {
        requiredSoilQuality: 0,
        removedSoilQuality: 20,
    },
    wheat: {
        requiredSoilQuality: 40,
        removedSoilQuality: 0,
    },
    radish: {
        requiredSoilQuality: 20,
        removedSoilQuality: 10,
    },
    lettuce: {
        requiredSoilQuality: 5,
        removedSoilQuality: 8,
    },
    soybean: {
        requiredSoilQuality: 45,
        removedSoilQuality: 4,
    },
    carrot: {
        requiredSoilQuality: 25,
        removedSoilQuality: 7,
    },
    broccoli: {
        requiredSoilQuality: 5,
        removedSoilQuality: 17,
    },
    cauliflower: {
        requiredSoilQuality: 10,
        removedSoilQuality: 14,
    },
    tomato: {
        requiredSoilQuality: 15,
        removedSoilQuality: 12,
    },
    cucumber: {
        requiredSoilQuality: 30,
        removedSoilQuality: 6,
    },
    sunflower: {
        requiredSoilQuality: 25,
        removedSoilQuality: 2,
    },
    strawberry: {
        requiredSoilQuality: 60,
        removedSoilQuality: 12,
    },
    corn: {
        requiredSoilQuality: 0,
        removedSoilQuality: 25,
    },
    melon: {
        requiredSoilQuality: 75,
        removedSoilQuality: 10,
    },
    pumpkin: {
        requiredSoilQuality: 80,
        removedSoilQuality: 15,
    },
};

const cropTypeInput = new TextInputBuilder()
    .setCustomId('crop-type')
    .setLabel('Select a crop to plant')
    .setPlaceholder(`Crop ID or Crop Name`)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(50);

const selectPlotsInput = new TextInputBuilder()
    .setCustomId('select-plots')
    .setLabel('Select the plots you want to plant on')
    .setPlaceholder(`Example: 1,3,4-8,9`)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

const forcePlantInput = new TextInputBuilder()
    .setCustomId('force-plant')
    .setLabel('Force planting even if the plot is not empty?')
    .setPlaceholder(`Yes or No`)
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMinLength(1)
    .setMaxLength(5);

const WATER_COOLDOWN = 21_600;
const ROTTEN_DELAY = 172_800;

function getCropSoilQuality(client: Bot, crop: string) {
    const item = client.items.getById(crop);
    if (!item) {
        return {
            requiredSoilQuality: 0,
            removedSoilQuality: 0,
        };
    }

    return (
        soilQuality[item.itemId] ?? {
            requiredSoilQuality: 0,
            removedSoilQuality: 0,
        }
    );
}

function getPlotPrice(plotNumber: number): number {
    return plotNumber * 2_500 + 3_000;
}

function getButtons(member: IMember, disabled = false): ActionRowBuilder<ButtonBuilder> {
    const getButtonStatus = (member: IMember): boolean[] => {
        return [
            member.plots.filter((plot) => plot.status === 'harvest' || plot.status === 'rotten').length === 0,
            member.plots.filter((plot) => plot.status === 'growing').length === 0 ||
                member.lastWatered + WATER_COOLDOWN > Math.floor(Date.now() / 1_000),
            member.plots.filter((plot) => plot.soilQuality <= 80).length === 0,
            member.plots.length >= 15 || member.wallet < getPlotPrice(member.plots.length),
        ];
    };

    const [harvestStatus, waterStatus, fertilizeCrops, buyPlotStatus] = getButtonStatus(member);
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('farm_harvestAllPlots')
            .setLabel('Harvest')
            .setStyle(ButtonStyle.Success)
            .setDisabled(harvestStatus || disabled),
        new ButtonBuilder()
            .setCustomId('farm_waterPlots')
            .setLabel('Water')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(waterStatus || disabled),
        new ButtonBuilder()
            .setCustomId('farm_fertilizePlots')
            .setLabel('Fertilize')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(fertilizeCrops || disabled),
        new ButtonBuilder()
            .setCustomId('farm_buyPlot')
            .setLabel('Buy New Plot')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(buyPlotStatus || disabled),
    );
}

function createEmbedFieldRow(emote: string): string {
    return emote.repeat(6);
}

async function getEmbed(client: Bot, user: User, member: IMember): Promise<EmbedBuilder> {
    const now = Math.floor(Date.now() / 1_000);

    let description = ':seedling: **Use `/farm plant` to plant crops.**';
    description +=
        member.lastWatered + WATER_COOLDOWN > now
            ? `\n:droplet: **You can water your crops again <t:${member.lastWatered + WATER_COOLDOWN}:R>.**`
            : '\n:droplet: **You can water your plots.**';
    description +=
        '\n:wilted_rose: **You can clear rotten crops by pressing the `Harvest` button.**\n:basket: **All harvested crops are found in your inventory.**';
    description +=
        member.plots.length < 15
            ? `\n:moneybag: **You can buy a new plot for :coin: ${getPlotPrice(member.plots.length)}.**`
            : '';

    const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s Farm`)
        .setColor(client.config.embed.color as ColorResolvable)
        .setDescription(description);

    if (member.plots.length === 0) {
        embed.addFields([
            {
                name: 'Buy a plot',
                value: 'Please press the button below to buy a plot.',
                inline: true,
            },
        ]);
        return embed;
    }

    const bulkOps = [];
    for (const plot of member.plots) {
        let plotHasChanged = false;
        let icon = ':brown_square:';
        let cropStatus = 'No crops planted';

        if (plot.status !== 'empty' && plot.status !== 'rotten') {
            if (plot.harvestOn + ROTTEN_DELAY < now) {
                plot.status = 'rotten';
                plotHasChanged = true;
            } else if (plot.harvestOn < now && plot.status !== 'harvest') {
                plot.status = 'harvest';
                plotHasChanged = true;
            }
        }

        if (plot.status === 'growing') {
            const item = client.items.getById(plot.crop);
            if (!item) continue;

            icon = ':seedling:';
            cropStatus = `<:${item.itemId}:${item.emoteId}> <t:${plot.harvestOn}:R>`;
        } else if (plot.status === 'harvest') {
            const item = client.items.getById(plot.crop);
            if (!item) continue;

            icon = `<:${item.itemId}:${item.emoteId}>`;
            cropStatus = `<:${item.itemId}:${item.emoteId}> Ready to harvest`;
        } else if (plot.status === 'rotten') {
            icon = ':wilted_rose:';
            cropStatus = 'Crops are rotten';
        }

        embed.addFields([
            {
                name: `Plot (ID: ${plot.plotId + 1}) [${plot.soilQuality}%]`,
                value: `${createEmbedFieldRow(icon)}\n${cropStatus}`,
                inline: true,
            },
        ]);

        if (plotHasChanged) {
            bulkOps.push({
                updateOne: {
                    filter: { id: member.id, 'plots.plotId': plot.plotId },
                    update: { $set: { 'plots.$.status': plot.status, 'plots.$.soilQuality': plot.soilQuality } },
                },
            });
        }
    }

    if (bulkOps.length > 0) {
        await Member.bulkWrite(bulkOps);
    }

    return embed;
}

async function pressWaterButton(member: IMember): Promise<void> {
    const bulkOps = [];

    // Prepare bulk operations for updating plots
    for (const item of member.plots) {
        if (item.status === 'growing') {
            bulkOps.push({
                updateOne: {
                    filter: {
                        id: member.id,
                        'plots.plotId': item.plotId,
                    },
                    update: { $inc: { 'plots.$.harvestOn': -3_600 } },
                },
            });
        }
    }

    // Add the operation for updating lastWatered
    bulkOps.push({
        updateOne: {
            filter: { id: member.id },
            update: { $set: { lastWatered: Math.floor(Date.now() / 1_000) } },
        },
    });

    // Execute all operations in one database call
    if (bulkOps.length > 0) {
        await Member.bulkWrite(bulkOps);
    }

    await UserStats.updateOne({ id: member.id }, { $inc: { timesPlotWatered: 1 } }, { upsert: true });
}

async function pressFertilizeButton(client: Bot, member: IMember): Promise<void> {
    const bulkOps = [];

    // Prepare bulk operations for updating plots
    for (const item of member.plots) {
        if (item.soilQuality <= 80) {
            bulkOps.push({
                updateOne: {
                    filter: {
                        id: member.id,
                        'plots.plotId': item.plotId,
                    },
                    update: { $set: { 'plots.$.soilQuality': 100 } },
                },
            });
        }
    }

    await client.items.removeItem('fertilizer', member, bulkOps.length);

    // Execute all operations in one database call
    if (bulkOps.length > 0) {
        await Member.bulkWrite(bulkOps);
    }

    await UserStats.updateOne({ id: member.id }, { $inc: { timesPlotFertilized: bulkOps.length } }, { upsert: true });
}

async function pressHarvestButton(client: Bot, member: IMember): Promise<{ [key: string]: number }> {
    const harvestedPlots = member.plots.filter((plot) => plot.status === 'harvest');
    const rottenPlots = member.plots.filter((plot) => plot.status === 'rotten');

    // reduce the harvested plots to an object with the crop as key and the amount as value
    const items = harvestedPlots.reduce<{ [key: string]: number }>((acc, cur) => {
        const crop = cur.crop.trim().toLowerCase();
        acc[crop] = (acc[crop] ?? 0) + 6;
        return acc;
    }, {});

    // Add items to the inventory of the member in bulk
    await client.items.addItemBulk(items, member);

    // Prepare bulk operations for updating plot statuses
    const bulkOps = harvestedPlots.concat(rottenPlots).map((plot) => {
        const cropSoilQuality = getCropSoilQuality(client, plot.crop);
        const removedSoilQuality =
            plot.status === 'rotten'
                ? Math.min(100, plot.soilQuality + 5)
                : Math.min(100, Math.max(0, plot.soilQuality - cropSoilQuality.removedSoilQuality));

        return {
            updateOne: {
                filter: { id: member.id, 'plots.plotId': plot.plotId },
                update: {
                    $set: {
                        'plots.$.status': 'empty',
                        'plots.$.crop': 'none',
                        'plots.$.soilQuality': removedSoilQuality,
                    },
                },
            },
        };
    });

    // Execute all operations in one database call
    if (bulkOps.length > 0) {
        await Member.bulkWrite(bulkOps);
    }

    await UserStats.updateOne(
        { id: member.id },
        { $inc: { timesPlotHarvested: harvestedPlots.length } },
        { upsert: true },
    );

    return items;
}

async function buyNewPlot(member: IMember): Promise<boolean> {
    if (member.wallet < getPlotPrice(member.plots.length)) return false;

    const plotObj: IPlot = {
        plotId: member.plots.length,
        status: 'empty',
        harvestOn: 0,
        crop: 'none',
        soilQuality: 100,
    };

    await Member.updateOne(
        { id: member.id },
        {
            $push: { plots: plotObj },
            $inc: { wallet: -getPlotPrice(member.plots.length) },
        },
    );

    return true;
}

async function getPlots(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    let finishedCommand = false;
    const message = await interaction.reply({
        embeds: [await getEmbed(client, interaction.user, member)],
        components: [getButtons(member, finishedCommand)],
        fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
        filter: async (i) => filter(interaction, i),
        max: 10,
        idle: 25_000,
        time: 150_000,
        componentType: ComponentType.Button,
    });

    collector.on('collect', async (i) => {
        if (finishedCommand) return;
        if (i.customId.startsWith('farm_')) {
            await i.deferUpdate();

            const updatedMember = await getMember(interaction.user.id);
            if (i.customId === 'farm_harvestAllPlots') {
                const harvested = await pressHarvestButton(client, updatedMember);
                const returnStr = [];

                if (Object.keys(harvested).length > 0) {
                    for (const [itemId, amount] of Object.entries(harvested)) {
                        const item = client.items.getById(itemId);
                        if (!item) continue;
                        returnStr.push(`${amount}x <:${item.itemId}:${item.emoteId}> **${item.name}**`);
                    }
                }

                await interaction.followUp({
                    content:
                        returnStr.length === 0
                            ? 'Harvested all plots.'
                            : `**Harvested the following crops:**\n\n${returnStr.join('\n')}`,
                    ephemeral: true,
                });
            } else if (i.customId === 'farm_waterPlots') {
                if (
                    updatedMember.plots.filter((plot) => plot.status === 'growing').length === 0 ||
                    updatedMember.lastWatered + WATER_COOLDOWN > Math.floor(Date.now() / 1_000)
                ) {
                    await interaction.followUp({ content: "You can't water your crops right now.", ephemeral: true });
                } else {
                    await pressWaterButton(updatedMember);
                    await interaction.followUp({
                        content: "I've watered the crops and they will now grow 1 hour faster.",
                        ephemeral: true,
                    });
                }
            } else if (i.customId === 'farm_fertilizePlots') {
                const totalPlots = updatedMember.plots.filter((plot) => plot.soilQuality <= 80).length;
                if (totalPlots === 0) {
                    await interaction.followUp({
                        content: "You can't fertilize your crops right now. No plots are below 80% quality.",
                        ephemeral: true,
                    });
                } else {
                    const fertilizer = client.items.getById('fertilizer');
                    if (!fertilizer) throw new Error('Fertilizer item not found.');

                    const fertilizerInInventory =
                        client.items.getInventoryItem(fertilizer.itemId, updatedMember)?.amount ?? 0;

                    if (fertilizerInInventory < totalPlots) {
                        await interaction.followUp({
                            content: `You don't have enough <:${fertilizer.itemId}:${fertilizer.emoteId}> **${
                                fertilizer.name
                            }** in your inventory. You need ${totalPlots - fertilizerInInventory} more.`,
                            ephemeral: true,
                        });
                    } else {
                        await pressFertilizeButton(client, updatedMember);
                        await interaction.followUp({
                            content: "I've fertilized all plots below 80% soil quality.",
                            ephemeral: true,
                        });
                    }
                }
            } else if (i.customId === 'farm_buyPlot') {
                if (await buyNewPlot(updatedMember)) {
                    await interaction.followUp({ content: 'You successfully bought a new plot.', ephemeral: true });
                    await client.achievement.sendAchievementMessage(
                        interaction,
                        interaction.user.id,
                        client.achievement.getById('farmers_life'),
                    );
                    await client.achievement.sendAchievementMessage(
                        interaction,
                        interaction.user.id,
                        client.achievement.getById('a_real_farmer'),
                    );
                }
            } else {
                return;
            }

            const visibleMember = await getMember(interaction.user.id);
            await i.editReply({
                embeds: [await getEmbed(client, interaction.user, visibleMember)],
                components: [getButtons(visibleMember, finishedCommand)],
            });
        }
    });

    collector.on('end', async () => {
        if (!finishedCommand) finishedCommand = true;
        await message.edit({
            components: [getButtons(member, true)],
        });
    });
}

async function getPlant(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    if (member.plots.length === 0) {
        await interaction.reply({
            content: "You don't have any plots. Use `/farm plots` to get a list with information about all your plots.",
            ephemeral: true,
        });
        return;
    }

    const modal = new ModalBuilder()
        .setTitle('Plant crops on your plots')
        .setCustomId(`farm_plant-${interaction.user.id}`)
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(cropTypeInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(selectPlotsInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(forcePlantInput),
        );
    await interaction.showModal(modal);

    const filter = (i: ModalSubmitInteraction) =>
        i.customId === `farm_plant-${interaction.user.id}` && i.user.id === interaction.user.id;

    try {
        const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 120_000 });

        const cropType = modalInteraction.fields.getTextInputValue('crop-type');
        const selectPlots = modalInteraction.fields.getTextInputValue('select-plots');
        const forcePlant = modalInteraction.fields.getTextInputValue('force-plant');

        const crop = client.items.getById(cropType) ?? client.items.getByName(cropType);
        if (!crop || crop.category !== 'crops') {
            await modalInteraction.reply({
                content: 'That is not a valid crop. Use `/shop list` to check all available crops.',
                ephemeral: true,
            });
            return;
        }

        try {
            const plots = parsePlots(selectPlots);

            if (plots.length === 0) {
                await modalInteraction.reply({
                    content: 'You must select at least one plot.',
                    ephemeral: true,
                });
                return;
            } else if (Math.min(...plots) < 1 || Math.max(...plots) > member.plots.length) {
                await modalInteraction.reply({
                    content: `You can only select plots from 1 to ${member.plots.length}.`,
                    ephemeral: true,
                });
                return;
            }

            const force = ['yes', 'y', 'true', '1'].includes(forcePlant ? forcePlant.toLowerCase() : 'no');
            if (!force) {
                const alreadyPlanted = plots.filter(
                    (plotId) =>
                        member.plots[plotId - 1]?.status === 'harvest' ||
                        member.plots[plotId - 1]?.status === 'growing',
                );

                if (alreadyPlanted.length > 0) {
                    await modalInteraction.reply({
                        content: `You already planted something on plot${
                            alreadyPlanted.length > 1 ? 's' : ''
                        } ${alreadyPlanted.join(', ')}.\nUse \`/farm plant\` to re-plant.`,
                    });
                    return;
                }
            }

            const cropInInventory = client.items.getInventoryItem(crop.itemId, member);
            if (!cropInInventory || cropInInventory.amount < plots.length) {
                await interaction.reply({
                    content: `You don't have enough <:${crop.itemId}:${crop.emoteId}> **${
                        crop.name
                    }** in your inventory.\nUse \`/shop buy item-id: ${crop.itemId} amount: ${
                        plots.length - (cropInInventory?.amount ?? 0)
                    }\``,
                    ephemeral: true,
                });
                return;
            }

            const cropSoilQuality = getCropSoilQuality(client, crop.itemId);
            const invalidPlots = [];
            for (const plot of plots) {
                if ((member.plots[plot - 1]?.soilQuality ?? 100) < cropSoilQuality.requiredSoilQuality) {
                    invalidPlots.push(plot);
                }
            }

            if (invalidPlots.length > 0) {
                await modalInteraction.reply({
                    content: `The soil quality of plot${invalidPlots.length === 1 ? '' : 's'} ${invalidPlots.join(
                        ', ',
                    )} is too low to plant <:${crop.itemId}:${crop.emoteId}> **${
                        crop.name
                    }**, it needs to be at least ${cropSoilQuality.requiredSoilQuality}%.`,
                    ephemeral: true,
                });
                return;
            }

            await modalInteraction.reply({
                content: `You successfully planted <:${crop.itemId}:${crop.emoteId}> **${crop.name}** on plot${
                    plots.length > 1 ? 's' : ''
                } ${plots.join(', ')}.`,
                ephemeral: true,
            });

            await client.items.removeItem(crop.itemId, member, plots.length);
            const harvestOn = Math.floor(Date.now() / 1_000) + (crop.duration ?? 21_600);
            const plotsToUpdate: PlotsToUpdate = {};
            for (const plot of plots) {
                plotsToUpdate[`plots.${plot - 1}.status`] = 'growing';
                plotsToUpdate[`plots.${plot - 1}.crop`] = crop.itemId;
                plotsToUpdate[`plots.${plot - 1}.harvestOn`] = harvestOn;
            }

            await Member.updateOne({ id: interaction.user.id }, plotsToUpdate);
            await UserStats.updateOne(
                { id: interaction.user.id },
                { $inc: { timesPlotPlanted: plots.length } },
                { upsert: true },
            );
        } catch (error) {
            await modalInteraction.reply({
                content: (error as Error).message,
                ephemeral: true,
            });
        }
    } catch (error) {
        if ((error as Error).name.includes('InteractionCollectorError')) {
            return;
        }

        throw error;
    }
}

export default {
    data: {
        name: 'farm',
        description: 'Manage your farm and plant crops.',
        category: 'business',
        options: [
            {
                name: 'plots',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get a list with information about all your plots.',
                options: [],
            },
            {
                name: 'plant',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Plant a new crop on your plots.',
                options: [],
            },
        ],
        usage: ['plots', 'plant'],
    },
    async execute(client, interaction, member) {
        switch (interaction.options.getSubcommand()) {
            case 'plots':
                await getPlots(client, interaction, member);
                break;
            case 'plant':
                await getPlant(client, interaction, member);
                break;
            default:
                await interaction.reply({ content: client.config.invalidCommand, ephemeral: true });
        }
    },
} satisfies Command;
