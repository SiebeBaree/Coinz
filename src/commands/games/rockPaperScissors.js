const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

const hand = {
    "Rock": {
        name: "Rock",
        emote: ":rock:",
        weakness: "Paper"
    },
    "Paper": {
        name: "Paper",
        emote: ":page_facing_up:",
        weakness: "Scissors"
    },
    "Scissors": {
        name: "Scissors",
        emote: ":scissors:",
        weakness: "Rock"
    }
}

function createEmbed(client, data) {
    const embed = new MessageEmbed()
        .setTitle(`Rock Paper Scissors`)
        .setColor(data.playerWon === 1 ? "GREEN" : data.playerWon === 0 ? "RED" : client.config.embed.color)
        .setDescription(data.desc === undefined ? "Please select one of the buttons below." : data.desc)
        .addFields(
            { name: 'Your Hand', value: `${data.playerHand || "Not Yet Chosen"}`, inline: true },
            { name: 'Bot\'s Hand', value: `${data.botHand || "Not Yet Chosen"}`, inline: true },
            { name: 'Multiplier', value: `${data.playerWon === false ? 0 : data.multiplier}x`, inline: true },
            { name: 'Profit', value: `:coin: ${parseInt(data.bet * (data.playerWon === 0 ? 1 : data.multiplier)) - data.bet}`, inline: true }
        )
    return embed;
}

function setButtons(isDisabled = false, disableStop = false) {
    let row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("rps_Rock")
            .setLabel("Rock")
            .setStyle("PRIMARY")
            .setDisabled(isDisabled),
        new MessageButton()
            .setCustomId("rps_Paper")
            .setLabel("Paper")
            .setStyle("PRIMARY")
            .setDisabled(isDisabled),
        new MessageButton()
            .setCustomId("rps_Scissors")
            .setLabel("Scissors")
            .setStyle("PRIMARY")
            .setDisabled(isDisabled),
        new MessageButton()
            .setCustomId("rps_stop")
            .setLabel("Stop")
            .setStyle("DANGER")
            .setDisabled(isDisabled || disableStop)
    );
    return row;
};

function getHand(client) {
    return ["Rock", "Paper", "Scissors"][client.tools.randomNumber(0, 2)];
}

function playerWon(playerHand, botHand) {
    if (playerHand === botHand) return 2;
    return hand[playerHand].weakness === botHand ? 0 : 1;
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
    data.playerWon = 0;
    data.multiplier = 0;
    data.playerHand = null;
    data.botHand = null;

    await interaction.reply({ embeds: [createEmbed(client, data)], components: [setButtons(false, true)] });
    const interactionMessage = await interaction.fetchReply();

    const filter = async (i) => {
        if (i.member.id === interaction.member.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, idle: 15000, max: 30000 });

    collector.on('collect', async (interactionCollector) => {
        await interactionCollector.deferUpdate();
        if (!data.gameFinished) {
            if (interactionCollector.customId === 'rps_stop') {
                data.gameFinished = true;
                data.desc = `You stopped the game. You won :coin: ${parseInt(data.bet * data.multiplier - data.bet)}`;
            } else if (interactionCollector.customId.startsWith('rps_')) {
                data.playerHand = interactionCollector.customId.replace('rps_', '');
                data.botHand = getHand(client);

                data.playerWon = playerWon(data.playerHand, data.botHand);
                if (data.playerWon == 1) {
                    data.desc = "**You won against the bot!**\n\nPress `STOP` to stop the game and collect your profit.";
                    data.multiplier++;
                } else if (data.playerWon === 2) {
                    data.desc = "**Tie!**\n\nPress `STOP` to stop the game and collect your profit.";
                }
            }

            if (!data.gameFinished) data.gameFinished = (data.playerWon === 0) ? true : false;

            if (data.gameFinished) {
                if (data.playerWon === 0) {
                    data.desc = "**You lost!** Better luck next time!";
                    await client.tools.removeMoney(interaction.guildId, interaction.member.id, data.bet);
                } else {
                    await client.tools.addMoney(interaction.guildId, interaction.member.id, parseInt(data.bet * data.multiplier - data.bet));
                }
            }

            await interaction.editReply({ embeds: [createEmbed(client, data)], components: [setButtons(data.gameFinished)] });
        }
    })

    collector.on('end', async (interactionCollector) => {
        if (!data.gameFinished) {
            data.gameFinished = true;

            if (data.playerWon === 0) {
                await client.tools.removeMoney(interaction.guildId, interaction.member.id, data.bet);
            } else {
                await client.tools.addMoney(interaction.guildId, interaction.member.id, parseInt(data.bet * data.multiplier - data.bet));
            }

            await interaction.editReply({ embeds: [createEmbed(client, data)], components: [setButtons(true)] });
        }
    })
}

module.exports.help = {
    name: "rock-paper-scissors",
    description: "Play rock paper scissors againt the bot",
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
    cooldown: 900,
    enabled: true
}