import type { ColorResolvable } from 'discord.js';
import {
    Colors,
    EmbedBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} from 'discord.js';
import type { Command } from '../../domain/Command';
import type { IMember } from '../../models/member';
import UserStats from '../../models/userStats';
import { filter, getBet, wait } from '../../utils';
import { addExperience, addMoney, removeMoney } from '../../utils/money';

const TOTAL_SLOTS = 6;
const DELAY = 2500;

type GameData = {
    bet: number;
    finishedCommand: boolean;
    userWon: boolean | null;
    bullet: number;
    chamber: number;
    multiplier: number;
    color: ColorResolvable;
};

function getEmbed(gameData: GameData): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Russian Roulette')
        .setDescription(
            'You have a 1/6 chance of shooting the gun with a bullet in the chamber.\n\n:boom: `Shoot` ― **shoot the gun.**\n:no_entry: `Stop` ― **end the game.**',
        )
        .setColor(gameData.color)
        .addFields(
            { name: 'Bet Mulitplier', value: `${gameData.multiplier}x`, inline: true },
            {
                name: 'Profit',
                value: `:coin: ${Math.floor(gameData.multiplier * gameData.bet - gameData.bet)}`,
                inline: true,
            },
        );
}

function getButtons(disabled = false): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('rr_shoot')
            .setLabel('Shoot')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled),
        new ButtonBuilder().setCustomId('rr_stop').setLabel('Stop').setStyle(ButtonStyle.Success).setDisabled(disabled),
    );
}

function pullTrigger(gameData: GameData): void {
    if (gameData.chamber === gameData.bullet || gameData.chamber >= TOTAL_SLOTS - 1) {
        gameData.userWon = false;
        gameData.color = Colors.Red;
        gameData.finishedCommand = true;
    } else {
        gameData.chamber++;
        gameData.multiplier += 0.5;
        gameData.userWon = true;
    }
}

function getContent(gameData: GameData): string {
    if (gameData.finishedCommand) {
        return gameData.userWon === true
            ? ':money_with_wings: **GG! You did not die this game!**'
            : ':skull: **You died and lost your bet.**';
    } else {
        return gameData.userWon === true
            ? ':tada: **You lived! Your multiplier has increased by 0.5x.**'
            : ':hourglass_flowing_sand: **Pulling the trigger...**';
    }
}

async function endGame(member: IMember, gameData: GameData): Promise<void> {
    if (gameData.finishedCommand) {
        if (gameData.userWon === true) {
            const money = Math.floor(gameData.bet * gameData.multiplier);
            await addExperience(member);
            await addMoney(member.id, money);

            await UserStats.updateOne(
                { id: member.id },
                {
                    $inc: {
                        totalEarned: money,
                        'games.won': 1,
                        'games.moneyEarned': money,
                    },
                },
                { upsert: true },
            );
        } else {
            await removeMoney(member.id, gameData.bet);

            await UserStats.updateOne(
                { id: member.id },
                {
                    $inc: {
                        'games.lost': 1,
                        'games.moneyLost': gameData.bet,
                    },
                },
                { upsert: true },
            );
        }
    }
}

export default {
    data: {
        name: 'russian-roulette',
        description: "Be lucky and don't die playing russian roulette.",
        category: 'games',
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
        cooldown: 600,
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
            finishedCommand: false,
            userWon: null,
            bullet: Math.floor(Math.random() * TOTAL_SLOTS),
            chamber: 0,
            multiplier: 0,
            color: client.config.embed.color as ColorResolvable,
        };

        const message = await interaction.reply({
            content: getContent(gameData),
            embeds: [getEmbed(gameData)],
            components: [getButtons(true)],
            fetchReply: true,
        });
        await wait(DELAY);
        pullTrigger(gameData);

        await interaction.editReply({
            content: getContent(gameData),
            embeds: [getEmbed(gameData)],
            components: [getButtons(gameData.finishedCommand)],
        });

        if (gameData.finishedCommand) {
            await endGame(member, gameData);
            return;
        }

        const collector = message.createMessageComponentCollector({
            filter: async (i) => filter(interaction, i),
            max: 7,
            idle: 45_000,
        });

        collector.on('collect', async (i) => {
            if (!gameData.finishedCommand) {
                if (i.customId === 'rr_shoot') {
                    gameData.userWon = null;
                    await i.update({
                        content: getContent(gameData),
                        embeds: [getEmbed(gameData)],
                        components: [getButtons(true)],
                    });

                    await wait(DELAY);
                    pullTrigger(gameData);
                } else if (i.customId === 'rr_stop') {
                    gameData.finishedCommand = true;
                    await i.deferUpdate();
                }

                if (gameData.finishedCommand) {
                    collector.stop();
                }

                await interaction.editReply({
                    content: getContent(gameData),
                    embeds: [getEmbed(gameData)],
                    components: [getButtons(gameData.finishedCommand)],
                });

                await endGame(member, gameData);
            }
        });

        collector.on('end', async () => {
            if (!gameData.finishedCommand) {
                gameData.finishedCommand = true;
                if (gameData.userWon === null) gameData.userWon = false;

                await interaction.editReply({ components: [getButtons(gameData.finishedCommand)] });
                await endGame(member, gameData);
            }
        });
    },
} satisfies Command;
