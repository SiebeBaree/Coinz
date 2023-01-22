import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, ComponentType, EmbedBuilder, GuildChannelResolvable, PermissionsBitField, User as DjsUser } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import Cooldown from "../../utils/Cooldown";
import User from "../../utils/User";
import Database from "../../utils/Database";

interface GameData {
    bet: number;
    gameStarted: boolean;
    finishedCommand: boolean;
    currentUserId: string;
    user1: DjsUser;
    user2: DjsUser;
    disabledColumns: number[];
    board: string[][];
    header: string;
}

export default class extends Command implements ICommand {
    readonly info = {
        name: "connect4",
        description: "Play a game of Connect4 with someone.",
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

    private readonly BoardIcons = {
        Empty: "<:connect4_empty:1013729857915592734>",
        Red: "<:connect4_red:1013729859240996934>",
        Yellow: "<:connect4_yellow:1013729860360867922>",
        RedChip: "<:connect4_red_chip:1060198481731534900>",
        YellowChip: "<:connect4_yellow_chip:1060198483992264734>",
    };

    private readonly HeaderIcons = [
        "<:connect4_c1:1013729848709099622>",
        "<:connect4_c2:1013729850311315486>",
        "<:connect4_c3:1013729851552825394>",
        "<:connect4_c4:1013729852806942762>",
        "<:connect4_c5:1013729854044246036>",
        "<:connect4_c6:1013729855394807879>",
        "<:connect4_c7:1013729856598585364>",
    ];

    private readonly WIDTH = 7;
    private readonly HEIGHT = 6;

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        if (interaction.guild && interaction.channel) {
            if (!interaction.guild.members.me?.permissions.has(PermissionsBitField.Flags.UseExternalEmojis)
                || !interaction.guild.members.me.permissionsIn(interaction.channel as GuildChannelResolvable).has(PermissionsBitField.Flags.UseExternalEmojis)) {
                await interaction.reply({ content: "I don't have permission to use External Emojis... Please enable this permission to use this command.", ephemeral: true });
                return;
            }
        }

        const secondUser = interaction.options.getUser("user", true);
        if (secondUser.id === interaction.user.id || secondUser.bot) {
            await interaction.reply({ content: "You cannot choose yourself or a bot as a second player.", ephemeral: true });
            await Cooldown.removeCooldown(interaction.user.id, this.info.name);
            return;
        }

        const betStr = interaction.options.getString("bet", true);

        let bet = 50;
        if (betStr.toLowerCase() === "all" || betStr.toLowerCase() === "max") {
            if (member.wallet <= 0) {
                await interaction.reply({ content: "You don't have any money in your wallet to bet!", ephemeral: true });
                await Cooldown.removeCooldown(interaction.user.id, this.info.name);
                return;
            }

            bet = Math.min(member.wallet, member.premium.active && member.premium.tier === 2 ? 15_000 : (member.premium.active ? 10_000 : 5_000));
        } else {
            const newBet = await User.removeBetMoney(betStr, member);

            if (typeof newBet === "string") {
                await interaction.reply({ content: newBet, ephemeral: true });
                await Cooldown.removeCooldown(interaction.user.id, this.info.name);
                return;
            }

            bet = newBet;
        }

        const secondMember = await Database.getMember(secondUser.id);
        if (bet > secondMember.wallet) {
            await interaction.reply({ content: `**${secondUser.tag}** doesn't have enough money in their wallet.`, ephemeral: true });
            await User.addMoney(interaction.user.id, bet);
            return await Cooldown.removeCooldown(interaction.user.id, this.info.name);
        }

        const gameData: GameData = {
            bet,
            gameStarted: false,
            finishedCommand: false,
            currentUserId: secondUser.id,
            user1: interaction.user,
            user2: secondUser,
            disabledColumns: [],
            board: [],
            header: this.HeaderIcons.join(""),
        };

        const filter = async (i: ButtonInteraction) => {
            if (i.user.id === gameData.currentUserId) return true;
            await i.reply({ content: "It's not your turn or you are not a player in this game.", ephemeral: true, target: i.user });
            return false;
        };

        const message = await interaction.reply({ content: `**${secondUser.tag}** , do you accept to play a game of Connect4 with **${interaction.user.tag}**?\n*If you accept, you have to place a bet of :coin: ${bet}.*`, components: this.getConfirmButton(), fetchReply: true });
        const collector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 240_000 });

        collector.on("collect", async (i) => {
            if (gameData.finishedCommand) return;

            if (i.customId === "c4_accept") {
                this.switchCurrentUser(gameData);
                gameData.gameStarted = true;
                this.startGame(gameData);
                await i.update({ content: "", embeds: [this.getEmbed(gameData)], components: this.getButtons(gameData) });
                await User.removeMoney(gameData.user2.id, gameData.bet);
            } else if (i.customId.startsWith("c4_column")) {
                const column = parseInt(i.customId.replace("c4_column", ""));
                let row = this.HEIGHT - 1;

                for (let rowNumber = this.HEIGHT - 1; rowNumber >= 0; rowNumber--) {
                    if (gameData.board[rowNumber][column] === this.BoardIcons.Empty) {
                        if (rowNumber <= 0) {
                            gameData.disabledColumns.push(column);
                        }

                        this.setPiece(gameData, rowNumber, column);
                        row = rowNumber;
                        break;
                    }
                }

                const winner = this.checkWinner(gameData, row, column);
                if (winner === null) {
                    this.switchCurrentUser(gameData);
                    await i.update({ embeds: [this.getEmbed(gameData)], components: this.getButtons(gameData) });
                } else {
                    gameData.finishedCommand = true;
                    await i.update({ embeds: [this.getEmbed(gameData)], components: this.getButtons(gameData, true) });
                    collector.stop();

                    if (this.isBoardFull(gameData)) {
                        await i.followUp({ content: "**The game has ended!** The board is full and nobody won..." });
                    } else {
                        await interaction.followUp({ content: `**${winner === gameData.user1.id ? gameData.user1.tag : gameData.user2.tag}** won this Connect4 game and earned :coin: ${Math.floor(gameData.bet * 2)}!` });
                        await User.addMoney(winner, Math.floor(gameData.bet * 2));
                        await User.addGameExperience(winner === gameData.user1.id ? member : secondMember);
                    }
                }
            }
        });

        collector.on("end", async () => {
            if (gameData.finishedCommand) return;

            if (gameData.gameStarted) {
                await interaction.editReply({ components: this.getButtons(gameData, true) });
                await interaction.followUp({ content: `**${gameData.currentUserId === gameData.user1.id ? gameData.user2.tag : gameData.user1.tag}** didn't make a move in time, you both lost your bet...`, ephemeral: true });
            } else {
                await User.addMoney(interaction.user.id, bet);
                await interaction.editReply({ content: `**${secondUser.tag}** didn't accept the game.`, components: this.getConfirmButton(true) });
            }
        });
    }

    private getEmbed(gameData: GameData): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`Connect4: ${gameData.user1.tag} vs. ${gameData.user2.tag}`)
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription(gameData.header + "\n" + this.getBoard(gameData))
            .addFields(
                { name: "Turn", value: `${gameData.currentUserId === gameData.user1.id ? `${this.BoardIcons.RedChip} ${gameData.user1.tag}` : `${this.BoardIcons.YellowChip} ${gameData.user2.tag}`}`, inline: true },
                { name: "Total Bet", value: `:coin: ${Math.floor(gameData.bet * 2)}`, inline: true },
            );
    }

    private getButtons(gameData: GameData, disabled = false): ActionRowBuilder<ButtonBuilder>[] {
        const rows: ActionRowBuilder<ButtonBuilder>[] = [
            new ActionRowBuilder<ButtonBuilder>(),
            new ActionRowBuilder<ButtonBuilder>(),
        ];

        for (let i = 0; i < 4; i++) {
            rows[0].addComponents(this.getColumnButton(i, disabled || gameData.disabledColumns.includes(i)));
        }

        for (let i = 4; i < 7; i++) {
            rows[1].addComponents(this.getColumnButton(i, disabled || gameData.disabledColumns.includes(i)));
        }

        return rows;
    }

    private getColumnButton(number: number, disabled = false): ButtonBuilder {
        return new ButtonBuilder()
            .setCustomId(`c4_column${number}`)
            .setLabel(`${number + 1}`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled);
    }

    private getConfirmButton(disabled = false): ActionRowBuilder<ButtonBuilder>[] {
        return [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId("c4_accept")
                    .setLabel("Yes")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(disabled),
            ),
        ];
    }

    private startGame(gameData: GameData): void {
        for (let i = 0; i < this.HEIGHT; i++) {
            gameData.board.push([]);
            for (let j = 0; j < this.WIDTH; j++) {
                gameData.board[i].push(this.BoardIcons.Empty);
            }
        }
    }

    private getBoard(gameData: GameData): string {
        return gameData.board.map((row) => row.join("")).join("\n");
    }

    private isBoardFull(gameData: GameData): boolean {
        return gameData.board.every((row) => row.every((piece) => piece !== this.BoardIcons.Empty));
    }

    private setPiece(gameData: GameData, row: number, column: number): void {
        gameData.board[row][column] = gameData.currentUserId === gameData.user1.id ? this.BoardIcons.Red : this.BoardIcons.Yellow;
    }

    private checkWinner(gameData: GameData, row: number, column: number): string | null {
        // horizontal
        for (let r = 0; r < this.HEIGHT; r++) {
            for (let c = 0; c < this.WIDTH - 3; c++) {
                if (gameData.board[row][column] == gameData.board[row][column + 1]
                    && gameData.board[row][column + 1] == gameData.board[row][column + 2]
                    && gameData.board[row][column + 2] == gameData.board[row][column + 3]) {
                    return this.getUserIdFromBoard(gameData, row, column);
                }
            }
        }

        // vertical
        for (let c = 0; c < this.WIDTH; c++) {
            for (let r = 0; r < this.HEIGHT - 3; r++) {
                if (gameData.board[row][column] == gameData.board[r + 1][c]
                    && gameData.board[r + 1][c] == gameData.board[r + 2][c]
                    && gameData.board[r + 2][c] == gameData.board[r + 3][c]) {
                    return this.getUserIdFromBoard(gameData, row, column);
                }
            }
        }

        // anti diagonal
        for (let r = 0; r < this.HEIGHT - 3; r++) {
            for (let c = 0; c < this.WIDTH - 3; c++) {
                if (gameData.board[row][column] == gameData.board[r + 1][c + 1]
                    && gameData.board[r + 1][c + 1] == gameData.board[r + 2][c + 2]
                    && gameData.board[r + 2][c + 2] == gameData.board[r + 3][c + 3]) {
                    return this.getUserIdFromBoard(gameData, row, column);
                }
            }
        }

        // diagonal
        for (let r = 3; r < this.HEIGHT; r++) {
            for (let c = 0; c < this.WIDTH - 3; c++) {
                if (gameData.board[row][column] == gameData.board[r - 1][c + 1]
                    && gameData.board[r - 1][c + 1] == gameData.board[r - 2][c + 2]
                    && gameData.board[r - 2][c + 2] == gameData.board[r - 3][c + 3]) {
                    return this.getUserIdFromBoard(gameData, row, column);
                }
            }
        }

        return null;
    }

    private switchCurrentUser(gameData: GameData): void {
        gameData.currentUserId = gameData.currentUserId === gameData.user1.id ? gameData.user2.id : gameData.user1.id;
    }

    private getUserIdFromBoard(gameData: GameData, row: number, column: number): string {
        return gameData.board[row][column] === this.BoardIcons.Red ? gameData.user1.id : gameData.user2.id;
    }
}