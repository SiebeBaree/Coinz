import { setTimeout, clearInterval, setInterval } from 'node:timers';
import type { ColorResolvable } from 'discord.js';
import { Colors, EmbedBuilder, ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../domain/Command';
import UserStats from '../../models/userStats';
import { getBet, getRandomNumber } from '../../utils';
import { addExperience, addMoney } from '../../utils/money';

type GameData = {
    bet: number;
    horse: number;
    userWon: boolean;
    finishedCommand: boolean;
    horses: number[];
    status: string;
    color: ColorResolvable;
};

function getEmbed(gameData: GameData): EmbedBuilder {
    const horseStr = gameData.horses
        .map((horse, index) => `**${index + 1}.** ${'-'.repeat(horse)}:horse_racing:`)
        .join('\n');

    return new EmbedBuilder()
        .setTitle('Horse Race')
        .setColor(gameData.color)
        .setDescription(
            `:moneybag: **Bet:** :coin: ${gameData.bet}\n:1234: **Your Horse:** \`${gameData.horse}\`\n:hourglass: **Status:** ${gameData.status}\n\n${horseStr}`,
        );
}

export default {
    data: {
        name: 'horse-race',
        description: 'Bet on the fastest horse to earn money.',
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
            {
                name: 'horse',
                type: ApplicationCommandOptionType.Integer,
                description: 'The horse (1-5) you want to bet on.',
                required: true,
                min_value: 1,
                max_value: 5,
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

        const horse = interaction.options.getInteger('horse', true);
        const gameData = {
            bet,
            horse,
            userWon: false,
            finishedCommand: false,
            horses: Array.from({ length: 5 }).fill(10),
            status: ':checkered_flag: Racing...',
            color: client.config.embed.color as ColorResolvable,
        } as GameData;

        await interaction.reply({ embeds: [getEmbed(gameData)] });

        const interval = setInterval(async () => {
            if (gameData.finishedCommand) {
                clearInterval(interval);
                return;
            }

            for (let i = 0; i < 3; i++) {
                const horseNr = getRandomNumber(0, gameData.horses.length - 1);
                gameData.horses[horseNr] = gameData.horses[horseNr]! <= 0 ? 0 : gameData.horses[horseNr]! - 1;
            }

            const horseWon = gameData.horses.findIndex((h) => h <= 0);

            if (horseWon !== -1) {
                gameData.finishedCommand = true;
                gameData.status = ':trophy: Race has ended!';

                if (horseWon + 1 === gameData.horse) {
                    gameData.userWon = true;
                    gameData.status += `\n:money_with_wings: **Profit:** :coin: ${Math.floor(gameData.bet * 3)}`;
                    gameData.color = Colors.Green;

                    const money = Math.floor(gameData.bet * 3);
                    await addMoney(interaction.user.id, money);
                    await addExperience(member);

                    await UserStats.updateOne(
                        { id: interaction.user.id },
                        {
                            $inc: {
                                'games.won': 1,
                                'games.moneyEarned': money,
                            },
                        },
                        { upsert: true },
                    );
                } else {
                    gameData.userWon = false;
                    gameData.color = Colors.Red;

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
            }

            await interaction.editReply({ embeds: [getEmbed(gameData)] });

            if (gameData.finishedCommand) {
                clearInterval(interval);
            }
        }, 1500);

        setTimeout(async () => {
            if (gameData.finishedCommand) return;

            gameData.finishedCommand = true;
            gameData.status = ':x: The horses took too long to finish!';
            gameData.color = Colors.Red;

            await interaction.editReply({ embeds: [getEmbed(gameData)] });

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
        }, 30_000);
    },
} satisfies Command;
