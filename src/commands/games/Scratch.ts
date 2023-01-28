import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import Cooldown from "../../utils/Cooldown";
import User from "../../utils/User";
import { IGuild } from "../../models/Guild";

interface GameData {
    bet: number;
    finishedCommand: boolean;
    board: {
        symbol: string;
        scratched: boolean;
    }[][];
    buttonsClicked: number;
    multiplier: number;
}

export default class extends Command implements ICommand {
    readonly info = {
        name: "scratch",
        description: "Scratch a card to win money!",
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

    private readonly boardSize = 5;
    private readonly maxClicks = 3;
    private readonly symbols = {
        default: "💸",
        scratched: "⬛",
    };

    private readonly values = {
        "🎲": {
            value: 0.4,
            quantity: 4,
        },
        "💰": {
            value: 0.6,
            quantity: 3,
        },
        "🎁": {
            value: 1,
            quantity: 2,
        },
        "💎": {
            value: 1.3,
            quantity: 1,
        },
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
            board: this.generateBoard(),
            buttonsClicked: 0,
            multiplier: 0,
        };

        const message = await interaction.reply({ embeds: [this.getEmbed(gameData)], components: this.setButtons(gameData), fetchReply: true });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, max: this.maxClicks + 1, idle: 20_000, time: 60_000 });

        collector.on("collect", async (i) => {
            if (gameData.finishedCommand) return;

            if (i.customId.startsWith("scratch_board")) {
                const [x, y] = i.customId.replace("scratch_board", "").split("-").map((n) => parseInt(n));
                const symbol = gameData.board[x][y].symbol as keyof typeof this.values;

                if (!gameData.board[x][y].scratched && symbol !== this.symbols.default) {
                    gameData.multiplier += this.values[symbol].value;
                }

                gameData.board[x][y].scratched = true;
                gameData.buttonsClicked++;
                if (gameData.buttonsClicked >= this.maxClicks || gameData.finishedCommand) {
                    gameData.finishedCommand = true;
                    await User.addMoney(interaction.user.id, Math.floor(gameData.bet * gameData.multiplier));
                    await User.addGameExperience(member, guild);
                    collector.stop();
                }

                await i.update({ embeds: [this.getEmbed(gameData)], components: this.setButtons(gameData) });
            }
        });

        collector.on("end", async () => {
            if (!gameData.finishedCommand) {
                gameData.finishedCommand = true;
                await User.addMoney(interaction.user.id, Math.floor(gameData.bet * gameData.multiplier));
                await interaction.editReply({ embeds: [this.getEmbed(gameData)], components: this.setButtons(gameData) });
            }
        });
    }

    private generateBoard(): GameData["board"] {
        const board: GameData["board"] = [];

        for (let i = 0; i < this.boardSize; i++) {
            const row: GameData["board"][number] = [];

            for (let j = 0; j < this.boardSize; j++) {
                row.push({
                    symbol: this.symbols.default,
                    scratched: false,
                });
            }

            board.push(row);
        }

        const symbols = Object.keys(this.values) as (keyof typeof this.values)[];
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            const quantity = this.values[symbol].quantity;

            for (let j = 0; j < quantity; j++) {
                let x = Math.floor(Math.random() * this.boardSize);
                let y = Math.floor(Math.random() * this.boardSize);

                while (board[x][y].symbol !== this.symbols.default) {
                    x = Math.floor(Math.random() * this.boardSize);
                    y = Math.floor(Math.random() * this.boardSize);
                }

                board[x][y].symbol = symbol;
            }
        }

        return board;
    }

    private getEmbed(gameData: GameData): EmbedBuilder {
        const keys = Object.keys(this.values) as (keyof typeof this.values)[];
        const loot = keys.map((symbol) => `${symbol} will multiply with \`${this.values[symbol].value}x\``).join("\n");

        return new EmbedBuilder()
            .setTitle("Scratch Card")
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .addFields(
                { name: "Statistics", value: `:star: **Scratch Fields:** ${this.maxClicks - gameData.buttonsClicked} left\n:moneybag: **Profit:** :coin: ${Math.floor(gameData.bet * gameData.multiplier) - gameData.bet}.`, inline: true },
                { name: "Loot Table", value: loot ?? "Wait?? I couldn't find any multipliers?!", inline: true },
            );
    }

    private setButtons(gameData: GameData): ActionRowBuilder<ButtonBuilder>[] {
        const rows: ActionRowBuilder<ButtonBuilder>[] = [];

        for (let i = 0; i < this.boardSize; i++) {
            const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>();

            for (let j = 0; j < this.boardSize; j++) {
                let emoji = gameData.board[i][j].scratched ?
                    (gameData.board[i][j].symbol === this.symbols.default ? this.symbols.scratched : gameData.board[i][j].symbol) :
                    this.symbols.default;

                if (gameData.finishedCommand) {
                    emoji = gameData.board[i][j].symbol === this.symbols.default ? this.symbols.scratched : gameData.board[i][j].symbol;
                }

                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`scratch_board${i}-${j}`)
                        .setEmoji(emoji)
                        .setStyle(gameData.board[i][j].scratched && gameData.board[i][j].symbol !== this.symbols.default ? ButtonStyle.Success : (gameData.board[i][j].scratched ? ButtonStyle.Danger : ButtonStyle.Secondary))
                        .setDisabled(gameData.board[i][j].scratched || gameData.finishedCommand),
                );
            }

            rows.push(row);
        }

        return rows;
    }
}