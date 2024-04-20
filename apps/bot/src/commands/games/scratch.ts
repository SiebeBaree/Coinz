import type { ColorResolvable } from 'discord.js';
import { EmbedBuilder, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import UserStats from '../../models/userStats';
import { filter, getBet, getRandomNumber } from '../../utils';
import { addExperience, addMoney } from '../../utils/money';

type GameData = {
    bet: number;
    finishedCommand: boolean;
    board: {
        symbol: string;
        scratched: boolean;
    }[][];
    buttonsClicked: number;
    multiplier: number;
};

const BOARD_SIZE = 5;
const MAX_CLICKS = 3;
const SYMBOLS = {
    default: '💸',
    scratched: '⬛',
};
const VALUES = {
    '🎲': {
        value: 0.6,
        quantity: 5,
    },
    '💰': {
        value: 0.8,
        quantity: 3,
    },
    '🎁': {
        value: 1,
        quantity: 2,
    },
    '💎': {
        value: 1.5,
        quantity: 1,
    },
};

function generateBoard(): GameData['board'] {
    const board: GameData['board'] = [];

    for (let i = 0; i < BOARD_SIZE; i++) {
        const row: GameData['board'][number] = [];

        for (let j = 0; j < BOARD_SIZE; j++) {
            row.push({
                symbol: SYMBOLS.default,
                scratched: false,
            });
        }

        board.push(row);
    }

    const symbols = Object.keys(VALUES) as (keyof typeof VALUES)[];
    for (const symbol of symbols) {
        const quantity = VALUES[symbol].quantity;

        for (let j = 0; j < quantity; j++) {
            let x = getRandomNumber(0, BOARD_SIZE - 1);
            let y = getRandomNumber(0, BOARD_SIZE - 1);

            while (board[x]![y]!.symbol !== SYMBOLS.default) {
                x = getRandomNumber(0, BOARD_SIZE - 1);
                y = getRandomNumber(0, BOARD_SIZE - 1);
            }

            board[x]![y]!.symbol = symbol;
        }
    }

    return board;
}

function getEmbed(client: Bot, gameData: GameData): EmbedBuilder {
    const keys = Object.keys(VALUES) as (keyof typeof VALUES)[];
    const loot = keys.map((symbol) => `${symbol} will multiply with \`${VALUES[symbol].value}x\``).join('\n');

    return new EmbedBuilder()
        .setTitle('Scratch Card')
        .setColor(client.config.embed.color as ColorResolvable)
        .addFields(
            {
                name: 'Statistics',
                value: `:star: **Scratch Fields:** ${
                    MAX_CLICKS - gameData.buttonsClicked
                } left\n:moneybag: **Profit:** :coin: ${
                    Math.floor(gameData.bet * gameData.multiplier) - gameData.bet
                }.`,
                inline: true,
            },
            { name: 'Loot Table', value: loot ?? "Wait?? I couldn't find any multipliers?!", inline: true },
        );
}

function setButtons(gameData: GameData): ActionRowBuilder<ButtonBuilder>[] {
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];

    for (let i = 0; i < BOARD_SIZE; i++) {
        const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>();

        for (let j = 0; j < BOARD_SIZE; j++) {
            let emoji = gameData.board[i]![j]!.scratched
                ? gameData.board[i]![j]!.symbol === SYMBOLS.default
                    ? SYMBOLS.scratched
                    : gameData.board[i]![j]!.symbol
                : SYMBOLS.default;

            if (gameData.finishedCommand) {
                emoji =
                    gameData.board[i]![j]!.symbol === SYMBOLS.default
                        ? SYMBOLS.scratched
                        : gameData.board[i]![j]!.symbol;
            }

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`scratch_board${i}-${j}`)
                    .setEmoji(emoji)
                    .setStyle(
                        gameData.board[i]![j]!.scratched && gameData.board[i]![j]!.symbol !== SYMBOLS.default
                            ? ButtonStyle.Success
                            : gameData.board[i]![j]!.scratched
                              ? ButtonStyle.Danger
                              : ButtonStyle.Secondary,
                    )
                    .setDisabled(gameData.board[i]![j]!.scratched || gameData.finishedCommand),
            );
        }

        rows.push(row);
    }

    return rows;
}

export default {
    data: {
        name: 'scratch',
        description: 'Scratch a card to win money!',
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
        usage: ['<bet>'],
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
            board: generateBoard(),
            buttonsClicked: 0,
            multiplier: 0,
        };

        const message = await interaction.reply({
            embeds: [getEmbed(client, gameData)],
            components: setButtons(gameData),
            fetchReply: true,
        });

        const collector = message.createMessageComponentCollector({
            filter: async (i) => filter(interaction, i),
            max: MAX_CLICKS + 1,
            idle: 20_000,
            time: 90_000,
        });

        collector.on('collect', async (i) => {
            if (gameData.finishedCommand) return;

            if (i.customId.startsWith('scratch_board')) {
                const [x, y] = i.customId
                    .replace('scratch_board', '')
                    .split('-')
                    .map((n) => Number.parseInt(n, 10)) as [number, number];
                const symbol = gameData.board[x]![y]!.symbol as keyof typeof VALUES;

                if (!gameData.board[x]![y]!.scratched && symbol !== SYMBOLS.default) {
                    gameData.multiplier += VALUES[symbol].value;
                }

                gameData.board[x]![y]!.scratched = true;
                gameData.buttonsClicked++;
                if (gameData.buttonsClicked >= MAX_CLICKS || gameData.finishedCommand) {
                    gameData.finishedCommand = true;
                    collector.stop();

                    const money = Math.floor(gameData.bet * gameData.multiplier);
                    await addMoney(interaction.user.id, money);
                    await addExperience(member);
                    await UserStats.updateOne(
                        { id: interaction.user.id },
                        {
                            $inc: {
                                'games.moneyEarned': money,
                            },
                        },
                        { upsert: true },
                    );
                }

                await i.update({ embeds: [getEmbed(client, gameData)], components: setButtons(gameData) });
            }
        });

        collector.on('end', async () => {
            if (!gameData.finishedCommand) {
                gameData.finishedCommand = true;
                await interaction.editReply({ embeds: [getEmbed(client, gameData)], components: setButtons(gameData) });

                const money = Math.floor(gameData.bet * gameData.multiplier);
                await addMoney(interaction.user.id, money);
                await UserStats.updateOne(
                    { id: interaction.user.id },
                    {
                        $inc: {
                            'games.moneyEarned': money,
                        },
                    },
                    { upsert: true },
                );
            }
        });
    },
} satisfies Command;
