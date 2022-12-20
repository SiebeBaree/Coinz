import Command from '../../structures/Command.js'
import {
    EmbedBuilder,
    ApplicationCommandOptionType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    PermissionsBitField
} from 'discord.js'
import { addMoney, addRandomExperience, takeMoney } from '../../lib/user.js'
import { checkBet } from '../../lib/helpers.js'

const BoardIcons = {
    Header1: "<:connect4_c1:1013729848709099622>",
    Header2: "<:connect4_c2:1013729850311315486>",
    Header3: "<:connect4_c3:1013729851552825394>",
    Header4: "<:connect4_c4:1013729852806942762>",
    Header5: "<:connect4_c5:1013729854044246036>",
    Header6: "<:connect4_c6:1013729855394807879>",
    Header7: "<:connect4_c7:1013729856598585364>",
    Empty: "<:connect4_empty:1013729857915592734>",
    Red: "<:connect4_red:1013729859240996934>",
    Yellow: "<:connect4_yellow:1013729860360867922>"
};

const ResultType = {
    Winner: "winner",
    Tie: "tie",
    OutOfTime: "out_of_time"
};

const WIDTH = 7;
const HEIGHT = 6;

export default class extends Command {
    info = {
        name: "connect4",
        description: "Play a game of Connect4 with someone.",
        options: [
            {
                name: 'bet',
                type: ApplicationCommandOptionType.String,
                description: 'The bet you want to place.',
                required: true,
                min_length: 2,
                max_length: 6
            },
            {
                name: 'user',
                type: ApplicationCommandOptionType.User,
                description: 'Tag your second player here.',
                required: true
            }
        ],
        category: "games",
        extraFields: [
            { name: "Bet Formatting", value: "You can use formatting to make it easier to use big numbers.\n\n__For Example:__\n~~1000~~ **1K**\n~~1300~~ **1.3K**\nUse `all` or `max` to use a maximum of :coin: 5000.", inline: false },
        ],
        cooldown: 300,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.UseExternalEmojis) || !interaction.guild.members.me.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.UseExternalEmojis)) {
            return await interaction.reply({ content: `I don't have permission to use External Emojis... Please enable this permission to use this command.`, ephemeral: true });
        }

        const secondPlayer = interaction.options.getUser('user');

        if (secondPlayer.id === interaction.member.id) {
            await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            return await interaction.reply({ content: `You cannot choose yourself as a second player.`, ephemeral: true });
        }

        if (secondPlayer.bot) {
            await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            return await interaction.reply({ content: `You can't invite a bot to play a game of tic tac toe.`, ephemeral: true });
        }

        await interaction.deferReply();
        const secondUserData = await bot.database.fetchMember(secondPlayer.id);
        const betStr = interaction.options.getString('bet');
        let bet = 50;

        if (["all", "max"].includes(betStr.toLowerCase())) {
            if (data.user.wallet <= 0) return await interaction.editReply({ content: `You don't have any money in your wallet.` });
            bet = data.user.wallet > 5000 ? 5000 : data.user.wallet;
        } else {
            bet = checkBet(betStr, data.user);

            if (!Number.isInteger(bet)) {
                await interaction.editReply({ content: bet });
                return await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            }
        }

        if (bet > secondUserData.wallet) {
            await interaction.editReply({ content: `${secondPlayer.tag} doesn't have enough money in their wallet.` });
            return await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
        }

        data.board = this.createBoard();
        data.bet = bet;
        data.hostTurn = false;
        data.player1 = interaction.user;
        data.player2 = secondPlayer;
        data.gameStarted = false;
        data.gameFinished = false;
        data.disabledRows = [];

        const filter = async (i) => {
            if (i.member.id === this.getPlayerId(data)) return true;
            await i.reply({ content: `It's not your turn or you are not a player in this game.`, ephemeral: true, target: i.member });
            return false;
        };

        const message = await interaction.editReply({ content: `<@${secondPlayer.id}>\nDo you accept to play a game of Connect4 with <@${interaction.member.id}>?\n*If you accept, you have to place a bet of :coin: ${bet}.*`, components: [this.getConfirmButtons(false)], fetchReply: true });
        const collector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 180_000 });

        collector.on('collect', async (i) => {
            await i.deferUpdate();
            if (data.gameFinished) return;

            if (i.customId === "c4_accept") {
                data.hostTurn = !data.hostTurn;
                data.gameStarted = true;
                await interaction.editReply({ content: "", embeds: [this.getEmbed(data)], components: this.getRows(data.disabledRows) });
            } else if (i.customId === "c4_decline") {
                return await interaction.editReply({ components: [this.getConfirmButtons(true)] });
            } else if (i.customId.startsWith("c4_row")) {
                const column = parseInt(i.customId.replace("c4_row", "")) - 1;
                let row = -1;

                for (let i = HEIGHT - 1; i >= 0; i--) {
                    if (data.board[i][column] === BoardIcons.Empty) {
                        if (i <= 0) data.disabledRows.push(column + 1);
                        data = this.setChip(data, column, i);
                        row = i;
                        break;
                    }
                }

                if (this.hasWon(data.board, column, row)) {
                    data = await this.gameFinished(interaction, data, ResultType.Winner);
                } else if (this.isBoardFull(data.board)) {
                    data = await this.gameFinished(interaction, data, ResultType.Tie);
                }

                if (data.gameFinished) return;
                data.hostTurn = !data.hostTurn;
                await interaction.editReply({ embeds: [this.getEmbed(data)], components: this.getRows(data.disabledRows) });
            }
        });

        collector.on('end', async (i) => {
            if (!data.gameFinished) {
                if (!data.gameStarted) {
                    return await interaction.editReply({ components: [this.getConfirmButtons(true)] });
                } else {
                    return await this.gameFinished(interaction, data, ResultType.OutOfTime);
                }
            }
        });
    }

    getConfirmButtons(disabled = false) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`c4_accept`)
                .setLabel("Yes")
                .setStyle(ButtonStyle.Success)
                .setDisabled(disabled),
            new ButtonBuilder()
                .setCustomId(`c4_decline`)
                .setLabel("No")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(disabled)
        )
        return row;
    }

    createBoard() {
        let board = [];

        for (let i = 0; i < HEIGHT; i++) {
            let row = [];
            for (let j = 0; j < WIDTH; j++) row.push(BoardIcons.Empty);
            board.push(row);
        }

        return board;
    }

    getBoard(board) {
        let boardStr = "";
        for (let i = 1; i <= WIDTH; i++) boardStr += BoardIcons[`Header${i}`];
        for (let i = 0; i < HEIGHT; i++) boardStr += `\n${board[i].join("")}`;
        return boardStr;
    }

    isBoardFull(board) {
        for (let i = 0; i < HEIGHT; i++)
            for (let j = 0; j < WIDTH; j++)
                if (board[i][j] === BoardIcons.Empty)
                    return false;
        return true;
    }

    setChip(data, posX, posY) {
        data.board[posY][posX] = this.getChip(data.hostTurn);
        return data;
    }

    hasWon(board, posX, posY) {
        const chip = board[posY][posX];

        // Horizontal Check
        for (let i = Math.max(0, posX - 3); i <= posX; i++) {
            if (i + 3 < WIDTH && board[posY][i] === chip && board[posY][i + 1] === chip && board[posY][i + 2] === chip && board[posY][i + 3] === chip) return true;
        }

        // Vertical Check
        for (let i = Math.max(0, posY - 3); i <= posY; i++) {
            if (i + 3 < HEIGHT && board[i][posX] === chip && board[i + 1][posX] === chip && board[i + 2][posX] === chip && board[i + 3][posX] === chip) return true;
        }

        // Ascending Diagonal
        for (let i = -3; i <= 0; i++) {
            const xStart = posX + i;
            const yStart = posY - i;
            if (xStart + 3 < WIDTH && xStart >= 0 && yStart < HEIGHT && yStart - 3 >= 0) {
                if (board[yStart][xStart] === chip && board[yStart - 1][xStart + 1] === chip && board[yStart - 2][xStart + 2] === chip && board[yStart - 3][xStart + 3] === chip) return true;
            }
        }

        // Descending Diagonal
        for (let i = 0; i < 4; i++) {
            const xStart = posX + i;
            const yStart = posY + i;
            if (xStart + 3 < WIDTH && xStart >= 0 && yStart + 3 < HEIGHT && yStart >= 0) {
                if (board[yStart][xStart] === chip && board[yStart + 1][xStart + 1] === chip && board[yStart + 2][xStart + 2] === chip && board[yStart + 3][xStart + 3] === chip) return true;
            }
        }

        return false;
    }

    getPlayerId(data) {
        return data.hostTurn ? data.player1.id : data.player2.id
    }

    getChip(turn) {
        return turn ? BoardIcons.Red : BoardIcons.Yellow;
    }

    getButton(id, disabled = false) {
        return new ButtonBuilder()
            .setCustomId(`c4_row${id}`)
            .setLabel(`${id}`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled)
    }

    getRows(rowsDisabled = [], disabled = false) {
        let row1 = new ActionRowBuilder();
        let row2 = new ActionRowBuilder();

        for (let i = 1; i <= 4; i++) row1.addComponents(this.getButton(i, rowsDisabled.includes(i) || disabled));
        for (let i = 5; i <= 7; i++) row2.addComponents(this.getButton(i, rowsDisabled.includes(i) || disabled));

        return [row1, row2];
    }

    getEmbed(data) {
        const embed = new EmbedBuilder()
            .setTitle(`Connect4: ${data.player1.username} vs. ${data.player2.username}`)
            .setColor(bot.config.embed.color)
            .setDescription(this.getBoard(data.board))
            .addFields(
                { name: "Turn", value: `${data.hostTurn ? data.player1.tag : data.player2.tag}`, inline: true },
                { name: "Total Bet", value: `:coin: ${parseInt(data.bet * 2)}`, inline: true },
            )
        return embed;
    }

    async gameFinished(interaction, data, result) {
        data.gameFinished = true;
        await interaction.editReply({ embeds: [this.getEmbed(data)], components: this.getRows([], true) });

        if (result === ResultType.Winner) {
            await addMoney(data.hostTurn ? data.player1.id : data.player2.id, data.bet);
            await takeMoney(!data.hostTurn ? data.player1.id : data.player2.id, data.bet);
            await addRandomExperience(data.hostTurn ? data.player1.id : data.player2.id);
            await interaction.followUp({ content: `**${data.hostTurn ? data.player1.tag : data.player2.tag}** won this Connect4 game!` });
        } else if (result === ResultType.OutOfTime) {
            await interaction.followUp({ content: `**The game has ended!** You only had 3 minutes to play this game and the time is up!` });
        } else {
            await interaction.followUp({ content: `**The game has ended!** The board is full and nobody won...` });
        }

        return data;
    }
}