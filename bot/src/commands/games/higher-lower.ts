import type { ColorResolvable } from 'discord.js';
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    ComponentType,
    EmbedBuilder,
} from 'discord.js';
import type { Command } from '../../domain/Command';
import UserStats from '../../models/userStats';
import { filter, getBet, getRandomNumber } from '../../utils';
import { addExperience, addMoney } from '../../utils/money';

type GameData = {
    bet: number;
    commandIsFinished: boolean;
    playerHasWon: boolean;
    currentNumber: number;
    timesCorrect: number;
    color: ColorResolvable;
};

function getEmbed(gameData: GameData): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Higher Lower')
        .setColor(gameData.color)
        .setDescription(
            ':point_up: `Higher` ― **The next number is higher.**\n' +
                ':point_down: `Lower` ― **The next number is lower.**\n:boom: `Jackpot` ― **The next number is the same.**\n' +
                ':negative_squared_cross_mark: `Stop` ― **Stop the game an claim your money.**' +
                `\n\n**Current Number:** \`${gameData.currentNumber}\` *(Between 1-99)*\n**Correct Guesses:** \`${gameData.timesCorrect}\`` +
                `\n\n:money_with_wings: **Profit:** :coin: ${
                    getPrice(gameData.bet, gameData.timesCorrect, gameData.playerHasWon) - gameData.bet
                }`,
        );
}

function getButtons(isDisabled = false): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('hl_higher')
            .setLabel('Higher')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('☝️')
            .setDisabled(isDisabled),
        new ButtonBuilder()
            .setCustomId('hl_lower')
            .setLabel('Lower')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('👇')
            .setDisabled(isDisabled),
        new ButtonBuilder()
            .setCustomId('hl_jackpot')
            .setLabel('Jackpot')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('💥')
            .setDisabled(isDisabled),
        new ButtonBuilder()
            .setCustomId('hl_stop')
            .setLabel('Stop')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❎')
            .setDisabled(isDisabled),
    );
}

function getPrice(bet: number, timesCorrect: number, playerWon = true): number {
    return playerWon ? Math.floor(bet * (timesCorrect / 2)) : -bet;
}

export default {
    data: {
        name: 'higher-lower',
        description:
            'Play a game of higher lower and guess if the next number is higher or lower than the current number.',
        category: 'games',
        cooldown: 600,
        options: [
            {
                name: 'bet',
                type: ApplicationCommandOptionType.String,
                description: 'The bet you want to place.',
                required: true,
                min_length: 2,
                max_length: 6,
            },
        ],
        extraFields: [
            {
                name: 'Bet Formatting',
                value: 'You can use formatting to make it easier to use big numbers.\n\n__For Example:__\n~~1000~~ **1K**\n~~1300~~ **1.3K**\nUse `all` or `max` to use all the money you have or the maximum amount you can bet.',
                inline: false,
            },
        ],
    },
    async execute(client, interaction, member) {
        const { bet, error } = await getBet(client, interaction, member);
        if (error) {
            await interaction.reply({ content: error, ephemeral: true });
            return;
        }

        const gameData: GameData = {
            bet,
            commandIsFinished: false,
            playerHasWon: true,
            currentNumber: getRandomNumber(1, 99),
            timesCorrect: 0,
            color: client.config.embed.color as ColorResolvable,
        };

        const message = await interaction.reply({
            embeds: [getEmbed(gameData)],
            components: [getButtons(gameData.commandIsFinished)],
            fetchReply: true,
        });

        const collector = message.createMessageComponentCollector({
            filter: async (i) => filter(interaction, i),
            idle: 15_000,
            time: 90_000,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (i) => {
            if (gameData.commandIsFinished) return;

            const button = i.customId.replace('hl_', '');
            const nextNumber = getRandomNumber(1, 99);

            if (button === 'stop') {
                gameData.commandIsFinished = true;
                gameData.playerHasWon = true;
                gameData.color = Colors.Green;
                collector.stop();
            } else {
                if (
                    (button === 'higher' && nextNumber > gameData.currentNumber) ||
                    (button === 'lower' && nextNumber < gameData.currentNumber) ||
                    (button === 'jackpot' && nextNumber === gameData.currentNumber)
                ) {
                    gameData.timesCorrect++;
                } else {
                    gameData.commandIsFinished = true;
                    gameData.playerHasWon = false;
                    gameData.color = Colors.Red;
                    collector.stop();

                    await UserStats.updateOne(
                        { id: interaction.user.id },
                        {
                            $inc: {
                                'games.lost': 1,
                                'games.moneyLost': gameData.bet,
                            },
                        },
                        { upsert: true },
                    );
                }

                if (gameData.timesCorrect >= 5) {
                    gameData.commandIsFinished = true;
                    gameData.playerHasWon = true;
                    gameData.color = Colors.Green;
                    collector.stop();
                }

                gameData.currentNumber = nextNumber;
            }

            await i.update({
                embeds: [getEmbed(gameData)],
                components: [getButtons(gameData.commandIsFinished)],
            });

            if (gameData.commandIsFinished && gameData.playerHasWon) {
                const money = getPrice(gameData.bet, gameData.timesCorrect);
                await addMoney(interaction.user.id, money);
                await addExperience(member);

                await UserStats.updateOne(
                    { id: interaction.user.id },
                    {
                        $inc: {
                            totalEarned: money,
                            'games.won': 1,
                            'games.moneyEarned': money,
                        },
                    },
                    { upsert: true },
                );
            }
        });

        collector.on('end', async () => {
            if (!gameData.commandIsFinished) {
                gameData.commandIsFinished = true;
                gameData.playerHasWon = true;
                gameData.color = Colors.Green;

                await interaction.editReply({ embeds: [getEmbed(gameData)], components: [getButtons(true)] });
                await addMoney(interaction.user.id, getPrice(gameData.bet, gameData.timesCorrect));
            }
        });
    },
} satisfies Command;
