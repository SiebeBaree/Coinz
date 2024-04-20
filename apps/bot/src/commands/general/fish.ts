import type { ColorResolvable } from 'discord.js';
import {
    ApplicationCommandOptionType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    EmbedBuilder,
} from 'discord.js';
import fishData from '../../data/fish.json';
import type { Command } from '../../domain/Command';
import type { Loot } from '../../lib/types';
import UserStats from '../../models/userStats';
import { filter, getRandomItems, getRandomNumber, wait } from '../../utils';
import { addExperience, addMoney } from '../../utils/money';

enum FishStatus {
    Ready,
    TooSoon,
    TooLate,
}

function getRow(status: FishStatus, disabled = false) {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('fish_end')
            .setLabel('Reel in Fishing Rod')
            .setStyle(
                status === FishStatus.TooSoon
                    ? ButtonStyle.Secondary
                    : status === FishStatus.Ready
                      ? ButtonStyle.Success
                      : ButtonStyle.Danger,
            )
            .setDisabled(disabled || status === FishStatus.TooLate),
    );
}

export default {
    data: {
        name: 'fish',
        description: 'Try and catch some fish that you can sell for money.',
        category: 'general',
        cooldown: 900,
        options: [
            {
                name: 'sell',
                description: 'Sell the fish you caught.',
                type: ApplicationCommandOptionType.Boolean,
                required: false,
            },
        ],
        usage: ['[sell]'],
    },
    async execute(client, interaction, member) {
        const sellItems = interaction.options.getBoolean('sell') ?? false;
        const fishingRod = client.items.getById('fishing_rod')!;

        if (!client.items.hasInInventory(fishingRod.itemId, member)) {
            await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
            await interaction.reply({
                content: `You need a <:${fishingRod.itemId}:${fishingRod.emoteId}> **${fishingRod.name}** to use this command. Use \`/shop buy item-id:${fishingRod.itemId}\` to buy a **${fishingRod.name}**.`,
                ephemeral: true,
            });
            return;
        }

        if (getRandomNumber(1, 100) <= 8) {
            await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
            await client.items.removeItem(fishingRod.itemId, member);
            await interaction.reply({
                content: `Oh No! Your <:${fishingRod.itemId}:${fishingRod.emoteId}> **${fishingRod.name}** broke... You have to buy a new **${fishingRod.name}**. Use \`/shop buy item-id:${fishingRod.itemId}\` to buy a **${fishingRod.name}**.`,
                embeds: [],
                components: [],
            });
            return;
        }

        let status = FishStatus.TooSoon;
        let finishedCommand = false;
        const secondsUntilGreen = getRandomNumber(4, 8);
        const secondsUntilRed = secondsUntilGreen + 2;

        const embed = new EmbedBuilder()
            .setAuthor({
                name: 'Fishing',
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setColor(client.config.embed.color as ColorResolvable)
            .setDescription(
                'Press the button below to reel in your fish. **ONLY PRESS THE BUTTON WHEN THE BUTTON IS GREEN**',
            );

        const message = await interaction.reply({
            embeds: [embed],
            components: [getRow(status)],
            fetchReply: true,
        });
        const collector = message.createMessageComponentCollector({
            filter: async (i) => filter(interaction, i),
            time: secondsUntilRed * 1000,
        });

        collector.on('collect', async (interactionCollector) => {
            if (finishedCommand) return;
            finishedCommand = true;
            await interactionCollector.deferUpdate();

            if (interactionCollector.customId === 'fish_end') {
                if (status === FishStatus.TooSoon) {
                    embed.setColor(Colors.Red);
                    embed.setDescription(
                        "You were too soon to catch some fish. Don't press the button until it's green!",
                    );
                } else if (status === FishStatus.Ready) {
                    const quantity = getRandomNumber(1, 5);
                    const reward = getRandomItems(fishData, quantity);

                    if (Object.keys(reward).length === 0) {
                        embed.setColor(Colors.Red);
                        embed.setDescription('You caught nothing. Try again later.');
                        await interaction.editReply({ embeds: [embed], components: [getRow(status, true)] });
                        return;
                    }

                    let lootText = '';
                    let totalPrice = 0;
                    const itemsToAdd: Loot = {};

                    for (const [itemId, amount] of Object.entries(reward)) {
                        const item = client.items.getById(itemId);
                        if (!item?.sellPrice) continue;

                        if (!sellItems) {
                            itemsToAdd[itemId] = (itemsToAdd[itemId] || 0) + amount;
                        }

                        lootText += `${amount}x ${item.name} <:${item.itemId}:${item.emoteId}> ― :coin: ${Math.floor(
                            item.sellPrice * amount,
                        )}\n`;
                        totalPrice += Math.floor(item.sellPrice * amount);
                    }

                    if (!sellItems && Object.keys(itemsToAdd).length > 0) {
                        await client.items.addItemBulk(itemsToAdd, member);
                    }

                    if (lootText.length > 0 && totalPrice > 0) {
                        await addExperience(member);
                        embed.addFields([{ name: 'Fish caught', value: lootText, inline: false }]);
                        embed.setDescription(`>>> You caught some fish with a total worth of :coin: ${totalPrice}.`);
                        embed.setColor(Colors.Green);

                        if (sellItems) await addMoney(interaction.user.id, totalPrice);
                        const fishCaught = Object.values(reward).reduce((a, b) => a + b, 0);
                        await UserStats.updateOne({ id: interaction.user.id }, { $inc: { fishCaught: fishCaught } });

                        await client.achievement.sendAchievementMessage(
                            interaction,
                            interaction.user.id,
                            client.achievement.getById('local_fish_dealer')!,
                        );
                    } else {
                        embed.setDescription(">>> You didn't catch any fish...");
                        embed.setColor(Colors.Red);
                    }
                } else {
                    embed.setColor(Colors.Red);
                    embed.setDescription('You were too late to catch some fish. Be quicker next time!');
                }

                await interaction.editReply({ embeds: [embed], components: [getRow(status, true)] });
                collector.stop();
            }
        });

        collector.on('end', async () => {
            if (!finishedCommand) {
                finishedCommand = true;

                embed.setColor(Colors.Red);
                embed.setDescription('You were too late to catch some fish. Be quicker next time!');
                await interaction.editReply({ embeds: [embed], components: [getRow(FishStatus.TooLate, true)] });
            }
        });

        for (let i = 0; i < secondsUntilGreen * 4; i++) await wait(250);
        if (!finishedCommand) {
            status = FishStatus.Ready;
            await interaction.editReply({ components: [getRow(status)] });
        }
    },
} satisfies Command;
