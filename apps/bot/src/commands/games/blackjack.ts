import type { ColorResolvable } from 'discord.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    Colors,
    EmbedBuilder,
    ApplicationCommandOptionType,
} from 'discord.js';
import { deck, hiddenCard } from '../../data/cards.json';
import type { Command } from '../../domain/Command';
import type { IMember } from '../../models/member';
import UserStats from '../../models/userStats';
import { filter, getBet, getRandomNumber } from '../../utils';
import { addExperience, addMoney, removeMoney } from '../../utils/money';

type Card = {
    name: string;
    emoteId: string;
    value: number;
};

type GameData = {
    bet: number;
    finishedCommand: boolean;
    userWon: boolean;
    tie: boolean;
    color: ColorResolvable;
    userHand: Card[];
    dealerHand: Card[];
    description?: string;
};

function getEmbed(gameData: GameData): EmbedBuilder {
    const desc = gameData.description
        ? `Result: ${gameData.description}`
        : ':boom: `Hit` ― **take another card.**\n:no_entry: `Stand` ― **end the game.**\n:money_with_wings: `Double Down` ― **double your bet, hit once, then stand.**';

    return new EmbedBuilder()
        .setTitle('Blackjack')
        .setColor(gameData.color)
        .setDescription(desc)
        .addFields(
            {
                name: 'Your Hand',
                value: `${getHandString(gameData.userHand)}\n\n**Value:** ${getHandValue(gameData.userHand)}`,
                inline: true,
            },
            {
                name: "Dealer's Hand",
                value: `${getHandString(gameData.dealerHand)}\n\n**Value:** ${getHandValue(gameData.dealerHand)}`,
                inline: true,
            },
        );
}

function getButton(isDisabled = false, doubleDownDisabled = true): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('bj_hit')
            .setLabel('Hit')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(isDisabled),
        new ButtonBuilder()
            .setCustomId('bj_stand')
            .setLabel('Stand')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(isDisabled),
        new ButtonBuilder()
            .setCustomId('bj_doubleDown')
            .setLabel('Double Down')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(isDisabled || doubleDownDisabled),
    );
}

function startGame(gameData: GameData) {
    gameData.userHand.push(getRandomCard());
    gameData.userHand.push(getRandomCard());
    gameData.dealerHand.push(getRandomCard());
    gameData.dealerHand.push(hiddenCard);
}

function endGame(gameData: GameData) {
    gameData.finishedCommand = true;

    if (gameData.dealerHand[1]!.value === 0) {
        gameData.dealerHand[1] = getRandomCard();
    }

    while (getHandValue(gameData.dealerHand) < 17) {
        gameData.dealerHand.push(getRandomCard());
    }
}

function checkStatus(gameData: GameData) {
    const valueUser = getHandValue(gameData.userHand);
    const valueDealer = getHandValue(gameData.dealerHand);
    const finishedBefore = gameData.finishedCommand;

    gameData.userWon = false;
    gameData.tie = false;
    gameData.finishedCommand = true;

    if (valueUser === 21 && valueDealer === 21) {
        gameData.tie = true;
        gameData.description = `Blackjack Push! You got :coin: ${gameData.bet} back.`;
    } else if (valueUser > 21) {
        gameData.description = `You bust! You lost :coin: ${gameData.bet}`;
    } else if (valueUser === 21) {
        gameData.userWon = true;
        gameData.description = `Blackjack! You won :coin: ${getReward(gameData.bet)}`;
    } else if (valueDealer > 21) {
        gameData.userWon = true;
        gameData.description = `Dealer bust! You won :coin: ${getReward(gameData.bet)}`;
    } else if (valueDealer === valueUser && finishedBefore) {
        gameData.tie = true;
        gameData.description = `Push! You got :coin: ${gameData.bet} back.`;
    } else if (valueUser > valueDealer && finishedBefore) {
        gameData.userWon = true;
        gameData.description = `You won :coin: ${getReward(gameData.bet)}`;
    } else if (valueDealer > valueUser && finishedBefore) {
        gameData.description = `You lost :coin: ${gameData.bet}`;
    } else if (!finishedBefore) {
        gameData.finishedCommand = false;
    }
}

function getRandomCard(): Card {
    return deck[getRandomNumber(0, deck.length - 1)]!;
}

function getHandValue(hand: Card[]): number {
    let value = hand.reduce((acc, card) => acc + card.value, 0);

    const hasAce = hand.some((card) => card.value === 11);
    if (hasAce && value > 21) value -= 10;

    return value;
}

function getHandString(hand: Card[]): string {
    return hand.map((card) => `<:${card.name}:${card.emoteId}>`).join(' ');
}

function getReward(bet: number): number {
    return Math.round(bet * 1.5);
}

function runHit(gameData: GameData) {
    gameData.userHand.push(getRandomCard());
    if (gameData.userHand.length >= 6) gameData.finishedCommand = true;
}

function runStand(gameData: GameData) {
    gameData.finishedCommand = true;
}

function runDoubleDown(gameData: GameData) {
    gameData.bet *= 2;
    gameData.userHand.push(getRandomCard());
    gameData.finishedCommand = true;
}

async function finishGame(gameData: GameData, member: IMember) {
    gameData.finishedCommand = true;
    endGame(gameData);
    checkStatus(gameData);
    gameData.color = gameData.userWon ? Colors.Green : Colors.Red;

    if (gameData.userWon) {
        const money = getReward(gameData.bet);
        await addExperience(member);
        await addMoney(member.id, money);

        await UserStats.updateOne(
            { id: member.id },
            {
                $inc: {
                    'games.won': 1,
                    'games.moneyEarned': money,
                },
            },
            { upsert: true },
        );
    } else if (gameData.tie) {
        await addMoney(member.id, gameData.bet);

        await UserStats.updateOne(
            { id: member.id },
            {
                $inc: {
                    'games.tie': 1,
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
                    'games.moneyLost': gameData.bet,
                },
            },
            { upsert: true },
        );
    }
}

export default {
    data: {
        name: 'blackjack',
        description: 'Play a game of blackjack.',
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

        let disableDoubleDown = bet * 2 > member.wallet;
        const gameData: GameData = {
            bet: bet,
            userWon: false,
            finishedCommand: false,
            color: client.config.embed.color as ColorResolvable,
            userHand: [],
            dealerHand: [],
            tie: false,
        };

        startGame(gameData);
        checkStatus(gameData);
        if (gameData.finishedCommand) {
            endGame(gameData);
            checkStatus(gameData);

            if (gameData.userWon) {
                const money = getReward(gameData.bet);
                await addExperience(member);
                await addMoney(interaction.user.id, money);

                if (!member.badges.includes('easy_blackjack')) {
                    await client.achievement.sendAchievementMessage(
                        interaction,
                        member.id,
                        client.achievement.getById('easy_blackjack'),
                        true,
                    );
                }

                await UserStats.updateOne(
                    { id: member.id },
                    {
                        $inc: {
                            'games.won': 1,
                            'games.moneyEarned': money,
                        },
                    },
                    { upsert: true },
                );
            } else if (gameData.tie) {
                await addMoney(interaction.user.id, gameData.bet);

                await UserStats.updateOne(
                    { id: interaction.user.id },
                    {
                        $inc: {
                            'games.tie': 1,
                        },
                    },
                    { upsert: true },
                );
            }
        }

        const message = await interaction.reply({
            embeds: [getEmbed(gameData)],
            components: [getButton(gameData.finishedCommand, disableDoubleDown)],
            fetchReply: true,
        });
        if (gameData.finishedCommand) return;

        const collector = message.createMessageComponentCollector({
            filter: async (i) => filter(interaction, i),
            componentType: ComponentType.Button,
            time: 120_000,
            max: 5,
        });

        collector.on('collect', async (i) => {
            if (gameData.finishedCommand) return;

            if (i.customId.startsWith('bj_')) {
                await i.deferUpdate();
                if (i.customId === 'bj_hit') {
                    runHit(gameData);
                    disableDoubleDown = true;
                } else if (i.customId === 'bj_stand') {
                    runStand(gameData);
                } else if (i.customId === 'bj_doubleDown') {
                    await removeMoney(interaction.user.id, gameData.bet);
                    runDoubleDown(gameData);
                }

                checkStatus(gameData);
                if (gameData.finishedCommand) {
                    await finishGame(gameData, member);
                }

                await interaction.editReply({
                    embeds: [getEmbed(gameData)],
                    components: [getButton(gameData.finishedCommand, disableDoubleDown)],
                });
            }
        });

        collector.on('end', async () => {
            if (!gameData.finishedCommand) {
                await finishGame(gameData, member);
                await interaction.editReply({
                    embeds: [getEmbed(gameData)],
                    components: [getButton(gameData.finishedCommand, disableDoubleDown)],
                });
            }
        });
    },
} satisfies Command;
