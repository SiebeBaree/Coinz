import { ApplicationCommandOptionType, ChatInputCommandInteraction, ColorResolvable, Colors, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import Cooldown from "../../utils/Cooldown";
import User from "../../utils/User";
import Helpers from "../../utils/Helpers";

interface GameData {
    bet: number;
    finishedCommand: boolean;
    userWon: boolean | null;
    space: string;
    ball: number;
    multiplier: number;
    color: ColorResolvable;
}

export default class extends Command implements ICommand {
    readonly info = {
        name: "roulette",
        description: "Play a game of roulette.",
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
                name: "space",
                type: ApplicationCommandOptionType.String,
                description: "Where you want to lay your bet.",
                required: true,
            },
        ],
        category: "games",
        extraFields: [
            { name: "Bet Formatting", value: "You can use formatting to make it easier to use big numbers.\n\n__For Example:__\n~~1000~~ **1K**\n~~1300~~ **1.3K**\nUse `all` or `max` to use a maximum of :coin: 5000.", inline: false },
            { name: "Space Multiplier", value: "[x36] Straight (1, 2, 3, ..., 36)\n[x3] 1-12, 13-24, 25-36\n[x3] 1st, 2nd, 3rd\n[x2] 1-18, 19-36\n[x 2] Odd, Even\n[x2] red, black", inline: false },
        ],
        image: "https://cdn.coinzbot.xyz/games/roulette/table.png",
        cooldown: 420,
    };

    private readonly RedColors = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

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

            bet = Math.min(member.wallet, member.premium.active ? 10_000 : 5_000);
        } else {
            const newBet = await User.removeBetMoney(betStr, member);

            if (typeof newBet === "string") {
                await Cooldown.removeCooldown(interaction.user.id, this.info.name);
                await interaction.reply({ content: newBet, ephemeral: true });
                return;
            }

            bet = newBet;
        }

        const space = interaction.options.getString("space", true).toLowerCase();
        const gameData: GameData = {
            bet,
            finishedCommand: false,
            userWon: null,
            space,
            ball: Math.floor(Math.random() * 37),
            multiplier: 1,
            color: this.client.config.embed.color as ColorResolvable,
        };
        this.checkuserWon(gameData);

        if (gameData.userWon === null) {
            await User.addMoney(interaction.user.id, bet);
            await Cooldown.removeCooldown(interaction.user.id, this.info.name);
            await interaction.reply({ content: "Invalid space, please check all valid spaces using `/help command roulette`!", ephemeral: true });
            return;
        }

        const preEmbed = new EmbedBuilder()
            .setTitle("Roulette")
            .setColor(gameData.color)
            .setDescription("Spinning the wheel...")
            .setImage("https://media3.giphy.com/media/26uf2YTgF5upXUTm0/giphy.gif");
        await interaction.reply({ embeds: [preEmbed] });

        await Helpers.getTimeout(4000);
        const embed = new EmbedBuilder()
            .setTitle("Roulette")
            .setColor(gameData.userWon ? Colors.Green : (gameData.userWon === false ? Colors.Red : gameData.color))
            .addFields(
                { name: "Ball", value: `The ball landed on **${gameData.ball === 0 ? "" : (this.RedColors.includes(gameData.ball) ? "red " : "black ")}${gameData.ball}**`, inline: false },
                { name: "Multiplier", value: `${gameData.multiplier}x`, inline: true },
                { name: "Profit", value: `:coin: ${gameData.userWon ? Math.floor(gameData.multiplier * gameData.bet - gameData.bet) : -gameData.bet}`, inline: true },
            );
        await interaction.editReply({ embeds: [embed] });

        if (gameData.userWon) {
            await User.addExperience(interaction.user.id);
            await User.addMoney(interaction.user.id, Math.floor(gameData.multiplier * gameData.bet));
        }
    }

    private checkuserWon(gameData: GameData): void {
        switch (gameData.space) {
            case "red":
                gameData.userWon = this.RedColors.includes(gameData.ball);
                gameData.multiplier = 2;
                break;
            case "black":
                gameData.userWon = !this.RedColors.includes(gameData.ball);
                gameData.multiplier = 2;
                break;
            case "odd":
                gameData.userWon = gameData.ball % 2 === 1;
                gameData.multiplier = 2;
                break;
            case "even":
                gameData.userWon = gameData.ball % 2 === 0;
                gameData.multiplier = 2;
                break;
            case "1st":
                gameData.userWon = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(gameData.ball);
                gameData.multiplier = 3;
                break;
            case "2nd":
                gameData.userWon = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].includes(gameData.ball);
                gameData.multiplier = 3;
                break;
            case "3rd":
                gameData.userWon = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].includes(gameData.ball);
                gameData.multiplier = 3;
                break;
            case "1-12":
                gameData.userWon = gameData.ball >= 1 && gameData.ball <= 12;
                gameData.multiplier = 3;
                break;
            case "13-24":
                gameData.userWon = gameData.ball >= 13 && gameData.ball <= 24;
                gameData.multiplier = 3;
                break;
            case "25-36":
                gameData.userWon = gameData.ball >= 25 && gameData.ball <= 36;
                gameData.multiplier = 3;
                break;
            case "1-18":
                gameData.userWon = gameData.ball >= 1 && gameData.ball <= 18;
                gameData.multiplier = 2;
                break;
            case "19-36":
                gameData.userWon = gameData.ball >= 19 && gameData.ball <= 36;
                gameData.multiplier = 2;
                break;
            default:
                try {
                    const number = parseInt(gameData.space.trim());

                    if (number >= 0 && number <= 36) {
                        gameData.userWon = gameData.ball === number;
                        gameData.multiplier = gameData.userWon ? 36 : 1;
                    }
                } catch {
                    /* do nothing with the error... */
                }
        }
    }
}