const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

const boardSize = 3; // boardSize = 3 means 3 columns, 3 rows; Maximum boardsize: 5
let symbolX = "❌";
let symbolO = "⭕";

function createEmbed(client, data) {
    const embed = new MessageEmbed()
        .setTitle(`Tic Tac Toe`)
        .setColor(client.config.embed.color)
        .setDescription(data.desc || "Try to get your letter (:x: or :o:) in a row (horizontally, vertically or diagonal).")
        .addFields(
            { name: 'Bet', value: `:coin: ${data.bet}`, inline: true },
            { name: 'Second Player', value: `<@${data.user.id}>`, inline: true },
            { name: 'Turn Of', value: `<@${data.currentPlayer}>`, inline: true }
        )
    return embed;
}

function setButtons(data, buttonsAreDisabled = false) {
    let rows = [];
    for (let i = 0; i < boardSize; i++) {
        let row = new MessageActionRow();

        for (let j = 0; j < boardSize; j++) {
            row.addComponents(
                new MessageButton()
                    .setCustomId(`ttt_board${i}${j}`)
                    .setEmoji(data.board[i][j] === null ? "⬜" : data.board[i][j])
                    .setStyle("SECONDARY")
                    .setDisabled(data.board[i][j] !== null || buttonsAreDisabled)
            );
        }
        rows.push(row);
    }

    return rows;
};

function checkWinner(data) {
    let gameWon = false;
    let x = symbolX.repeat(boardSize);
    let o = symbolO.repeat(boardSize);

    // Check horizontally
    for (let i = 0; i < boardSize; i++) {
        if (data.board[i].join("") === x) {
            gameWon = "host";
        } else if (data.board[i].join("") === o) {
            gameWon = "user";
        }

        if (gameWon) break;
    }

    // Check vertically
    for (let i = 0; i < boardSize; i++) {
        let column = "";
        for (let j = 0; j < boardSize; j++) column += data.board[j][i];

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
        for (let i = 0; i < boardSize; i++) diagonal += data.board[i][i];

        if (diagonal === x) {
            gameWon = "host";
        } else if (diagonal === o) {
            gameWon = "user";
        }
    }

    // Check diagonal (bottom left to upper right)
    if (!gameWon) {
        let diagonal = "";
        for (let i = 0; i < boardSize; i++) diagonal += data.board[boardSize - i - 1][i]; // -1 because its an index and indexes start at 0

        if (diagonal === x) {
            gameWon = "host";
        } else if (diagonal === o) {
            gameWon = "user";
        }
    }

    // check if board is full
    let emptySpace = 0;
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (data.board[i][j] === null) emptySpace++;
        }
    }

    if (emptySpace === 0) data.gameFinished = true;
    if (gameWon === "host") data.hostWon = true;
    else if (gameWon === "user") data.hostWon = false;
    return data;
}

function getConfirmButtons(disabled = false) {
    const row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId(`ttt_accept`)
            .setLabel("Yes")
            .setStyle("SUCCESS")
            .setDisabled(disabled),
        new MessageButton()
            .setCustomId(`ttt_decline`)
            .setLabel("No")
            .setStyle("DANGER")
            .setDisabled(disabled)
    )
    return row;
}

module.exports.execute = async (client, interaction, data) => {
    const bet = interaction.options.getInteger('bet');
    const user = interaction.options.getUser('user');

    if (user.id === interaction.member.id) {
        await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, data.cmd.help.name);
        return await interaction.reply({ content: `You cannot choose yourself as a second player.`, ephemeral: true });
    }

    const secondUserData = await client.database.fetchGuildUser(interaction.guildId, user.id);

    if (bet > data.guildUser.wallet || bet > secondUserData.wallet) {
        await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, data.cmd.help.name);

        if (bet > data.guildUser.wallet) {
            return await interaction.reply({ content: `You don't have :coin: ${bet} in your wallet.`, ephemeral: true });
        } else {
            return await interaction.reply({ content: `${user} doesn't have enough money in their wallet.`, ephemeral: true });
        }
    }

    data.gameStarted = false;
    data.currentPlayer = user.id; // set to used.id to accept the confirm message

    await interaction.reply({ content: `<@${user.id}>\nDo you accept to play a game of Tic Tac Toe with <@${interaction.member.id}>?\nYou have 30 seconds to accept.\n*If you accept, you have to place a bet of :coin: ${bet}.*`, components: [getConfirmButtons(false)] });
    const interactionMessage = await interaction.fetchReply();

    // wait for player to accept
    const filter = async (i) => {
        if (i.member.id === data.currentPlayer) return true;
        await i.reply({ content: `It's not your turn or you are not a player in this game.`, ephemeral: true, target: i.member });
        return false;
    };
    const confirmCollector = interactionMessage.createMessageComponentCollector({ filter, time: 90000 });

    confirmCollector.on('collect', async (interactionConfirmCollector) => {
        await interactionConfirmCollector.deferUpdate();
        if (interactionConfirmCollector.customId === 'ttt_accept') {
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

            await interaction.editReply({ content: "_ _", embeds: [createEmbed(client, data)], components: setButtons(data) });
            const collector = interactionMessage.createMessageComponentCollector({ filter, max: boardSize * boardSize + 1, idle: 15000, time: 15000 * (boardSize * boardSize) });

            collector.on('collect', async (interactionCollector) => {
                if (interactionCollector.customId.startsWith('ttt_board')) {
                    let boardId = interactionCollector.customId.replace('ttt_board', '');
                    if (data.board[parseInt(boardId.charAt(0))][parseInt(boardId.charAt(1))] === null) {
                        data.board[parseInt(boardId.charAt(0))][parseInt(boardId.charAt(1))] = data.currentPlayer === interaction.member.id ? symbolX : symbolO;
                    }

                    data.currentPlayer = data.currentPlayer === interaction.member.id ? user.id : interaction.member.id;
                }

                data = checkWinner(data);
                if (data.hostWon !== null) {
                    if (data.hostWon === true) {
                        data.desc = `<@${interaction.member.id}> won the Tic Tac Toe game!!!`;
                        await client.tools.addMoney(interaction.guildId, interaction.member.id, parseInt(data.bet * 2));
                        await client.tools.removeMoney(interaction.guildId, user.id, data.bet);
                    } else {
                        data.desc = `<@${user.id}> won the Tic Tac Toe game!!!`;
                        await client.tools.addMoney(interaction.guildId, user.id, parseInt(data.bet * 2));
                        await client.tools.removeMoney(interaction.guildId, interaction.member.id, data.bet);
                    }
                } else {
                    if (data.gameFinished) data.desc = "**The game ended in a Tie and nobody won.**";
                }

                await interaction.editReply({ embeds: [createEmbed(client, data)], components: setButtons(data, data.hostWon !== null || data.gameFinished) });
                if (data.gameFinished) return;
            });

            collector.on('end', async (interactionCollector) => {
                if (data.hostWon === null) {
                    data.desc = `<@${data.currentPlayer}> **has waited too long and lost the game.**`;
                    await client.tools.removeMoney(interaction.guildId, data.currentPlayer, data.bet);
                    return await interaction.editReply({ embeds: [createEmbed(client, data)], components: setButtons(data, true) });
                }
            });
        } else if (interactionConfirmCollector.customId === 'ttt_decline') return await interaction.editReply({ components: [getConfirmButtons(true)] });
    });

    confirmCollector.on('end', async (interactionConfirmCollector) => {
        if (!data.gameStarted) return await interaction.editReply({ components: [getConfirmButtons(true)] });
    });
}

module.exports.help = {
    name: "tictactoe",
    description: "Connect 4 X's or O's in a row to win the game. Must be played with 2 users.",
    options: [
        {
            name: 'bet',
            type: 'INTEGER',
            description: 'The bet you want to place.',
            required: true,
            min_value: 50
        },
        {
            name: 'user',
            type: 'USER',
            description: 'Tag your second player here.',
            required: true,
            min_value: 50
        }
    ],
    category: "games",
    extraFields: [],
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    ownerOnly: false,
    cooldown: 900,
    enabled: true
}