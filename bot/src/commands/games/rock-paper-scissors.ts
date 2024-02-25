import type { ColorResolvable } from 'discord.js';
import {
    Colors,
    EmbedBuilder,
    ApplicationCommandOptionType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} from 'discord.js';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import UserStats from '../../models/userStats';
import { filter, getBet, getRandomNumber } from '../../utils';
import { addExperience, addMoney } from '../../utils/money';

type Choice = 'paper' | 'rock' | 'scissors';

type GameData = {
    bet: number;
    finishedCommand: boolean;
    multiplier: number;
    playerChoice?: Choice;
    botChoice?: Choice;
    desc?: string;
};

const EMOTES = {
    rock: ':rock:',
    paper: ':page_facing_up:',
    scissors: ':scissors:',
};

function getEmbed(client: Bot, gameData: GameData): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Rock Paper Scissors')
        .setColor(
            gameData.finishedCommand
                ? gameData.multiplier <= 0
                    ? Colors.Red
                    : Colors.Green
                : (client.config.embed.color as ColorResolvable),
        )
        .setDescription(gameData.desc === undefined ? 'Please select one of the buttons below.' : gameData.desc)
        .addFields(
            { name: 'Your Hand', value: `${getEmoteString(gameData.playerChoice)}`, inline: true },
            { name: "Bot's Hand", value: `${getEmoteString(gameData.botChoice)}`, inline: true },
            { name: 'Multiplier', value: `${gameData.multiplier}x`, inline: true },
            {
                name: 'Profit',
                value: `:coin: ${Math.floor(gameData.bet * gameData.multiplier - gameData.bet)}`,
                inline: true,
            },
        );
}

function getEmoteString(choice?: Choice): string {
    if (choice === undefined) return 'Not Yet Chosen';
    return `${EMOTES[choice]} ${choice}`;
}

function getButtons(isDisabled = false, disableStop = false): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('rps_Rock')
            .setLabel('Rock')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(isDisabled),
        new ButtonBuilder()
            .setCustomId('rps_Paper')
            .setLabel('Paper')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(isDisabled),
        new ButtonBuilder()
            .setCustomId('rps_Scissors')
            .setLabel('Scissors')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(isDisabled),
        new ButtonBuilder()
            .setCustomId('rps_stop')
            .setLabel('Stop')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(isDisabled || disableStop),
    );
}

function getChoice(): Choice {
    const choices = ['rock', 'paper', 'scissors'] as Choice[];
    return choices[getRandomNumber(0, choices.length - 1)]!;
}

function getWinner(playerChoice: string, botChoice: string) {
    if (playerChoice === botChoice) return 'draw';

    switch (playerChoice) {
        case 'rock':
            return botChoice === 'paper' ? 'bot' : 'player';
        case 'paper':
            return botChoice === 'scissors' ? 'bot' : 'player';
        case 'scissors':
            return botChoice === 'rock' ? 'bot' : 'player';
        default:
            return 'bot';
    }
}

export default {
    data: {
        name: 'rock-paper-scissors',
        description: 'Play rock paper scissors against the bot.',
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
            multiplier: 0,
            playerChoice: undefined,
            botChoice: undefined,
        };

        const message = await interaction.reply({
            embeds: [getEmbed(client, gameData)],
            components: [getButtons(false, true)],
            fetchReply: true,
        });

        const collector = message.createMessageComponentCollector({
            filter: async (i) => filter(interaction, i),
            idle: 30_000,
            time: 90_000,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (i) => {
            if (gameData.finishedCommand) return;

            if (i.customId === 'rps_stop') {
                gameData.finishedCommand = true;
            } else if (i.customId.startsWith('rps_')) {
                gameData.playerChoice = i.customId.split('_')[1]!.toLowerCase() as Choice;
                gameData.botChoice = getChoice();

                const winner = getWinner(gameData.playerChoice, gameData.botChoice);

                switch (winner) {
                    case 'player':
                        gameData.desc =
                            '**You won against the bot!**\n\nPress `STOP` to stop the game and collect your profit.';
                        gameData.multiplier++;
                        break;
                    case 'draw':
                        gameData.desc = '**Tie!**\n\nPress `STOP` to stop the game and collect your profit.';
                        break;
                    default:
                        gameData.multiplier = 0;
                        gameData.finishedCommand = true;
                        break;
                }
            }

            if (gameData.finishedCommand) {
                collector.stop();

                if (gameData.multiplier <= 0) {
                    gameData.desc = `You lost against the bot! You lost :coin: ${gameData.bet}!`;

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
                } else {
                    gameData.desc = `You stopped the game. You won :coin: ${Math.floor(
                        gameData.bet * gameData.multiplier - gameData.bet,
                    )}!`;

                    const money = Math.floor(gameData.bet * gameData.multiplier);
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
                }
            }

            await i.update({
                embeds: [getEmbed(client, gameData)],
                components: [getButtons(gameData.finishedCommand)],
            });
        });

        collector.on('end', async () => {
            if (!gameData.finishedCommand) {
                gameData.desc = `You didn't choose anything in time! You lost :coin: ${gameData.bet}!`;
                gameData.finishedCommand = true;
                gameData.multiplier = 0;
                await interaction.editReply({
                    embeds: [getEmbed(client, gameData)],
                    components: [getButtons(true, true)],
                });

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
        });
    },
} satisfies Command;
