import type { ColorResolvable } from 'discord.js';
import { EmbedBuilder, ApplicationCommandOptionType } from 'discord.js';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import UserStats from '../../models/userStats';
import { getBet, getRandomNumber, wait } from '../../utils';
import { addExperience, addMoney } from '../../utils/money';

type GameData = {
    bet: number;
    board: string;
    profit: number;
};

const BOARD_SIZE = 3;
const SPINNING_SYMBOL = '<a:spinning_slots:949712124165365810>';

const PAYOUTS = {
    '💯': {
        fullRow: 5,
        halfRow: 1.5,
    },
    '💰': {
        fullRow: 4,
        halfRow: 1.2,
    },
    '💵': {
        fullRow: 3,
        halfRow: 1,
    },
    '💎': {
        fullRow: 2,
        halfRow: 0.8,
    },
    '🥇': {
        fullRow: 1.5,
        halfRow: 0.5,
    },
};
const SYMBOLS = Object.keys(PAYOUTS);

function countSymbols(board: string): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const symbol of board) {
        if (symbol === ' ' || symbol === '⬅️') continue;
        counts[symbol] = (counts[symbol] || 0) + 1;
    }

    return counts;
}

function mostOccurringSymbol(board: string): { symbol: keyof typeof PAYOUTS; count: number } {
    const counts = countSymbols(board);
    let maxCount = 0;
    let mostOccurringSymbol = '';
    for (const symbol in counts) {
        if (counts[symbol]! > maxCount) {
            maxCount = counts[symbol]!;
            mostOccurringSymbol = symbol;
        }
    }

    return { symbol: mostOccurringSymbol as keyof typeof PAYOUTS, count: maxCount };
}

function generateBoard(): string {
    return Array.from({ length: BOARD_SIZE }, () => SYMBOLS[getRandomNumber(0, SYMBOLS.length - 1)]).join(' ');
}

function getEmbed(client: Bot, gameData: GameData, isSpinning: boolean): EmbedBuilder {
    const board = isSpinning
        ? [
              SPINNING_SYMBOL.repeat(BOARD_SIZE),
              `${SPINNING_SYMBOL.repeat(BOARD_SIZE)} ⬅️`,
              SPINNING_SYMBOL.repeat(BOARD_SIZE),
          ]
        : [generateBoard(), `${gameData.board} ⬅️`, generateBoard()];

    return new EmbedBuilder()
        .setTitle('Slot Machine')
        .setColor(client.config.embed.color as ColorResolvable)
        .setDescription('Spinning the slots...')
        .addFields([
            {
                name: 'Board',
                value: `${board.join('\n')}`,
                inline: false,
            },
            {
                name: 'Profit',
                value: `:coin: ${Math.round(gameData.profit - gameData.bet)}`,
                inline: false,
            },
            {
                name: 'Payouts',
                value: Object.entries(PAYOUTS)
                    .map(
                        ([symbol, { fullRow, halfRow }]) =>
                            `${symbol.repeat(3)}: ${fullRow}x | ${symbol.repeat(2)}: ${halfRow}x`,
                    )
                    .join('\n'),
                inline: false,
            },
        ]);
}

export default {
    data: {
        name: 'slots',
        description: 'Play the slot machine and win big!',
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
        premium: 1,
    },
    async execute(client, interaction, member) {
        const { bet, error } = await getBet(client, interaction, member);
        if (error) {
            await interaction.reply({ content: error, ephemeral: true });
            return;
        }

        const gameData: GameData = {
            bet,
            board: generateBoard(),
            profit: 0,
        };

        await interaction.reply({ embeds: [getEmbed(client, gameData, true)] });
        await wait(3000);

        const winData = mostOccurringSymbol(gameData.board);
        if (winData.count >= 2) {
            const payout = winData.count === 3 ? PAYOUTS[winData.symbol].fullRow : PAYOUTS[winData.symbol].halfRow;
            gameData.profit = Math.round(bet * payout);

            await addMoney(member.id, gameData.profit);
            await addExperience(member);

            await UserStats.updateOne(
                { id: member.id },
                {
                    $inc: {
                        'games.won': 1,
                        'games.moneyEarned': gameData.profit,
                    },
                },
                { upsert: true },
            );
        } else {
            await UserStats.updateOne(
                { id: member.id },
                {
                    $inc: {
                        'games.lost': 1,
                        'games.moneyLost': bet,
                    },
                },
                { upsert: true },
            );
        }

        await interaction.editReply({ embeds: [getEmbed(client, gameData, false)] });
    },
} satisfies Command;
