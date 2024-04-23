import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    StringSelectMenuBuilder,
    ButtonStyle,
    ComponentType,
    TextInputBuilder,
    TextInputStyle,
    ModalBuilder,
} from 'discord.js';
import type { ColorResolvable, ChatInputCommandInteraction, ModalSubmitInteraction } from 'discord.js';
// eslint-disable-next-line import/no-extraneous-dependencies
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';
import type Bot from '../../../domain/Bot';
import { Positions, type BusinessData } from '../../../lib/types';
import type { IBusiness } from '../../../models/business';
import Business from '../../../models/business';
import type { IMember } from '../../../models/member';
import { generateRandomString } from '../../../utils';
import { removeMoney } from '../../../utils/money';

enum Category {
    Employees = 'employees',
    Inventory = 'inventory',
    Overview = 'overview',
}

function getCEO(business: IBusiness) {
    return business.employees.find((e) => e.position === Positions.CEO);
}

function getInventory(
    client: Bot,
    business: IBusiness,
): {
    items: string[];
    worth: number;
} {
    const items: string[] = [];
    let worth = 0;

    for (const invItem of business.inventory) {
        const item = client.business.getById(invItem.itemId);
        if (!item?.price) continue;

        worth += item.price * invItem.amount;
        items.push(`**${invItem.amount}x** <:${invItem.itemId}:${item.emoteId}> ${item.name}`);
    }

    return {
        items,
        worth,
    };
}

function getEmbed(client: Bot, member: IMember, business: IBusiness | null, category: string): EmbedBuilder {
    const embed = new EmbedBuilder().setColor(client.config.embed.color as ColorResolvable).setFooter({
        text: `${business?.name ?? 'Business'} in Coinz`,
        iconURL: client.user?.avatarURL() ?? undefined,
    });

    if (!business) {
        embed.setDescription(
            ":x: **You don't own or are not working for a business.**" +
                '\n:moneybag: **Starting a business costs** :coin: 6000' +
                '\n:factory: **Or join a business by getting hired!**',
        );
        return embed;
    }

    const ownBusiness = business.employees.some((e) => e.userId === member.id);
    if (category === Category.Inventory) {
        const { items, worth } = getInventory(client, business);
        embed.setTitle(`Inventory of ${business.name}`);
        embed.setDescription(
            `:credit_card: **Bank Balance:** :coin: ${business.balance}\n:moneybag: **Total Inventory Worth:** :coin: ${worth}`,
        );
        embed.addFields({
            name: 'Inventory',
            value: items.length > 0 ? items.join('\n') : 'Your business has no inventory...',
        });
    } else if (category === Category.Employees) {
        const employees = [];
        for (const employee of business.employees) {
            employees.push(
                `(\`${employee.employeeId}\`) <@${employee.userId}> - **${
                    Positions[employee.position]
                }**\n> **Money Earned:** :coin: ${employee.moneyEarned}`,
            );
        }

        embed.setTitle(`Employees of ${business.name}`);
        embed.setDescription(employees.length > 0 ? employees.join('\n\n') : 'Your business has no employees...');
    } else {
        const { worth } = getInventory(client, business);
        const fields = [
            {
                name: 'Business Information',
                value: `:sunglasses: **CEO:** <@${
                    getCEO(business)?.userId ?? 'No CEO Found...'
                }>\n:credit_card: **Bank Balance:** :coin: ${business.balance}\n:moneybag: **Worth:** :coin: ${
                    worth + 400 * business.factories.length
                }\n:factory: **Factories:** \`${business.factories.length}\``,
                inline: false,
            },
        ];

        if (ownBusiness) {
            const employee = business.employees.find((e) => e.userId === member.id);
            if (employee) {
                fields.push({
                    name: 'Your Status',
                    value: `**Position:** ${Positions[employee.position]}\n**Dividends Received:** :coin: ${
                        employee.moneyEarned
                    }`,
                    inline: false,
                });
            }
        }

        embed.setTitle(`Overview of ${business.name}`);
        embed.addFields(fields);
    }

    return embed;
}

function getSelectMenu(
    business: IBusiness | null,
    category: string,
    disableInventory: boolean,
    disabled = false,
): ActionRowBuilder<StringSelectMenuBuilder> | undefined {
    if (!business) return undefined;

    const options = [
        { label: '📜 Overview', value: 'overview', default: false },
        { label: '👥 Employees', value: 'employees', default: false },
    ];

    if (!disableInventory) options.push({ label: '📦 Inventory', value: 'inventory', default: false });
    for (const option of options) {
        if (option.value === category) {
            option.default = true;
        }
    }

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('business_info_select')
            .setPlaceholder('No category selected.')
            .setDisabled(disabled)
            .addOptions(options),
    );
}

async function getButtons(
    client: Bot,
    category: string,
    member: IMember,
    business: IBusiness | null,
    disabled = true,
): Promise<ActionRowBuilder<ButtonBuilder>> {
    const buttons: ButtonBuilder[] = [];

    if (category === Category.Overview) {
        if (business) {
            if (business.employees.some((e) => e.position === Positions.CEO && e.userId === member.id)) {
                const cooldown = await client.cooldown.getCooldown(member.id, 'business.info.rename');
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId('business_rename')
                        .setLabel('Rename Business')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(Boolean(cooldown) || disabled),
                );
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId('business_sell')
                        .setLabel('Sell Business')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(disabled),
                );
            } else {
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId('business_leave')
                        .setLabel('Leave Business')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(disabled),
                );
            }
        } else {
            buttons.push(
                new ButtonBuilder()
                    .setCustomId('business_create')
                    .setLabel('Create Business')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(disabled),
            );
        }
    }

    return new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);
}

async function getComponents(
    client: Bot,
    business: IBusiness | null,
    member: IMember,
    category: string,
    disableInventorySelect: boolean,
    disabled = false,
): Promise<ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[]> {
    const components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = [];

    const selectMenu = getSelectMenu(business, category, disableInventorySelect, disabled);
    const buttons = await getButtons(client, category, member, business, disabled);
    if (selectMenu && selectMenu.components.length >= 1 && selectMenu.components.length <= 5)
        components.push(selectMenu);
    if (buttons && buttons.components.length >= 1 && buttons.components.length <= 5) components.push(buttons);

    return components;
}

async function checkBusinessName(name: string): Promise<string> {
    name = name.trim();

    if (name.length > 24) {
        throw new Error('You can only use a maximum of 24 characters for your business name.');
    } else if (!/^[A-Za-z][\w -.]*$/.test(name)) {
        throw new Error(
            'Your business name can only use `A-Z, a-z, 0-9, whitespaces, -, _, .` and you have to start with a letter.',
        );
    }

    const matcher = new RegExpMatcher({
        ...englishDataset.build(),
        ...englishRecommendedTransformers,
    });

    if (matcher.hasMatch(name)) {
        throw new Error('Your business name contains inappropriate language.');
    }

    const currentBusiness = await Business.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (currentBusiness) {
        throw new Error(`A business with the name **${name}** already exists.`);
    }

    return name;
}

export default async function info(
    client: Bot,
    interaction: ChatInputCommandInteraction,
    member: IMember,
    data: BusinessData | null,
) {
    const name = interaction.options.getString('name');
    let business: IBusiness | null = data?.business ?? null;
    let ownBusiness = Boolean(data);

    if (name) {
        const fetchedBusiness = await Business.findOne({ name });
        if (!fetchedBusiness) {
            await interaction.reply({
                content: `No legal business with the name \`${name}\` exists.`,
                ephemeral: true,
            });
            return;
        }

        business = fetchedBusiness;
        if (data && business.name === data.business.name) {
            ownBusiness = true;
        }
    }

    let category = Category.Overview as string;
    const message = await interaction.reply({
        embeds: [getEmbed(client, member, business, category)],
        components: await getComponents(client, business, member, category, !ownBusiness, false),
        fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
        max: 8,
        time: 120_000,
    });

    collector.on('collect', async (i) => {
        if (i.componentType === ComponentType.Button && i.customId.startsWith('business_')) {
            if (i.customId === 'business_leave' && business !== null) {
                const employee = business.employees.find((e) => e.userId === member.id);
                if (!employee) return;

                if (employee.position === Positions.CEO) {
                    await i.reply({
                        content: 'You cannot leave your business as the CEO. You can sell your business instead.',
                        ephemeral: true,
                    });
                    return;
                }

                await i.reply({
                    content: 'You have left the business.',
                    ephemeral: true,
                });

                await Business.updateOne(
                    { name: business.name },
                    {
                        $pull: {
                            employees: {
                                userId: member.id,
                            },
                        },
                    },
                );

                business = null;
            } else if (i.customId === 'business_create' && business === null) {
                const createNameInput = new TextInputBuilder()
                    .setCustomId('business-create-name')
                    .setLabel('Business Name')
                    .setPlaceholder(`Type the name of your business.`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMinLength(3)
                    .setMaxLength(24);

                const modal = new ModalBuilder()
                    .setTitle('Creating a Business')
                    .setCustomId(`business-create-${interaction.user.id}`)
                    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(createNameInput));

                await i.showModal(modal);

                const filter = (modalInteraction: ModalSubmitInteraction) =>
                    modalInteraction.customId === `business-create-${interaction.user.id}` &&
                    modalInteraction.user.id === interaction.user.id;

                try {
                    const modalInteraction = await i.awaitModalSubmit({ filter, time: 180_000 });

                    const businessName = modalInteraction.fields.getTextInputValue('business-create-name').trim();

                    try {
                        const validName = await checkBusinessName(businessName);
                        if (member.wallet < 6000) {
                            await modalInteraction.reply({
                                content: 'You need :coin: 6000 to create a business.',
                                ephemeral: true,
                            });
                            return;
                        }

                        await modalInteraction.reply({
                            content: `Your business named **${validName}** has been created. You can now start hiring employees and buying factories.`,
                        });

                        await removeMoney(member.id, 6000);
                        const newBusiness = new Business({
                            name: validName,
                            employees: [
                                {
                                    employeeId: generateRandomString(6),
                                    userId: member.id,
                                    position: Positions.CEO,
                                    hiredOn: Date.now(),
                                    moneyEarned: 0,
                                },
                            ],
                        });
                        await newBusiness.save();
                        business = newBusiness;
                        ownBusiness = true;
                    } catch (error) {
                        await modalInteraction.reply({
                            content: (error as Error).message,
                            ephemeral: true,
                        });
                        return;
                    }
                } catch (error) {
                    if ((error as Error).name.includes('InteractionCollectorError')) return;
                    throw error;
                }
            } else if (i.customId === 'business_rename' && business !== null) {
                if (!business.employees.some((e) => e.position === Positions.CEO && e.userId === member.id)) return;

                const renameInput = new TextInputBuilder()
                    .setCustomId('business-rename')
                    .setLabel('Business Name')
                    .setPlaceholder(`Type the name of your business.`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMinLength(3)
                    .setMaxLength(24);

                const modal = new ModalBuilder()
                    .setTitle('Rename your Business')
                    .setCustomId(`business-rename-${interaction.user.id}`)
                    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(renameInput));

                await i.showModal(modal);

                const filter = (modalInteraction: ModalSubmitInteraction) =>
                    modalInteraction.customId === `business-rename-${interaction.user.id}` &&
                    modalInteraction.user.id === interaction.user.id;

                try {
                    const modalInteraction = await i.awaitModalSubmit({ filter, time: 180_000 });

                    const businessName = modalInteraction.fields.getTextInputValue('business-rename');
                    try {
                        const validName = await checkBusinessName(businessName);
                        if (business.balance < 4000) {
                            await modalInteraction.reply({
                                content: 'Your business needs :coin: 4000 to change the name.',
                                ephemeral: true,
                            });
                            return;
                        }

                        await modalInteraction.reply({
                            content: `You successfully renamed your business from **${business.name}** to **${validName}**.`,
                        });

                        await Business.updateOne(
                            { name: business.name },
                            {
                                $set: {
                                    name: validName,
                                },
                                $inc: {
                                    balance: -4000,
                                },
                            },
                        );

                        business.name = validName;
                        business.balance -= 4000;
                    } catch (error) {
                        await modalInteraction.reply({
                            content: (error as Error).message,
                            ephemeral: true,
                        });
                        return;
                    }
                } catch (error) {
                    if ((error as Error).name.includes('InteractionCollectorError')) return;
                    throw error;
                }
            } else if (i.customId === 'business_sell' && business !== null) {
                if (!business.employees.some((e) => e.position === Positions.CEO && e.userId === member.id)) return;

                const confirmInput = new TextInputBuilder()
                    .setCustomId('business-sell')
                    .setLabel('Confirmation')
                    .setPlaceholder(`Type "${business.name}" to confirm`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(24);

                const modal = new ModalBuilder()
                    .setTitle('Are you sure you want to sell your business?')
                    .setCustomId(`business-sell-${interaction.user.id}`)
                    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(confirmInput));

                await i.showModal(modal);

                const filter = (modalInteraction: ModalSubmitInteraction) =>
                    modalInteraction.customId === `business-sell-${interaction.user.id}` &&
                    modalInteraction.user.id === interaction.user.id;

                try {
                    const modalInteraction = await i.awaitModalSubmit({ filter, time: 60_000 });

                    const businessName = modalInteraction.fields.getTextInputValue('business-sell');
                    if (businessName !== business.name) {
                        await modalInteraction.reply({
                            content: 'Business name is incorrect. Canceling the sale.',
                            ephemeral: true,
                        });
                        return;
                    }

                    await modalInteraction.reply({
                        content: 'Your business has been sold. This action is irreversible.',
                        ephemeral: true,
                    });

                    await Business.deleteOne({ name: business.name });
                    business = null;
                } catch (error) {
                    if ((error as Error).name.includes('InteractionCollectorError')) return;
                    throw error;
                }
            }
        } else if (i.componentType === ComponentType.StringSelect && i.customId === 'business_info_select') {
            await i.deferUpdate();
            category = i.values[0]!;
        }

        await interaction.editReply({
            embeds: [getEmbed(client, member, business, category)],
            components: await getComponents(client, business, member, category, !ownBusiness, false),
        });
    });

    collector.on('end', async () => {
        await interaction.editReply({
            components: await getComponents(client, business, member, category, !ownBusiness, true),
        });
    });
}
