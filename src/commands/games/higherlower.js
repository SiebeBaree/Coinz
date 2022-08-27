const Command = require('../../structures/Command.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ApplicationCommandOptionType, Colors } = require('discord.js');

class HigherLower extends Command {
    info = {
        name: "higherlower",
        description: "Is the next number higher, lower or the same as the current number.",
        options: [
            {
                name: 'bet',
                type: ApplicationCommandOptionType.String,
                description: 'The bet you want to place.',
                required: true,
                min_length: 2,
                max_length: 4
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

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const betStr = interaction.options.getString('bet');
        const bet = bot.tools.checkBet(betStr, data.user);

        if (!Number.isInteger(bet)) {
            await interaction.reply({ content: bet, ephemeral: true });
            return await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
        }
        await interaction.deferReply();

        // initialize variables
        data.bet = bet;
        data.gameFinished = false;
        data.playerWon = true;
        data.number = this.getNumber();
        data.correct = 0;

        const interactionMessage = await interaction.editReply({ embeds: [this.createEmbed(data)], components: [this.setButtons(data.gameFinished)], fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { idle: 15000, time: 75000 })

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();

            if (!data.gameFinished) {
                let newNumber = this.getNumber();
                if (interactionCollector.customId === 'hl_higher') {
                    if (data.number >= newNumber) {
                        data.gameFinished = true;
                        data.playerWon = false;
                    }
                } else if (interactionCollector.customId === 'hl_lower') {
                    if (data.number <= newNumber) {
                        data.gameFinished = true;
                        data.playerWon = false;
                    }
                } else if (interactionCollector.customId === 'hl_jackpot') {
                    if (newNumber !== data.number) {
                        data.gameFinished = true;
                        data.playerWon = false;
                    }
                } else if (interactionCollector.customId === 'hl_stop') {
                    data.gameFinished = true;
                }

                if (data.gameFinished) {
                    if (data.playerWon) {
                        await bot.tools.addMoney(interaction.member.id, this.getPrice(data.bet, data.correct));
                        data.color = Colors.Green;

                        await interaction.followUp({ content: `<@${interaction.member.id}>, You won :coin: ${this.getPrice(data.bet, data.correct)}!` })
                    } else {
                        await bot.tools.takeMoney(interaction.member.id, data.bet);
                        data.color = Colors.Red;
                        data.bet = 0;
                        data.number = newNumber;

                        await interaction.followUp({ content: `<@${interaction.member.id}>, You clicked the wrong button... You lost your bet.` })
                    }
                } else {
                    data.correct++;
                    data.number = newNumber;
                }

                await interaction.editReply({ embeds: [this.createEmbed(data)], components: [this.setButtons(data.gameFinished)] });
            }
        });

        collector.on('end', async (interactionCollector) => {
            if (!data.gameFinished) {
                data.gameFinished = true;
                await bot.tools.addMoney(interaction.member.id, this.getPrice(data.bet, data.correct));
                await interaction.editReply({ embeds: [this.createEmbed(data)], components: [this.setButtons(true)] });
                await interaction.followUp({ content: `<@${interaction.member.id}>, You won :coin: ${this.getPrice(data.bet, data.correct)}!` })
            }
        });
    }

    createEmbed(data) {
        let desc = ":point_up: `Higher` ― **The next number is higher.**\n:point_down: `Lower` ― **The next number is lower.**\n:boom: `Jackpot` ― **The next number is the same.**\n:negative_squared_cross_mark: `Stop` ― **Stop the game an claim your money.**";
        desc += `\n\n**Current Number:** \`${data.number}\` *(Between 1-99)*\n**Correct Guesses:** \`${data.correct}\`\n\n:money_with_wings: **Profit:** :coin: ${this.getPrice(data.bet, data.correct)}`;

        const embed = new EmbedBuilder()
            .setTitle(`Higher Lower`)
            .setColor(data.color || bot.config.embed.color)
            .setDescription(desc)
        return embed;
    }

    setButtons(isDisabled = false) {
        let row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("hl_higher")
                .setLabel("Higher")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("☝️")
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("hl_lower")
                .setLabel("Lower")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("👇")
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("hl_jackpot")
                .setLabel("Jackpot")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("💥")
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("hl_stop")
                .setLabel("Stop")
                .setStyle(ButtonStyle.Danger)
                .setEmoji("❎")
                .setDisabled(isDisabled)
        );
        return row;
    }

    getPrice(bet, correct) {
        return parseInt(bet * (correct / 2));
    }

    getNumber() {
        return bot.tools.randomNumber(1, 99);
    }
}

module.exports = HigherLower;