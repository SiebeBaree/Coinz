const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

function createEmbed(client, data) {
    let color = client.config.embed.color;
    if (data.playerWon === true) color = "GREEN";
    else if (data.playerWon === false) color = "RED";

    const embed = new MessageEmbed()
        .setTitle(`Russian Roulette`)
        .setColor(color)
        .setDescription("You have a 1/6 chance of shooting the gun with a bullet in the chamber.\n\n:boom: `Shoot` ― **shoot the gun.**\n:no_entry: `Stop` ― **end the game.**")
        .addFields(
            { name: 'Bet Mulitplier', value: `${data.multiplier}x`, inline: true },
            { name: 'Profit', value: `:coin: ${parseInt(data.multiplier * data.bet)}`, inline: true }
        )
    return embed;
}

function setButtons(isDisabled = false) {
    let row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("rr_shoot")
            .setLabel("Shoot")
            .setStyle("DANGER")
            .setDisabled(isDisabled),
        new MessageButton()
            .setCustomId("rr_stop")
            .setLabel("Stop")
            .setStyle("SUCCESS")
            .setDisabled(isDisabled)
    );
    return row;
};

function calcBullets(data) {
    if (data.gun[data.slot]) {
        data.playerWon = false;
        data.gameFinished = true;
    } else {
        data.multiplier += 0.5
        data.playerWon = true;
    }

    if (data.slot >= 5) data.gameFinished = true;
    else data.slot++;
    return data;
}

function getContent(data) {
    if (data.playerWon === null) return ":hourglass_flowing_sand: **Shooting the gun...**";
    if (data.gameFinished && data.playerWon) return ":money_with_wings: **GG! You did not die this game!**";
    return data.playerWon ? ":tada: **You lived! Your multiplier has increased.**" : ":skull: **You died... You lost your bet.**";
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
    data.playerWon = null;
    data.gun = [false, false, false, false, false, true]; // if random generator fails always take last bullet
    data.gun[client.tools.randomNumber(0, data.gun.length - 1)] = true; // put a bullet in a slot
    data.slot = 0; // the current slot of the gun
    data.multiplier = 0;

    await interaction.reply({ content: getContent(data), embeds: [createEmbed(client, data)], components: [setButtons(true)] });
    data = calcBullets(data);
    await client.tools.timeout(2000);
    await interaction.editReply({ content: getContent(data), embeds: [createEmbed(client, data)], components: [setButtons(data.gameFinished)] });
    if (data.gameFinished) return;
    const interactionMessage = await interaction.fetchReply();

    const filter = async (i) => {
        if (i.member.id === interaction.member.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, max: 7, idle: 10000 });

    collector.on('collect', async (interactionCollector) => {
        await interactionCollector.deferUpdate();
        if (!data.gameFinished) {
            if (interactionCollector.customId === 'rr_shoot') {
                data.playerWon = null;
                await interaction.editReply({ content: getContent(data), embeds: [createEmbed(client, data)], components: [setButtons(true)] });
                data = calcBullets(data);
                await client.tools.timeout(2000);
                await interaction.editReply({ content: getContent(data), embeds: [createEmbed(client, data)], components: [setButtons(data.gameFinished)] });
            } else if (interactionCollector.customId === 'rr_stop') {
                data.gameFinished = true;
                await interaction.editReply({ content: getContent(data), embeds: [createEmbed(client, data)], components: [setButtons(data.gameFinished)] });
            }

            if (data.gameFinished) {
                if (data.playerWon) {
                    await client.tools.addMoney(interaction.guildId, interaction.member.id, parseInt(data.bet * data.multiplier));
                } else {
                    await client.tools.removeMoney(interaction.guildId, interaction.member.id, data.bet);
                }
            }

            await interaction.editReply({ content: getContent(data), embeds: [createEmbed(client, data)], components: [setButtons(data.gameFinished)] });
        }
    })

    collector.on('end', async (interactionCollector) => {
        if (!data.gameFinished) {
            data.gameFinished = true;

            if (data.playerWon) {
                await client.tools.addMoney(interaction.guildId, interaction.member.id, parseInt(data.bet * data.multiplier));
            } else {
                await client.tools.removeMoney(interaction.guildId, interaction.member.id, data.bet, true);
            }

            await interaction.editReply({ content: getContent(data), embeds: [createEmbed(client, data)], components: [setButtons(data.gameFinished)] });
        }
    })
}

module.exports.help = {
    name: "russian-roulette",
    description: "Be lucky and don't die with russian roulette.",
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