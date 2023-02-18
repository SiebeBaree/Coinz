import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, Colors, ComponentType, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import Cooldown from "../../utils/Cooldown";
import User from "../../utils/User";
import { IGuild } from "../../models/Guild";

type Choice = "rock" | "paper" | "scissors";

interface GameData {
    bet: number;
    finishedCommand: boolean;
    multiplier: number;
    playerChoice?: Choice;
    botChoice?: Choice;
    desc?: string;
}

export default class extends Command implements ICommand {
    readonly info = {
        name: "rock-paper-scissors",
        description: "Play rock paper scissors againt the bot.",
        options: [
            {
                name: "bet",
                type: ApplicationCommandOptionType.String,
                description: "The bet you want to place.",
                required: true,
                min_length: 2,
                max_length: 6,
            },
        ],
        category: "games",
        extraFields: [
            { name: "Bet Formatting", value: "You can use formatting to make it easier to use big numbers.\n\n__For Example:__\n~~1000~~ **1K**\n~~1300~~ **1.3K**\nUse `all` or `max` to use a maximum of :coin: 5000.", inline: false },
        ],
        cooldown: 420,
    };

    private readonly emotes = {
        rock: ":rock:",
        paper: ":page_facing_up:",
        scissors: ":scissors:",
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember, guild: IGuild) {
        const betStr = interaction.options.getString("bet", true);

        let bet = 50;
        if (betStr.toLowerCase() === "all" || betStr.toLowerCase() === "max") {
            if (member.wallet <= 0) {
                await Cooldown.removeCooldown(interaction.user.id, this.info.name);
                await interaction.reply({ content: "You don't have any money in your wallet to bet!", ephemeral: true });
                return;
            }

            bet = Math.min(member.wallet, member.premium.active && member.premium.tier === 2 ? 15_000 : (member.premium.active || guild.premium.active ? 10_000 : 5_000));
        } else {
            const newBet = await User.removeBetMoney(betStr, member, guild);

            if (typeof newBet === "string") {
                await Cooldown.removeCooldown(interaction.user.id, this.info.name);
                await interaction.reply({ content: newBet, ephemeral: true });
                return;
            }

            bet = newBet;
        }

        const gameData: GameData = {
            bet,
            finishedCommand: false,
            multiplier: 0,
            playerChoice: undefined,
            botChoice: undefined,
        };

        const message = await interaction.reply({ embeds: [this.getEmbed(gameData)], components: [this.getButtons(false, true)], fetchReply: true });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, idle: 20_000, time: 45_000, componentType: ComponentType.Button });

        collector.on("collect", async (i) => {
            if (gameData.finishedCommand) return;

            if (i.customId === "rps_stop") {
                gameData.finishedCommand = true;
                gameData.desc = `You stopped the game. You won :coin: ${Math.floor(gameData.bet * gameData.multiplier - gameData.bet)}!`;
            } else if (i.customId.startsWith("rps_")) {
                gameData.playerChoice = i.customId.split("_")[1].toLowerCase() as Choice;
                gameData.botChoice = this.getChoice();

                const winner = this.getWinner(gameData.playerChoice, gameData.botChoice);

                switch (winner) {
                    case "player":
                        gameData.desc = "**You won against the bot!**\n\nPress `STOP` to stop the game and collect your profit.";
                        gameData.multiplier++;
                        break;
                    case "draw":
                        gameData.desc = "**Tie!**\n\nPress `STOP` to stop the game and collect your profit.";
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
                } else {
                    await User.addMoney(interaction.user.id, Math.floor(gameData.bet * gameData.multiplier - gameData.bet));
                    await User.addGameExperience(member, guild);
                }
            }

            await i.update({ embeds: [this.getEmbed(gameData)], components: [this.getButtons(gameData.finishedCommand)] });
        });

        collector.on("end", async () => {
            if (!gameData.finishedCommand) {
                gameData.desc = `You didn't choose anything in time! You lost :coin: ${gameData.bet}!`;
                gameData.finishedCommand = true;
                gameData.multiplier = 0;
                await interaction.editReply({ embeds: [this.getEmbed(gameData)], components: [this.getButtons(true, true)] });
            }
        });
    }

    private getEmbed(gameData: GameData): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle("Rock Paper Scissors")
            .setColor(gameData.finishedCommand ? gameData.multiplier <= 0 ? Colors.Red : Colors.Green : <ColorResolvable>this.client.config.embed.color)
            .setDescription(gameData.desc === undefined ? "Please select one of the buttons below." : gameData.desc)
            .addFields(
                { name: "Your Hand", value: `${this.getEmoteString(gameData.playerChoice)}`, inline: true },
                { name: "Bot's Hand", value: `${this.getEmoteString(gameData.botChoice)}`, inline: true },
                { name: "Multiplier", value: `${gameData.multiplier}x`, inline: true },
                { name: "Profit", value: `:coin: ${Math.floor(gameData.bet * gameData.multiplier - gameData.bet)}`, inline: true },
            );
    }

    private getEmoteString(choice?: Choice): string {
        if (choice === undefined) return "Not Yet Chosen";
        return `${this.emotes[choice]} ${choice}`;
    }

    private getButtons(isDisabled = false, disableStop = false): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("rps_Rock")
                .setLabel("Rock")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("rps_Paper")
                .setLabel("Paper")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("rps_Scissors")
                .setLabel("Scissors")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("rps_stop")
                .setLabel("Stop")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(isDisabled || disableStop),
        );
    }

    private getChoice(): Choice {
        const choices = ["rock", "paper", "scissors"] as Choice[];
        return choices[Math.floor(Math.random() * choices.length)];
    }

    private getWinner(playerChoice: string, botChoice: string) {
        if (playerChoice === botChoice) return "draw";

        switch (playerChoice) {
            case "rock":
                return botChoice === "paper" ? "bot" : "player";
            case "paper":
                return botChoice === "scissors" ? "bot" : "player";
            case "scissors":
                return botChoice === "rock" ? "bot" : "player";
            default:
                return "bot";
        }
    }
}