import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, Colors, ComponentType, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import Cooldown from "../../utils/Cooldown";
import User from "../../utils/User";

interface GameData {
    bet: number;
    finishedCommand: boolean;
    playerWon: boolean;
    number: number;
    timesCorrect: number;
    color: ColorResolvable;
}

export default class extends Command implements ICommand {
    readonly info = {
        name: "higherlower",
        description: "Is the next number higher, lower or the same as the current number.",
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

        const gameData: GameData = {
            bet,
            finishedCommand: false,
            playerWon: true,
            number: this.getNumber(),
            timesCorrect: 0,
            color: <ColorResolvable>this.client.config.embed.color,
        };

        const message = await interaction.reply({ embeds: [this.getEmbed(gameData)], components: [this.getButtons(gameData.finishedCommand)], fetchReply: true });
        const collector = message.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, idle: 15_000, time: 90_000, componentType: ComponentType.Button });

        collector.on("collect", async (i) => {
            if (gameData.finishedCommand) return;

            const button = i.customId.replace("hl_", "");
            const nextNumber = this.getNumber();

            if (button === "stop") {
                gameData.finishedCommand = true;
                gameData.playerWon = true;
                gameData.color = Colors.Green;
                collector.stop();
            }

            if (button === "higher" && nextNumber > gameData.number ||
                button === "lower" && nextNumber < gameData.number ||
                button === "jackpot" && nextNumber === gameData.number) {
                gameData.timesCorrect++;
            } else {
                gameData.finishedCommand = true;
                gameData.playerWon = false;
                gameData.color = Colors.Red;
                collector.stop();
            }

            if (gameData.timesCorrect >= 5) {
                gameData.finishedCommand = true;
                gameData.playerWon = true;
                gameData.color = Colors.Green;
                collector.stop();
            }

            gameData.number = nextNumber;

            if (gameData.finishedCommand && gameData.playerWon) {
                await User.addMoney(interaction.user.id, this.getPrice(gameData.bet, gameData.timesCorrect));
            }

            await i.update({ embeds: [this.getEmbed(gameData)], components: [this.getButtons(gameData.finishedCommand)] });
        });

        collector.on("end", async () => {
            if (!gameData.finishedCommand) {
                gameData.finishedCommand = true;
                gameData.playerWon = true;
                gameData.color = Colors.Green;

                await User.addMoney(interaction.user.id, this.getPrice(gameData.bet, gameData.timesCorrect));
                await interaction.editReply({ embeds: [this.getEmbed(gameData)], components: [this.getButtons(true)] });
                return;
            }
        });
    }

    private getEmbed(gameData: GameData): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle("Higher Lower")
            .setColor(gameData.color)
            .setDescription(":point_up: `Higher` ― **The next number is higher.**\n" +
                ":point_down: `Lower` ― **The next number is lower.**\n:boom: `Jackpot` ― **The next number is the same.**\n" +
                ":negative_squared_cross_mark: `Stop` ― **Stop the game an claim your money.**" +
                `\n\n**Current Number:** \`${gameData.number}\` *(Between 1-99)*\n**Correct Guesses:** \`${gameData.timesCorrect}\`` +
                `\n\n:money_with_wings: **Profit:** :coin: ${this.getPrice(gameData.bet, gameData.timesCorrect, gameData.playerWon)}`);
    }

    private getButtons(isDisabled = false): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("hl_higher")
                .setLabel("Higher")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("☝️")
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("hl_lower")
                .setLabel("Lower")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("👇")
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("hl_jackpot")
                .setLabel("Jackpot")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("💥")
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("hl_stop")
                .setLabel("Stop")
                .setStyle(ButtonStyle.Danger)
                .setEmoji("❎")
                .setDisabled(isDisabled),
        );
    }

    private getPrice(bet: number, timesCorrect: number, playerWon = true): number {
        return playerWon ? Math.floor(bet * (timesCorrect / 3)) : -bet;
    }

    private getNumber(): number {
        return Math.floor(Math.random() * 100);
    }
}