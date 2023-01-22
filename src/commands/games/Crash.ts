import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, Colors, ComponentType, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import User from "../../utils/User";
import Cooldown from "../../utils/Cooldown";

interface GameData {
    profit: number;
    multiplier: number;
    userWon: boolean;
    finishedCommand: boolean;
    color: ColorResolvable;
}

export default class extends Command implements ICommand {
    readonly info = {
        name: "crash",
        description: "Are you fast enough to sell before the market crashes?",
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

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const betStr = interaction.options.getString("bet", true);

        let bet = 50;
        if (betStr.toLowerCase() === "all" || betStr.toLowerCase() === "max") {
            if (member.wallet <= 0) {
                await Cooldown.removeCooldown(interaction.user.id, this.info.name);
                await interaction.reply({ content: "You don't have any money in your wallet to bet!", ephemeral: true });
                return;
            }

            bet = Math.min(member.wallet, member.premium.active && member.premium.tier === 2 ? 15_000 : (member.premium.active ? 10_000 : 5_000));
        } else {
            const newBet = await User.removeBetMoney(betStr, member);

            if (typeof newBet === "string") {
                await Cooldown.removeCooldown(interaction.user.id, this.info.name);
                await interaction.reply({ content: newBet, ephemeral: true });
                return;
            }

            bet = newBet;
        }

        // setup
        const gameData: GameData = {
            profit: Math.round(bet * 0.8) - bet,
            multiplier: 0.8,
            userWon: false,
            finishedCommand: false,
            color: this.client.config.embed.color as ColorResolvable,
        };

        const message = await interaction.reply({ embeds: [this.getEmbed(gameData)], components: [this.getButton(gameData.finishedCommand)], fetchReply: true });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, componentType: ComponentType.Button, time: 20_000, max: 1 });

        collector.on("collect", async (i) => {
            if (i.customId === "crash_sell" && !gameData.finishedCommand) {
                gameData.finishedCommand = true;
                gameData.userWon = true;
                gameData.color = Colors.Green;
                collector.stop();

                await User.addMoney(interaction.user.id, gameData.profit + bet);
                await User.addGameExperience(member);
                await interaction.editReply({ embeds: [this.getEmbed(gameData)], components: [this.getButton(gameData.finishedCommand)] });
            }
            await i.deferUpdate();
        });

        collector.on("end", async () => {
            if (!gameData.finishedCommand) {
                gameData.finishedCommand = true;
                await interaction.editReply({ components: [this.getButton(gameData.finishedCommand)] });
            }
        });

        const interval = setInterval(async () => {
            if (gameData.finishedCommand) {
                clearInterval(interval);
                return;
            }

            gameData.multiplier += 0.2;
            gameData.profit = Math.round(bet * gameData.multiplier) - bet;

            if (Math.random() <= 0.17) {
                gameData.userWon = false;
                gameData.finishedCommand = true;
                gameData.color = Colors.Red;

                clearInterval(interval);
                collector.stop();
            }

            await interaction.editReply({ embeds: [this.getEmbed(gameData)], components: [this.getButton(gameData.finishedCommand)] });

            if (gameData.finishedCommand) {
                clearInterval(interval);
                return;
            }
        }, 2000);

        setTimeout(async () => {
            clearInterval(interval);

            if (!gameData.finishedCommand) {
                gameData.finishedCommand = true;
                await interaction.editReply({ components: [this.getButton(gameData.finishedCommand)] });
                return;
            }
        }, 20_000);
    }

    private getEmbed(gameData: GameData): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle("Crash")
            .setColor(gameData.color)
            .setDescription("Every **2 seconds** the multiplier goes up by **0.2x**.\nEvery time this happens you have **17%** chance to **lose** all money.\nTo claim the profits, press the sell button.")
            .addFields(
                { name: "Profit", value: `:coin: ${gameData.profit}`, inline: true },
                { name: "Multiplier", value: `${Math.round(gameData.multiplier * 10) / 10}x`, inline: true },
            );
    }

    private getButton(isDisabled = false): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("crash_sell")
                    .setLabel("Sell")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(isDisabled),
            );
    }
}