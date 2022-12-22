import Command from '../../structures/Command.js'
import {
    EmbedBuilder,
    ApplicationCommandOptionType,
    ActionRowBuilder,
    ButtonStyle,
    ButtonBuilder,
    ComponentType
} from 'discord.js'
import { checkBet } from '../../lib/helpers.js'
import { addMoney, addRandomExperience, takeMoney } from '../../lib/user.js'

export default class extends Command {
    info = {
        name: "tictactoe",
        description: "Connect 4 X's or O's in a row to win the game. Must be played with 2 users.",
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
            { name: "Bet Formatting", value: "You can use formatting to make it easier to use big numbers.\n\n__For Example:__\n~~1000~~ **1K**\n~~1300~~ **1.3K**\nUse `all` or `max` to use a maximum of :coin: 5000.", inline: false }
        ],
        cooldown: 300,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    boardSize = 3; // this.boardSize = 3 means 3 columns, 3 rows; Maximum this.boardSize: 5
    symbolX = "❌";
    symbolO = "⭕";

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const user = interaction.options.getUser('user');

        if (user.id === interaction.member.id) {
            await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            return await interaction.reply({ content: `You cannot choose yourself as a second player.`, ephemeral: true });
        }

        if (user.bot) {
            await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            return await interaction.reply({ content: `You can't invite a bot to play a game of tic tac toe.`, ephemeral: true });
        }

        await interaction.deferReply();
        const secondUserData = await bot.database.fetchMember(user.id);
        const betStr = interaction.options.getString('bet');
        let bet = 50;

        if (["all", "max"].includes(betStr.toLowerCase())) {
            if (data.user.wallet <= 0) return await interaction.editReply({ content: `You don't have any money in your wallet.` });

            if (data.premium.premium) {
                bet = data.user.wallet > 10000 ? 10000 : data.user.wallet;
            } else {
                bet = data.user.wallet > 5000 ? 5000 : data.user.wallet;
            }
        } else {
            bet = checkBet(betStr, data.user, data.premium.premium);

            if (!Number.isInteger(bet)) {
                await interaction.editReply({ content: bet });
                return await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            }
        }

        if (bet > secondUserData.wallet) {
            await interaction.editReply({ content: `${user} doesn't have enough money in their wallet.` });
            return await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
        }

        data.gameStarted = false;
        data.currentPlayer = user.id; // set to used.id to accept the confirm message

        const interactionMessage = await interaction.editReply({ content: `<@${user.id}>\nDo you accept to play a game of Tic Tac Toe with <@${interaction.member.id}>?\n*If you accept, you have to place a bet of :coin: ${bet}.*`, components: [this.getConfirmButtons(false)], fetchReply: true });

        const filter = async (i) => {
            if (i.member.id === data.currentPlayer) return true;
            await i.reply({ content: `It's not your turn or you are not a player in this game.`, ephemeral: true, target: i.member });
            return false;
        };

        const collector = interactionMessage.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 30_000 + 15000 * (this.boardSize * this.boardSize) });

        collector.on('collect', async (i) => {
            await i.deferUpdate();

            if (i.customId === "ttt_accept") {
                // setup variable
                data.hostWon = null;
                data.gameFinished = false;
                data.bet = bet;
                data.user = user;
                data.board = [
                    [null, null, null],
                    [null, null, null],
                    [null, null, null]
                ];
                data.gameStarted = true;
                data.currentPlayer = interaction.member.id;

                await interaction.editReply({ content: "_ _", embeds: [this.createEmbed(data)], components: this.setButtons(data) });
            } else if (i.customId === 'ttt_decline') {
                return await interaction.editReply({ components: [this.getConfirmButtons(true)] });
            } else if (i.customId.startsWith('ttt_board')) {
                let boardId = i.customId.replace('ttt_board', '');
                if (data.board[parseInt(boardId.charAt(0))][parseInt(boardId.charAt(1))] === null) {
                    data.board[parseInt(boardId.charAt(0))][parseInt(boardId.charAt(1))] = data.currentPlayer === interaction.member.id ? this.symbolX : this.symbolO;
                }

                data.currentPlayer = data.currentPlayer === interaction.member.id ? user.id : interaction.member.id;

                data = this.checkWinner(data);
                if (data.hostWon !== null) {
                    if (data.hostWon === true) {
                        data.desc = `<@${interaction.member.id}> won the Tic Tac Toe game!!!`;
                        await addMoney(interaction.member.id, parseInt(data.bet * 2));
                        await takeMoney(user.id, data.bet);
                        await addRandomExperience(interaction.member.id);
                    } else {
                        data.desc = `<@${user.id}> won the Tic Tac Toe game!!!`;
                        await addMoney(user.id, parseInt(data.bet * 2));
                        await takeMoney(interaction.member.id, data.bet);
                        await addRandomExperience(user.id);
                    }
                } else {
                    if (data.gameFinished) data.desc = "**The game ended in a Tie and nobody won.**";
                }

                await interaction.editReply({ embeds: [this.createEmbed(data)], components: this.setButtons(data, data.hostWon !== null || data.gameFinished) });
                if (data.gameFinished) return;
            }
        });

        collector.on('end', async (i) => {
            if (!data.gameStarted) {
                return await interaction.editReply({ components: [this.getConfirmButtons(true)] });
            } else if (data.hostWon === null) {
                data.desc = `<@${data.currentPlayer}> **has waited too long and lost the game.**`;
                await takeMoney(data.currentPlayer, data.bet);
                return await interaction.editReply({ embeds: [this.createEmbed(data)], components: this.setButtons(data, true) });
            }
        });
    }

    createEmbed(data) {
        const embed = new EmbedBuilder()
            .setTitle(`Tic Tac Toe`)
            .setColor(bot.config.embed.color)
            .setDescription(data.desc || "Try to get your letter (:x: or :o:) in a row (horizontally, vertically or diagonal).")
            .addFields(
                { name: 'Bet', value: `:coin: ${data.bet}`, inline: true },
                { name: 'Second Player', value: `<@${data.user.id}>`, inline: true },
                { name: 'Turn Of', value: `<@${data.currentPlayer}>`, inline: true }
            )
        return embed;
    }

    setButtons(data, buttonsAreDisabled = false) {
        let rows = [];
        for (let i = 0; i < this.boardSize; i++) {
            let row = new ActionRowBuilder();

            for (let j = 0; j < this.boardSize; j++) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ttt_board${i}${j}`)
                        .setEmoji(data.board[i][j] === null ? "⬜" : data.board[i][j])
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(data.board[i][j] !== null || buttonsAreDisabled)
                );
            }
            rows.push(row);
        }

        return rows;
    };

    checkWinner(data) {
        let gameWon = false;
        let x = this.symbolX.repeat(this.boardSize);
        let o = this.symbolO.repeat(this.boardSize);

        // Check horizontally
        for (let i = 0; i < this.boardSize; i++) {
            if (data.board[i].join("") === x) {
                gameWon = "host";
            } else if (data.board[i].join("") === o) {
                gameWon = "user";
            }

            if (gameWon) break;
        }

        // Check vertically
        for (let i = 0; i < this.boardSize; i++) {
            let column = "";
            for (let j = 0; j < this.boardSize; j++) column += data.board[j][i];

            if (column === x) {
                gameWon = "host";
            } else if (column === o) {
                gameWon = "user";
            }

            if (gameWon) break;
        }

        // Check diagonal (upper left to bottom right)
        if (!gameWon) {
            let diagonal = "";
            for (let i = 0; i < this.boardSize; i++) diagonal += data.board[i][i];

            if (diagonal === x) {
                gameWon = "host";
            } else if (diagonal === o) {
                gameWon = "user";
            }
        }

        // Check diagonal (bottom left to upper right)
        if (!gameWon) {
            let diagonal = "";
            for (let i = 0; i < this.boardSize; i++) diagonal += data.board[this.boardSize - i - 1][i]; // -1 because its an index and indexes start at 0

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
                if (data.board[i][j] === null) emptySpace++;
            }
        }

        if (emptySpace === 0) data.gameFinished = true;
        if (gameWon === "host") data.hostWon = true;
        else if (gameWon === "user") data.hostWon = false;
        return data;
    }

    getConfirmButtons(disabled = false) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`ttt_accept`)
                .setLabel("Yes")
                .setStyle(ButtonStyle.Success)
                .setDisabled(disabled),
            new ButtonBuilder()
                .setCustomId(`ttt_decline`)
                .setLabel("No")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(disabled)
        )
        return row;
    }
}