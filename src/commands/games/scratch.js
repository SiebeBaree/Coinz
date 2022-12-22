import Command from '../../structures/Command.js'
import { EmbedBuilder, ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import { checkBet, randomNumber } from '../../lib/helpers.js'
import { createMessageComponentCollector } from '../../lib/embed.js'
import { addMoney, addRandomExperience, takeMoney } from '../../lib/user.js'

export default class extends Command {
    info = {
        name: "scratch",
        description: "Scratch off a card to win money.",
        options: [
            {
                name: 'bet',
                type: ApplicationCommandOptionType.String,
                description: 'The bet you want to place.',
                required: true,
                min_length: 2,
                max_length: 5
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

    boardSize = 5;
    maxClicks = 3;
    notScratched = "💸";
    scratched = "⬛";
    lootValues = {
        "🎲": {
            value: 0.4,
            quantity: 5
        },
        "💰": {
            value: 0.6,
            quantity: 3
        },
        "💎": {
            value: 1,
            quantity: 2
        }
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const betStr = interaction.options.getString('bet');
        let bet = 50;

        if (["all", "max"].includes(betStr.toLowerCase())) {
            if (data.user.wallet <= 0) return await interaction.reply({ content: `You don't have any money in your wallet.`, ephemeral: true });

            if (data.premium.premium) {
                bet = data.user.wallet > 10000 ? 10000 : data.user.wallet;
            } else {
                bet = data.user.wallet > 5000 ? 5000 : data.user.wallet;
            }
        } else {
            bet = checkBet(betStr, data.user, data.premium.premium);

            if (!Number.isInteger(bet)) {
                await interaction.reply({ content: bet, ephemeral: true });
                return await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            }
        }
        await interaction.deferReply();

        data.bet = bet;
        data.gameFinished = false;
        data.board = this.createBoard();
        data.lootBoard = this.createBoard();
        data.lootBoard = this.setLootItems(data.lootBoard);
        data.buttonsClicked = 0;
        data.multiplier = 0.0;

        const interactionMessage = await interaction.editReply({ embeds: [this.createEmbed(data)], components: this.setButtons(data, data.gameFinished), fetchReply: true });
        const collector = createMessageComponentCollector(interactionMessage, interaction, { max: this.maxClicks + 1, idle: 15000, time: 45000 });

        collector.on('collect', async (i) => {
            if (!data.gameFinished) {
                if (i.customId.startsWith('scratch_board')) {
                    let boardId = i.customId.replace('scratch_board', '');
                    let row = parseInt(boardId.charAt(0));
                    let column = parseInt(boardId.charAt(1));

                    if (data.lootBoard[row][column].icon === null) {
                        data.board[row][column].correctGuessed = data.lootBoard[row][column].correctGuessed = false;
                    } else {
                        if (this.lootValues[data.lootBoard[row][column].icon] === undefined) bot.logger.error(`Error with /dig. icon: ${data.lootBoard[row][column].icon}`);
                        data.multiplier += this.lootValues[data.lootBoard[row][column].icon].value;
                        data.board[row][column].icon = data.lootBoard[row][column].icon;
                        data.board[row][column].correctGuessed = data.lootBoard[row][column].correctGuessed = true;
                    }
                    data.buttonsClicked++;
                }

                if (data.buttonsClicked >= this.maxClicks) data.gameFinished = true;
                if (data.gameFinished) {
                    await addMoney(interaction.member.id, this.getMoney(data.bet, data.multiplier));
                    data.board = data.lootBoard;
                }

                await i.update({ embeds: [this.createEmbed(data)], components: this.setButtons(data, data.gameFinished) });
            }
        });

        collector.on('end', async (i) => {
            if (!data.gameFinished) {
                await addMoney(interaction.member.id, this.getMoney(data.bet, data.multiplier));
                return await interaction.editReply({ embeds: [this.createEmbed(data)], components: this.setButtons(data, true) });
            }
        });
    }

    createEmbed(data) {
        let loot = "";
        const keys = Object.keys(this.lootValues);
        for (let i = 0; i < keys.length; i++) {
            loot += `${keys[i]} will multiply your bet by \`${this.lootValues[keys[i]].value}x\`\n`
        }

        const embed = new EmbedBuilder()
            .setTitle("Scratch")
            .setColor(bot.config.embed.color)
            .addFields(
                { name: "Statistics", value: `:star: **Scratch Fields:** ${this.maxClicks - data.buttonsClicked} left\n:moneybag: **Profit:** :coin: ${this.getMoney(data.bet, data.multiplier)}.`, inline: false },
                { name: "Loot Table", value: loot !== "" ? loot : "Wait?? I couldn't find any multipliers?!", inline: false }
            )
        return embed;
    }

    setButtons(data, buttonsAreDisabled = false) {
        let rows = [];
        for (let i = 0; i < this.boardSize; i++) {
            let row = new ActionRowBuilder();

            for (let j = 0; j < this.boardSize; j++) {
                let emoji = data.board[i][j].icon === null ? this.notScratched : data.board[i][j].icon;
                if (data.board[i][j].icon === null && data.board[i][j].correctGuessed === false) emoji = this.scratched;
                if (data.board[i][j].icon === null && buttonsAreDisabled) emoji = this.scratched;

                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`scratch_board${i}${j}`)
                        .setEmoji(emoji)
                        .setStyle(data.board[i][j].correctGuessed === true ? ButtonStyle.Success : ((data.board[i][j].correctGuessed === null) ? ButtonStyle.Secondary : ButtonStyle.Danger))
                        .setDisabled(data.board[i][j].correctGuessed !== null || buttonsAreDisabled)
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
                    row = randomNumber(0, this.boardSize - 1);
                    column = randomNumber(0, this.boardSize - 1);
                } while (lootBoard[row][column].icon !== null);

                lootBoard[row][column].icon = keys[i];
            }
        }

        return lootBoard;
    }

    getMoney(bet, multiplier) {
        return Math.floor(bet * multiplier) - bet;
    }
}