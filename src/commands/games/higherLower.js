const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

function createEmbed(client, data) {
    let desc = ":point_up: `Higher` ― **The next number is higher.**\n:point_down: `Lower` ― **The next number is lower.**\n:boom: `Jackpot` ― **The next number is the same.**\n:negative_squared_cross_mark: `Stop` ― **Stop the game an claim your money.**";
    desc += `\n\n**Current Number:** \`${data.number}\` *(Between 1-99)*\n**Correct Guesses:** \`${data.correct}\`\n\n:money_with_wings: **Profit:** :coin: ${getPrice(data.bet, data.correct)}`;

    const embed = new MessageEmbed()
        .setTitle(`Higher Lower`)
        .setColor(data.color || client.config.embed.color)
        .setDescription(desc)
    return embed;
}

function setButtons(isDisabled = false) {
    let row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("hl_higher")
            .setLabel("Higher")
            .setStyle("SECONDARY")
            .setEmoji("☝️")
            .setDisabled(isDisabled),
        new MessageButton()
            .setCustomId("hl_lower")
            .setLabel("Lower")
            .setStyle("SECONDARY")
            .setEmoji("👇")
            .setDisabled(isDisabled),
        new MessageButton()
            .setCustomId("hl_jackpot")
            .setLabel("Jackpot")
            .setStyle("SECONDARY")
            .setEmoji("💥")
            .setDisabled(isDisabled),
        new MessageButton()
            .setCustomId("hl_stop")
            .setLabel("Stop")
            .setStyle("DANGER")
            .setEmoji("❎")
            .setDisabled(isDisabled)
    );
    return row;
}

function getPrice(bet, correct) {
    return parseInt(bet * (correct / 2));
}

function getNumber(client) {
    return client.tools.randomNumber(1, 99);
}

module.exports.execute = async (client, interaction, data) => {
    const bet = interaction.options.getInteger('bet');
    if (bet > data.guildUser.wallet) {
        await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, data.cmd.help.name);
        return interaction.reply({ content: `You don't have :coin: ${bet} in your wallet.`, ephemeral: true });
    }

    // initialize variables
    data.bet = bet;
    data.gameFinished = false;
    data.playerWon = true;
    data.number = getNumber(client);
    data.correct = 0;

    await interaction.deferReply();
    await interaction.editReply({ embeds: [createEmbed(client, data)], components: [setButtons(data.gameFinished)] });
    const interactionMessage = await interaction.fetchReply();

    const filter = async (i) => {
        if (i.member.id === interaction.member.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, idle: 15000, time: 75000 });

    collector.on('collect', async (interactionCollector) => {
        await interactionCollector.deferUpdate();
        if (!data.gameFinished) {
            let newNumber = getNumber(client);
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
                    await client.tools.addMoney(interaction.guildId, interaction.member.id, getPrice(data.bet, data.correct));
                    data.color = "GREEN";

                    await interaction.followUp({ content: `<@${interaction.member.id}>, You won :coin: ${getPrice(data.bet, data.correct)}!` })
                } else {
                    await client.tools.removeMoney(interaction.guildId, interaction.member.id, data.bet);
                    data.color = "RED";
                    data.bet = 0;
                    data.number = newNumber;

                    await interaction.followUp({ content: `<@${interaction.member.id}>, You clicked the wrong button... You lost your bet.` })
                }
            } else {
                data.correct++;
                data.number = newNumber;
            }

            await interaction.editReply({ embeds: [createEmbed(client, data)], components: [setButtons(data.gameFinished)] });
        }
    })

    collector.on('end', async (interactionCollector) => {
        if (!data.gameFinished) {
            data.gameFinished = true;
            await client.tools.addMoney(interaction.guildId, interaction.member.id, getPrice(data.bet, data.correct));
            await interaction.editReply({ embeds: [createEmbed(client, data)], components: [setButtons(true)] });
            await interaction.followUp({ content: `<@${interaction.member.id}>, You won :coin: ${getPrice(data.bet, data.correct)}!` })
        }
    })
}

module.exports.help = {
    name: "higherlower",
    description: "Is the next number higher, lower or the same as the current number.",
    options: [
        {
            name: 'bet',
            type: 'INTEGER',
            description: 'The bet you want to place.',
            required: true,
            min_value: 50
        }
    ],
    category: "games",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 300,
    enabled: true
}