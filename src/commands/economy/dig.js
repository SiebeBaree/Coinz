const Command = require('../../structures/Command.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

class Dig extends Command {
    info = {
        name: "dig",
        description: "Dig up valuable items and sell them for money.",
        options: [],
        category: "economy",
        extraFields: [],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 900,
        enabled: true,
        guildRequired: false,
        memberRequired: true
    };

    boardSize = 5;
    maxClicks = 3;
    emptySpace = "⬛";
    lootValues = {
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

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        if (!await bot.tools.checkItem(data.user.inventory, "shovel")) {
            await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            return await interaction.editReply({ content: "You need a shovel to use this command. Use `/shop buy item-id:shovel` to buy a shovel." });
        }

        if (bot.tools.randomNumber(1, 100) <= 3) {
            await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            await bot.tools.takeItem(interaction.member.id, "shovel", data.user.inventory, 1);
            return await interaction.editReply({ content: "Oh No! Your shovel broke... You have to buy a new shovel. Use `/shop buy item-id:shovel` to buy a shovel." });
        }

        data.gameFinished = false;
        data.board = this.createBoard();
        data.lootBoard = this.createBoard();
        data.lootBoard = this.setLootItems(data.lootBoard);
        data.buttonsClicked = 0;
        data.loot = 0;

        const interactionMessage = await interaction.editReply({ embeds: [this.createEmbed(data)], components: this.setButtons(data, data.gameFinished), fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { max: this.maxClicks + 1, idle: 15000, time: 45000 });

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
                        data.loot += this.lootValues[data.lootBoard[row][column].icon].value;
                        data.board[row][column].icon = data.lootBoard[row][column].icon;
                        data.board[row][column].correctGuessed = data.lootBoard[row][column].correctGuessed = true;
                    }
                    data.buttonsClicked++;
                }

                if (data.buttonsClicked >= this.maxClicks) data.gameFinished = true;
                if (data.gameFinished) {
                    await bot.tools.addMoney(interaction.member.id, data.loot);
                    data.board = data.lootBoard;
                }

                await interaction.editReply({ embeds: [this.createEmbed(data)], components: this.setButtons(data, data.gameFinished) });
            }
        });

        collector.on('end', async (interactionCollector) => {
            if (!data.gameFinished) {
                await bot.tools.addMoney(interaction.member.id, data.loot);
                return await interaction.editReply({ embeds: [this.createEmbed(data)], components: this.setButtons(data, true) });
            }
        });
    }

    createEmbed(data) {
        let loot = "";
        const keys = Object.keys(this.lootValues);
        for (let i = 0; i < keys.length; i++) {
            loot += `${keys[i]} is worth :coin: ${this.lootValues[keys[i]].value}\n`
        }
        if (loot === "") loot = "Wait?? I couldn't find any loot?!";

        const embed = new EmbedBuilder()
            .setTitle("Dig")
            .setColor(bot.config.embed.color)
            .setDescription(`You can click on ${this.maxClicks} buttons in total. (${this.maxClicks - data.buttonsClicked} left)\nYou found :coin: ${data.loot} of loot.\n\n**Loot Table:**\n${loot}`)
        return embed;
    }

    setButtons(data, buttonsAreDisabled = false) {
        let rows = [];
        for (let i = 0; i < this.boardSize; i++) {
            let row = new ActionRowBuilder();

            for (let j = 0; j < this.boardSize; j++) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`dig_board${i}${j}`)
                        .setEmoji(data.board[i][j].icon === null ? this.emptySpace : data.board[i][j].icon)
                        .setStyle(data.board[i][j].correctGuessed === true ? ButtonStyle.Success : ((data.board[i][j].correctGuessed === null) ? ButtonStyle.Secondary : ButtonStyle.Danger))
                        .setDisabled(data.board[i][j].icon !== null || buttonsAreDisabled)
                );
            }
            rows.push(row);
        }

        return rows;
    }

    createBoard() {
        let board = [];

        for (let i = 0; i < this.boardSize; i++) {
            board.push([]);
            for (let j = 0; j < this.boardSize; j++) {
                board[i].push({
                    icon: null,
                    correctGuessed: null
                });
            }
        }

        return board;
    }

    setLootItems(lootBoard) {
        const keys = Object.keys(this.lootValues);
        for (let i = 0; i < keys.length; i++) {
            for (let j = 0; j < this.lootValues[keys[i]].quantity; j++) {
                let row;
                let column;

                do {
                    row = bot.tools.randomNumber(0, this.boardSize - 1);
                    column = bot.tools.randomNumber(0, this.boardSize - 1);
                } while (lootBoard[row][column].icon !== null);

                lootBoard[row][column].icon = keys[i];
            }
        }

        return lootBoard;
    }
}

module.exports = Dig;