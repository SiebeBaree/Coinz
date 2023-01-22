import { ApplicationCommandOptionType, ChatInputCommandInteraction, ColorResolvable, Colors, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import User from "../../utils/User";
import Cooldown from "../../utils/Cooldown";
import Helpers from "../../utils/Helpers";

interface GameData {
    bet: number;
    horse: number;
    userWon: boolean;
    finishedCommand: boolean;
    horses: number[];
    status: string;
    color: ColorResolvable;
}

export default class extends Command implements ICommand {
    readonly info = {
        name: "horse-race",
        description: "Bet on the fastest horse to earn money.",
        options: [
            {
                name: "bet",
                type: ApplicationCommandOptionType.String,
                description: "The bet you want to place.",
                required: true,
                min_length: 2,
                max_length: 6,
            },
            {
                name: "horse",
                type: ApplicationCommandOptionType.Integer,
                description: "The horse (1-5) you want to bet on.",
                required: true,
                min_value: 1,
                max_value: 5,
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

        const horse = interaction.options.getInteger("horse", true);

        // setup
        const gameData = {
            bet,
            horse,
            userWon: false,
            finishedCommand: false,
            horses: Array(5).fill(10),
            status: ":checkered_flag: Racing...",
            color: this.client.config.embed.color as ColorResolvable,
        } as GameData;

        await interaction.reply({ embeds: [this.getEmbed(gameData)] });

        // start game
        const interval = setInterval(async () => {
            if (gameData.finishedCommand) {
                clearInterval(interval);
                return;
            }

            for (let i = 0; i < 3; i++) {
                const horseNr = Helpers.getRandomNumber(0, gameData.horses.length - 1);
                gameData.horses[horseNr] = gameData.horses[horseNr] <= 0 ? 0 : gameData.horses[horseNr] - 1;
            }

            const horseWon = gameData.horses.findIndex((h) => h <= 0);

            if (horseWon !== -1) {
                gameData.finishedCommand = true;
                gameData.status = ":trophy: Race has ended!";

                if (horseWon + 1 === gameData.horse) {
                    gameData.userWon = true;
                    gameData.status += `\n:money_with_wings: **Profit:** :coin: ${Math.floor(gameData.bet * 3)}`;
                    gameData.color = Colors.Green;

                    await User.addMoney(interaction.user.id, Math.floor(gameData.bet * 3));
                    await User.addGameExperience(member);
                } else {
                    gameData.userWon = false;
                    gameData.color = Colors.Red;
                }
            }

            await interaction.editReply({ embeds: [this.getEmbed(gameData)] });

            if (gameData.finishedCommand) {
                clearInterval(interval);
                return;
            }
        }, 1500);

        // end game
        setTimeout(async () => {
            if (gameData.finishedCommand) return;

            gameData.finishedCommand = true;
            gameData.status = ":x: The horses took too long to finish!";
            gameData.color = Colors.Red;

            await interaction.editReply({ embeds: [this.getEmbed(gameData)] });
        }, 30000);
    }

    private getEmbed(gameData: GameData): EmbedBuilder {
        const horseStr = gameData.horses.map((horse, index) => `**${index + 1}.** ${"-".repeat(horse)}:horse_racing:`).join("\n");

        return new EmbedBuilder()
            .setTitle("Horse Race")
            .setColor(gameData.color)
            .setDescription(`:moneybag: **Bet:** :coin: ${gameData.bet}\n:1234: **Your Horse:** \`${gameData.horse}\`\n:hourglass: **Status:** ${gameData.status}\n\n${horseStr}`);
    }
}