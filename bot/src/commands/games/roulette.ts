import type { ColorResolvable } from 'discord.js';
import { Colors, EmbedBuilder, ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../domain/Command';
import UserStats from '../../models/userStats';
import { getBet, getRandomNumber, wait } from '../../utils';
import logger from '../../utils/logger';
import { addExperience, addMoney } from '../../utils/money';

type GameData = {
    bet: number;
    space: string;
    ball: number;
    userWon?: boolean;
    multiplier: number;
    embedColor: ColorResolvable;
};

const RED_COLORS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

function checkUserWon(gameData: GameData): void {
    switch (gameData.space) {
        case 'red':
            gameData.userWon = RED_COLORS.includes(gameData.ball);
            gameData.multiplier = 2;
            break;
        case 'black':
            gameData.userWon = !RED_COLORS.includes(gameData.ball);
            gameData.multiplier = 2;
            break;
        case 'odd':
            gameData.userWon = gameData.ball % 2 === 1;
            gameData.multiplier = 2;
            break;
        case 'even':
            gameData.userWon = gameData.ball % 2 === 0;
            gameData.multiplier = 2;
            break;
        case '1st':
            gameData.userWon = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(gameData.ball);
            gameData.multiplier = 3;
            break;
        case '2nd':
            gameData.userWon = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].includes(gameData.ball);
            gameData.multiplier = 3;
            break;
        case '3rd':
            gameData.userWon = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].includes(gameData.ball);
            gameData.multiplier = 3;
            break;
        case '1-12':
            gameData.userWon = gameData.ball >= 1 && gameData.ball <= 12;
            gameData.multiplier = 3;
            break;
        case '13-24':
            gameData.userWon = gameData.ball >= 13 && gameData.ball <= 24;
            gameData.multiplier = 3;
            break;
        case '25-36':
            gameData.userWon = gameData.ball >= 25 && gameData.ball <= 36;
            gameData.multiplier = 3;
            break;
        case '1-18':
            gameData.userWon = gameData.ball >= 1 && gameData.ball <= 18;
            gameData.multiplier = 2;
            break;
        case '19-36':
            gameData.userWon = gameData.ball >= 19 && gameData.ball <= 36;
            gameData.multiplier = 2;
            break;
        default:
            try {
                if (/^\d+$/.test(gameData.space.trim())) {
                    const number = Number.parseInt(gameData.space.trim(), 10);

                    if (number >= 0 && number <= 36) {
                        gameData.userWon = gameData.ball === number;
                        gameData.multiplier = gameData.userWon ? 36 : 1;
                    }
                }
            } catch {
                /* do nothing with the error... */
            }
    }
}

export default {
    data: {
        name: 'roulette',
        description: 'Play a game of roulette.',
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
                name: 'space',
                type: ApplicationCommandOptionType.String,
                description: 'Where you want to lay your bet.',
                required: true,
            },
        ],
        cooldown: 600,
        extraFields: [
            {
                name: 'Bet Formatting',
                value: 'You can use formatting to make it easier to use big numbers.\n\n__For Example:__\n~~1000~~ **1K**\n~~1300~~ **1.3K**\nUse `all` or `max` to use all the money you have or the maximum amount you can bet.',
                inline: false,
            },
            {
                name: 'Space Multiplier',
                value: '[x36] Straight (1, 2, 3, ..., 36)\n[x3] 1-12, 13-24, 25-36\n[x3] 1st, 2nd, 3rd\n[x2] 1-18, 19-36\n[x 2] Odd, Even\n[x2] Red, Black',
                inline: false,
            },
        ],
        image: 'https://cdn.coinzbot.xyz/games/table.png',
    },
    async execute(client, interaction, member) {
        const space = interaction.options.getString('space', true).toLowerCase();

        const { bet, error } = await getBet(client, interaction, member);
        if (error) {
            await interaction.reply({ content: error, ephemeral: true });
            return;
        }

        const gameData: GameData = {
            bet,
            space,
            ball: getRandomNumber(0, 36),
            multiplier: 1,
            embedColor: client.config.embed.color as ColorResolvable,
        };
        checkUserWon(gameData);
        const money = gameData.userWon ? Math.floor(gameData.multiplier * gameData.bet) : -gameData.bet;

        if (gameData.userWon === undefined) {
            await addMoney(interaction.user.id, bet);
            await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
            await interaction.reply({
                content: 'Invalid space, please check all valid spaces using `/help command command:roulette`!',
                ephemeral: true,
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('Roulette')
            .setColor(gameData.embedColor)
            .setDescription('Spinning the wheel...')
            .setImage('https://media3.giphy.com/media/26uf2YTgF5upXUTm0/giphy.gif');
        await interaction.reply({ embeds: [embed] });
        await wait(3500);

        embed.setImage(null);
        embed.setDescription(null);
        embed.setColor(gameData.userWon ? Colors.Green : Colors.Red);
        embed.addFields([
            {
                name: 'Ball',
                value: `The ball landed on **${
                    gameData.ball === 0 ? '' : RED_COLORS.includes(gameData.ball) ? 'red ' : 'black '
                }${gameData.ball}**`,
                inline: false,
            },
            { name: 'Multiplier', value: `${gameData.multiplier}x`, inline: true },
            { name: 'Profit', value: `:coin: ${gameData.userWon ? money - gameData.bet : money}`, inline: true },
        ]);
        await interaction.editReply({ embeds: [embed] });

        if (gameData.userWon) {
            await addExperience(member);
            await addMoney(interaction.user.id, money);

            if (gameData.multiplier === 36) {
                logger.info(
                    `${interaction.user.tag} (${interaction.user.id}) won ${money} coins in roulette! [${gameData.bet} bet | ${gameData.space} space]`,
                );
            }

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
    },
} satisfies Command;
