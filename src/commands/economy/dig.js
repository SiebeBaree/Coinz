const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

const boardSize = 5;
const maxClicks = 3;
const emptySpace = "⬛";
const lootValues = {
    "👑": {
        value: 30,
        quantity: 3
    },
    "🏅": {
        value: 15,
        quantity: 5
    },
    "💎": {
        value: 50,
        quantity: 2
    }
};

function createEmbed(client, data) {
    let loot = "";
    const keys = Object.keys(lootValues);
    for (let i = 0; i < keys.length; i++) {
        loot += `${keys[i]} is worth :coin: ${lootValues[keys[i]].value}\n`
    }
    if (loot === "") loot = "Wait?? I couldn't find any loot?!";

    const embed = new MessageEmbed()
        .setTitle("Dig")
        .setColor(client.config.embed.color)
        .setDescription(`You can click on ${maxClicks} buttons in total. (${maxClicks - data.buttonsClicked} left)\nYou found :coin: ${data.loot} of loot.\n\n**Loot Table:**\n${loot}`)
    return embed;
}

function setButtons(data, buttonsAreDisabled = false) {
    let rows = [];
    for (let i = 0; i < boardSize; i++) {
        let row = new MessageActionRow();

        for (let j = 0; j < boardSize; j++) {
            row.addComponents(
                new MessageButton()
                    .setCustomId(`dig_board${i}${j}`)
                    .setEmoji(data.board[i][j].icon === null ? emptySpace : data.board[i][j].icon)
                    .setStyle(data.board[i][j].correctGuessed === true ? "SUCCESS" : ((data.board[i][j].correctGuessed === null) ? "SECONDARY" : "DANGER"))
                    .setDisabled(data.board[i][j].icon !== null || buttonsAreDisabled)
            );
        }
        rows.push(row);
    }

    return rows;
}

function createBoard() {
    board = [];

    for (let i = 0; i < boardSize; i++) {
        board.push([]);
        for (let j = 0; j < boardSize; j++) {
            board[i].push({
                icon: null,
                correctGuessed: null
            });
        }
    }

    return board;
}

function setLootItems(client, lootBoard) {
    const keys = Object.keys(lootValues);
    for (let i = 0; i < keys.length; i++) {
        for (let j = 0; j < lootValues[keys[i]].quantity; j++) {
            let row;
            let column;

            do {
                row = client.tools.randomNumber(0, boardSize - 1);
                column = client.tools.randomNumber(0, boardSize - 1);
            } while (lootBoard[row][column].icon !== null);

            lootBoard[row][column].icon = keys[i];
        }
    }

    return lootBoard;
}

module.exports.execute = async (client, interaction, data) => {
    if (!await client.tools.userHasItem(data.guildUser.inventory, "shovel")) {
        await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, data.cmd.help.name);
        return await interaction.reply({ content: "You need a shovel to use this command. Use `/shop buy item_id:shovel` to buy a shovel.", ephemeral: true });
    }

    if (client.tools.randomNumber(1, 100) <= 3) {
        await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, data.cmd.help.name);
        await client.tools.takeItem(interaction, data, "shovel", 1);
        return await interaction.reply({ content: "Oh No! Your shovel broke... You have to buy a new shovel. Use `/shop buy item_id:shovel` to buy a shovel." });
    }

    await interaction.deferReply();

    data.gameFinished = false;
    data.board = createBoard();
    data.lootBoard = createBoard();
    data.lootBoard = setLootItems(client, data.lootBoard);
    data.buttonsClicked = 0;
    data.loot = 0;

    await interaction.editReply({ embeds: [createEmbed(client, data)], components: setButtons(data, data.gameFinished) });
    const interactionMessage = await interaction.fetchReply();

    const filter = async (i) => {
        if (i.member.id === interaction.member.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, max: maxClicks + 1, idle: 15000, time: 45000 });

    collector.on('collect', async (interactionCollector) => {
        await interactionCollector.deferUpdate();
        if (!data.gameFinished) {
            if (interactionCollector.customId.startsWith('dig_board')) {
                let boardId = interactionCollector.customId.replace('dig_board', '');
                let row = parseInt(boardId.charAt(0));
                let column = parseInt(boardId.charAt(1));

                if (data.lootBoard[row][column].icon === null && data.lootBoard[row][column].correctGuessed === null) {
                    data.board[row][column].correctGuessed = data.lootBoard[row][column].correctGuessed = false;
                } else {
                    data.loot += lootValues[data.lootBoard[row][column].icon].value;
                    data.board[row][column].icon = data.lootBoard[row][column].icon;
                    data.board[row][column].correctGuessed = data.lootBoard[row][column].correctGuessed = true;
                }
                data.buttonsClicked++;
            }

            if (data.buttonsClicked >= maxClicks) data.gameFinished = true;
            if (data.gameFinished) {
                await client.tools.addMoney(interaction.guildId, interaction.member.id, data.loot);
                data.board = data.lootBoard;
            }

            await interaction.editReply({ embeds: [createEmbed(client, data)], components: setButtons(data, data.gameFinished) });
        }
    });

    collector.on('end', async (interactionCollector) => {
        if (!data.gameFinished) {
            await client.tools.addMoney(interaction.guildId, interaction.member.id, data.loot);
            return await interaction.editReply({ embeds: [createEmbed(client, data)], components: setButtons(data, true) });
        }
    });
}

module.exports.help = {
    name: "dig",
    description: "Dig up valuable items and sell them for money.",
    options: [],
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 7200,
    enabled: true
}