import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, ComponentType, EmbedBuilder, User as DjsUser } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import Cooldown from "../../utils/Cooldown";
import User from "../../utils/User";
import Database from "../../utils/Database";
import { IGuild } from "../../models/Guild";

interface GameData {
    bet: number;
    finishedCommand: boolean;
    gameHasStarted: boolean;
    currentUser: string;
    board: string[][];
    secondUser: DjsUser;
    hostWon: boolean | null;
    description?: string;
    tie: boolean;
}

export default class extends Command implements ICommand {
    readonly info = {
        name: "tictactoe",
        description: "Connect 4 X's or O's in a row to win the game. Must be played with 2 users.",
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
                name: "user",
                type: ApplicationCommandOptionType.User,
                description: "Tag your second player here.",
                required: true,
            },
        ],
        category: "games",
        extraFields: [
            { name: "Bet Formatting", value: "You can use formatting to make it easier to use big numbers.\n\n__For Example:__\n~~1000~~ **1K**\n~~1300~~ **1.3K**\nUse `all` or `max` to use a maximum of :coin: 5000.", inline: false },
        ],
        cooldown: 420,
    };

    // boardSize = 3 means 3 columns, 3 rows; Maximum boardSize: 5
    private readonly boardSize = 3;
    private readonly symbolX = "❌";
    private readonly symbolO = "⭕";

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember, guild: IGuild) {
        const betStr = interaction.options.getString("bet", true);
        const secondUser = interaction.options.getUser("user", true);

        if (secondUser.bot || secondUser.id === interaction.user.id) {
            await Cooldown.removeCooldown(interaction.user.id, this.info.name);
            await interaction.reply({ content: "You can't play against a bot or yourself!", ephemeral: true });
            return;
        }

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

        const secondMember = await Database.getMember(secondUser.id);
        if (!secondMember || secondMember.wallet < bet) {
            await User.addMoney(interaction.user.id, bet);
            await Cooldown.removeCooldown(interaction.user.id, this.info.name);
            await interaction.reply({ content: "The second player doesn't have enough money in their wallet to bet!", ephemeral: true });
            return;
        }

        const gameData: GameData = {
            bet,
            finishedCommand: false,
            gameHasStarted: false,
            currentUser: secondUser.id,
            board: [
                ["", "", ""],
                ["", "", ""],
                ["", "", ""],
            ],
            secondUser,
            hostWon: null,
            tie: false,
        };

        const gameMessage = await interaction.reply({
            content: `**${interaction.user.tag}** has challenged ${secondUser} to a game of Tic Tac Toe!\nDo you accept?`,
            components: [this.getConfirmButtons()],
            fetchReply: true,
        });

        const filter = async (i: ButtonInteraction) => {
            if (i.user.id === gameData.currentUser) return true;
            await i.reply({ content: "It's not your turn or you are not a player in this game.", ephemeral: true, target: i.user });
            return false;
        };

        const collector = gameMessage.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 30_000 + 15_000 * (this.boardSize * this.boardSize) });

        collector.on("collect", async (i) => {
            if (gameData.finishedCommand) return;

            if (i.customId === "ttt_accept") {
                gameData.gameHasStarted = true;
                gameData.currentUser = interaction.user.id;

                await i.update({
                    content: "",
                    embeds: [this.getEmbed(gameData)],
                    components: this.getButtons(gameData),
                });
                await User.removeMoney(secondUser.id, bet);
            } else if (i.customId === "ttt_decline") {
                gameData.finishedCommand = true;
                await i.deferUpdate();
                await Cooldown.removeCooldown(interaction.user.id, this.info.name);
                await User.addMoney(interaction.user.id, bet);
                collector.stop();
            } else if (i.customId.startsWith("ttt_board")) {
                const [row, column] = i.customId.replace("ttt_board", "").split("-").map((x) => parseInt(x, 10));

                if (gameData.board[row][column] !== "") {
                    await i.reply({ content: ":x: You can't place your symbol here!", ephemeral: true });
                    return;
                }

                if (!i.deferred) await i.deferUpdate();
                gameData.board[row][column] = gameData.currentUser === interaction.user.id ? this.symbolX : this.symbolO;
                gameData.currentUser = gameData.currentUser === interaction.user.id ? gameData.secondUser.id : interaction.user.id;

                this.checkWinner(gameData);
                if (gameData.finishedCommand && gameData.hostWon !== null) {
                    await User.addMoney(gameData.hostWon ? interaction.user.id : gameData.secondUser.id, bet * 2);
                    await User.addMoney(gameData.hostWon ? gameData.secondUser.id : interaction.user.id, -bet);
                    await User.addGameExperience(gameData.hostWon ? member : secondMember, guild);
                } else if (gameData.finishedCommand && gameData.hostWon === null) {
                    await User.addMoney(interaction.user.id, bet);
                    await User.addMoney(gameData.secondUser.id, bet);
                }

                if (gameData.finishedCommand) {
                    collector.stop();
                    await interaction.followUp({ content: gameData.hostWon !== null ? `**${gameData.hostWon ? interaction.user.tag : gameData.secondUser.tag}** has won :coin: ${gameData.bet * 2}!` : "The game has ended in a tie!" });
                }

                await interaction.editReply({
                    embeds: [this.getEmbed(gameData)],
                    components: this.getButtons(gameData),
                });
            }
        });

        collector.on("end", async () => {
            if (gameData.finishedCommand) return;

            if (gameData.gameHasStarted) {
                await interaction.editReply({ components: this.getButtons(gameData, true) });

                if (gameData.hostWon === null && !gameData.tie) {
                    await interaction.followUp({ content: `**${gameData.currentUser === interaction.user.id ? gameData.secondUser.tag : interaction.user.tag}** has won the game because **${gameData.currentUser === interaction.user.id ? interaction.user.tag : gameData.secondUser.tag}** took too long to respond!` });
                    await User.addMoney(gameData.currentUser === interaction.user.id ? gameData.secondUser.id : interaction.user.id, bet);
                }
            } else {
                await interaction.editReply({ components: [this.getConfirmButtons(true)] });
                await User.addMoney(interaction.user.id, bet);
            }
        });
    }

    private checkWinner(gameData: GameData): void {
        let gameWon = "";
        const x = this.symbolX.repeat(this.boardSize);
        const o = this.symbolO.repeat(this.boardSize);

        // Check horizontally
        for (let i = 0; i < this.boardSize; i++) {
            if (gameData.board[i].join("") === x) {
                gameWon = "host";
            } else if (gameData.board[i].join("") === o) {
                gameWon = "user";
            }

            if (gameWon) break;
        }

        // Check vertically
        for (let i = 0; i < this.boardSize; i++) {
            let column = "";
            for (let j = 0; j < this.boardSize; j++) column += gameData.board[j][i];

            if (column === x) {
                gameWon = "host";
            } else if (column === o) {
                gameWon = "user";
            }

            if (gameWon !== "") break;
        }

        // Check diagonal (upper left to bottom right)
        if (gameWon === "") {
            let diagonal = "";
            for (let i = 0; i < this.boardSize; i++) diagonal += gameData.board[i][i];

            if (diagonal === x) {
                gameWon = "host";
            } else if (diagonal === o) {
                gameWon = "user";
            }
        }

        // Check diagonal (bottom left to upper right)
        if (gameWon === "") {
            let diagonal = "";
            // -1 because its an index and indexes start at 0
            for (let i = 0; i < this.boardSize; i++) diagonal += gameData.board[this.boardSize - i - 1][i];

            if (diagonal === x) {
                gameWon = "host";
            } else if (diagonal === o) {
                gameWon = "user";
            }
        }

        // check if board is full
        let emptySpace = 0;
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (gameData.board[i][j] === "") emptySpace++;
            }
        }

        if (emptySpace === 0 || gameWon !== "") gameData.finishedCommand = true;
        if (emptySpace === 0) gameData.tie = true;
        if (gameWon === "host") gameData.hostWon = true;
        else if (gameWon === "user") gameData.hostWon = false;
    }

    private getEmbed(gameData: GameData): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle("Tic Tac Toe")
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription(gameData.description ?? "Try to get your symbol (:x: or :o:) in a row (horizontally, vertically or diagonal).")
            .addFields(
                { name: "Bet", value: `:coin: ${gameData.bet}`, inline: true },
                { name: "Second Player", value: `<@${gameData.secondUser.id}>`, inline: true },
                { name: "Turn Of", value: `<@${gameData.currentUser}>`, inline: true },
            );
    }

    private getButtons(gameData: GameData, disabled = false): ActionRowBuilder<ButtonBuilder>[] {
        const actionRows = [];
        for (let i = 0; i < this.boardSize; i++) {
            const actionRow = new ActionRowBuilder<ButtonBuilder>();

            for (let j = 0; j < this.boardSize; j++) {
                actionRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ttt_board${i}-${j}`)
                        .setEmoji(gameData.board[i][j] === "" ? "⬜" : gameData.board[i][j])
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(gameData.board[i][j] !== "" || disabled || gameData.finishedCommand),
                );
            }
            actionRows.push(actionRow);
        }

        return actionRows;
    }

    private getConfirmButtons(disabled = false): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("ttt_accept")
                    .setLabel("Accept")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(disabled),
                new ButtonBuilder()
                    .setCustomId("ttt_decline")
                    .setLabel("Decline")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(disabled),
            );
    }
}