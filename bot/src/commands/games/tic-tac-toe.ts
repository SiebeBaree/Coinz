import type { ColorResolvable, User, ButtonInteraction } from 'discord.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    ApplicationCommandOptionType,
} from 'discord.js';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import { getMember } from '../../lib/database';
import UserStats from '../../models/userStats';
import { getBet } from '../../utils';
import { addExperience, addMoney, removeMoney } from '../../utils/money';

type GameData = {
    bet: number;
    finishedCommand: boolean;
    gameHasStarted: boolean;
    currentUser: string;
    board: string[][];
    secondUser: User;
    hostWon: boolean | null;
    description?: string;
    tie: boolean;
};

const BOARD_SIZE = 3;
const SYMBOL_FIRST_PLAYER = '❌';
const SYMBOL_SECOND_PLAYER = '⭕';

function checkWinner(gameData: GameData): void {
    let gameWon = '';
    const x = SYMBOL_FIRST_PLAYER.repeat(BOARD_SIZE);
    const o = SYMBOL_SECOND_PLAYER.repeat(BOARD_SIZE);

    // Check horizontally
    for (let i = 0; i < BOARD_SIZE; i++) {
        if (gameData.board[i]!.join('') === x) {
            gameWon = 'host';
        } else if (gameData.board[i]!.join('') === o) {
            gameWon = 'user';
        }

        if (gameWon) break;
    }

    // Check vertically
    for (let i = 0; i < BOARD_SIZE; i++) {
        let column = '';
        for (let j = 0; j < BOARD_SIZE; j++) column += gameData.board[j]![i];

        if (column === x) {
            gameWon = 'host';
        } else if (column === o) {
            gameWon = 'user';
        }

        if (gameWon !== '') break;
    }

    // Check diagonal (upper left to bottom right)
    if (gameWon === '') {
        let diagonal = '';
        for (let i = 0; i < BOARD_SIZE; i++) diagonal += gameData.board[i]![i];

        if (diagonal === x) {
            gameWon = 'host';
        } else if (diagonal === o) {
            gameWon = 'user';
        }
    }

    // Check diagonal (bottom left to upper right)
    if (gameWon === '') {
        let diagonal = '';
        // -1 because its an index and indexes start at 0
        for (let i = 0; i < BOARD_SIZE; i++) diagonal += gameData.board[BOARD_SIZE - i - 1]![i];

        if (diagonal === x) {
            gameWon = 'host';
        } else if (diagonal === o) {
            gameWon = 'user';
        }
    }

    // check if board is full
    let emptySpace = 0;
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (gameData.board[i]![j] === '') emptySpace++;
        }
    }

    if (emptySpace === 0 || gameWon !== '') gameData.finishedCommand = true;
    if (emptySpace === 0) gameData.tie = true;
    if (gameWon === 'host') gameData.hostWon = true;
    else if (gameWon === 'user') gameData.hostWon = false;
}

function getEmbed(client: Bot, gameData: GameData): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Tic Tac Toe')
        .setColor(client.config.embed.color as ColorResolvable)
        .setDescription(
            gameData.description ??
                'Try to get your symbol (:x: or :o:) in a row (horizontally, vertically or diagonal).',
        )
        .addFields(
            { name: 'Bet', value: `:coin: ${gameData.bet}`, inline: true },
            { name: 'Second Player', value: `<@${gameData.secondUser.id}>`, inline: true },
            { name: 'Turn Of', value: `<@${gameData.currentUser}>`, inline: true },
        );
}

function getButtons(gameData: GameData, disabled = false): ActionRowBuilder<ButtonBuilder>[] {
    const actionRows = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        const actionRow = new ActionRowBuilder<ButtonBuilder>();

        for (let j = 0; j < BOARD_SIZE; j++) {
            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`ttt_board${i}-${j}`)
                    .setEmoji(gameData.board[i]![j] === '' ? '⬜' : gameData.board[i]![j]!)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(gameData.board[i]![j] !== '' || disabled || gameData.finishedCommand),
            );
        }

        actionRows.push(actionRow);
    }

    return actionRows;
}

function getConfirmButtons(disabled = false): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('ttt_accept')
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId('ttt_decline')
            .setLabel('Decline')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled),
    );
}

export default {
    data: {
        name: 'tic-tac-toe',
        description: "Connect 3 X's or O's in a row to win the game. Must be played with 2 users.",
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
                name: 'user',
                type: ApplicationCommandOptionType.User,
                description: 'Tag your second player here.',
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
        ],
    },
    async execute(client, interaction, member) {
        const secondUser = interaction.options.getUser('user', true);
        if (secondUser.bot || secondUser.id === interaction.user.id) {
            await interaction.reply({ content: "You can't play against a bot or yourself!", ephemeral: true });
            await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
            return;
        }

        const { bet, error } = await getBet(client, interaction, member);
        if (error) {
            await interaction.reply({ content: error, ephemeral: true });
            return;
        }

        const secondMember = await getMember(secondUser.id);
        if (!secondMember || secondMember.wallet < bet) {
            await interaction.reply({
                content: "The second player doesn't have enough money in their wallet to bet!",
                ephemeral: true,
            });
            await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
            await addMoney(interaction.user.id, bet);
            return;
        }

        const gameData: GameData = {
            bet,
            finishedCommand: false,
            gameHasStarted: false,
            currentUser: secondUser.id,
            board: [
                ['', '', ''],
                ['', '', ''],
                ['', '', ''],
            ],
            secondUser,
            hostWon: null,
            tie: false,
        };

        const gameMessage = await interaction.reply({
            content: `**${interaction.user.tag}** has challenged ${secondUser} to a game of Tic Tac Toe!\nDo you accept?`,
            components: [getConfirmButtons()],
            fetchReply: true,
        });

        const filter = async (i: ButtonInteraction) => {
            if (i.user.id === gameData.currentUser) return true;
            await i.reply({
                content: "It's not your turn or you are not a player in this game.",
                ephemeral: true,
                target: i.user,
            });
            return false;
        };

        const collector = gameMessage.createMessageComponentCollector({
            filter,
            componentType: ComponentType.Button,
            time: 30_000 + 15_000 * (BOARD_SIZE * BOARD_SIZE),
        });

        collector.on('collect', async (i) => {
            if (gameData.finishedCommand) return;

            if (i.customId === 'ttt_accept') {
                gameData.gameHasStarted = true;
                gameData.currentUser = interaction.user.id;

                await i.update({
                    content: '',
                    embeds: [getEmbed(client, gameData)],
                    components: getButtons(gameData),
                });
                await removeMoney(secondUser.id, bet);
            } else if (i.customId === 'ttt_decline') {
                gameData.finishedCommand = true;
                await i.deferUpdate();
                await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
                await addMoney(interaction.user.id, bet);
                collector.stop();
            } else if (i.customId.startsWith('ttt_board')) {
                const [row, column] = i.customId
                    .replace('ttt_board', '')
                    .split('-')
                    .map((x) => Number.parseInt(x, 10));

                if (gameData.board[row ?? 0]![column ?? 0] !== '') {
                    await i.reply({ content: ":x: You can't place your symbol here!", ephemeral: true });
                    return;
                }

                if (!i.deferred) await i.deferUpdate();
                gameData.board[row ?? 0]![column ?? 0] =
                    gameData.currentUser === interaction.user.id ? SYMBOL_FIRST_PLAYER : SYMBOL_SECOND_PLAYER;
                gameData.currentUser =
                    gameData.currentUser === interaction.user.id ? gameData.secondUser.id : interaction.user.id;

                checkWinner(gameData);
                if (gameData.finishedCommand && gameData.hostWon !== null) {
                    await addMoney(gameData.hostWon ? interaction.user.id : gameData.secondUser.id, bet * 2);
                    await addMoney(gameData.hostWon ? gameData.secondUser.id : interaction.user.id, -bet);
                    await addExperience(gameData.hostWon ? member : secondMember);

                    await UserStats.updateOne(
                        { id: gameData.hostWon ? member.id : secondMember.id },
                        {
                            $inc: {
                                'games.won': 1,
                                'games.moneyEarned': bet * 2,
                            },
                        },
                        { upsert: true },
                    );
                    await UserStats.updateOne(
                        { id: gameData.hostWon ? secondMember.id : member.id },
                        {
                            $inc: {
                                'games.lost': 1,
                                'games.moneyLost': bet,
                            },
                        },
                        { upsert: true },
                    );
                } else if (gameData.finishedCommand && gameData.hostWon === null) {
                    await addMoney(interaction.user.id, bet);
                    await addMoney(gameData.secondUser.id, bet);
                }

                if (gameData.finishedCommand) {
                    collector.stop();
                    await interaction.followUp({
                        content:
                            gameData.hostWon === null
                                ? 'The game has ended in a tie!'
                                : `**${gameData.hostWon ? interaction.user.tag : gameData.secondUser.tag}** has won :coin: ${gameData.bet * 2}!`,
                    });
                }

                await interaction.editReply({
                    embeds: [getEmbed(client, gameData)],
                    components: getButtons(gameData),
                });
            }
        });

        collector.on('end', async () => {
            if (gameData.finishedCommand) return;

            if (gameData.gameHasStarted) {
                await interaction.editReply({ components: getButtons(gameData, true) });

                if (gameData.hostWon === null && !gameData.tie) {
                    await interaction.followUp({
                        content: `**${gameData.currentUser === interaction.user.id ? gameData.secondUser.tag : interaction.user.tag}** has won the game because **${gameData.currentUser === interaction.user.id ? interaction.user.tag : gameData.secondUser.tag}** took too long to respond!`,
                    });
                    await addMoney(
                        gameData.currentUser === interaction.user.id ? gameData.secondUser.id : interaction.user.id,
                        bet,
                    );
                }
            } else {
                await interaction.editReply({ components: [getConfirmButtons(true)] });
                await addMoney(interaction.user.id, bet);
            }
        });
    },
} satisfies Command;
