const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

function createEmbed(client, multiplier, profit, color = undefined) {
    const embed = new MessageEmbed()
        .setTitle(`Crash`)
        .setColor(color || client.config.embed.color)
        .setDescription("Every 1.5 seconds the multiplier goes up by 0.2x.\nEvery time this happens you have 15% chance to lose all money.\nTo claim the profits, press the sell button.")
        .addFields(
            { name: 'Multiplier', value: `${Math.round(multiplier * 10) / 10}x`, inline: true },
            { name: 'Profit', value: `:coin: ${profit}`, inline: true }
        )
    return embed;
}

function setButton(buttonIsDisabled = false) {
    let row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("crash_stop")
            .setLabel("Sell")
            .setStyle("DANGER")
            .setDisabled(buttonIsDisabled),
    );
    return row;
};

module.exports.execute = async (client, interaction, data) => {
    const bet = interaction.options.getInteger('bet');
    if (bet > data.guildUser.wallet) {
        await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, data.help.name);
        return interaction.reply({ content: `You don't have :coin: ${bet} in your wallet.`, ephemeral: true });
    }

    // setup variable
    let userWon = false;
    let profit = bet;
    let multiplier = 1.0;
    let stoppedGame = false;

    await interaction.reply({ embeds: [createEmbed(client, multiplier, profit - bet)], components: [setButton()] });
    const interactionMessage = await interaction.fetchReply();

    const filter = async (i) => {
        if (i.member.id === interaction.member.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, time: 20000 });

    collector.on('collect', async (interactionCollector) => {
        await interactionCollector.deferUpdate();
        userWon = true;
        stoppedGame = true;
    });

    collector.on('end', async (interactionCollector) => {
        if (!stoppedGame) {
            await interaction.editReply({ components: [setButton(true)] });
            stoppedGame = true; // stop the game but keep the current userWon variable
        }
    });

    // this is a recursive function. Please be careful if you want to edit this function.
    // If you don't know what your doing you might end up with a infinite loop
    var updateStatus = async function (client, interaction, multiplier, profit) {
        return async function () {
            // returning in this function also stops the command
            if (userWon && stoppedGame) {
                await client.tools.addMoney(interaction.guildId, interaction.member.id, Math.floor(profit * multiplier) - bet);
                return await interaction.editReply({ embeds: [createEmbed(client, multiplier, Math.floor(profit * multiplier) - bet, "GREEN")], components: [setButton(true)] });
            } else if (!userWon && stoppedGame) {
                await client.tools.removeMoney(interaction.guildId, interaction.member.id, bet);
                return await interaction.editReply({ embeds: [createEmbed(client, multiplier, -bet, "RED")], components: [setButton(true)] });
            }

            multiplier = Math.round((multiplier + 0.2) * 10) / 10;
            await interaction.editReply({ embeds: [createEmbed(client, multiplier, Math.floor(profit * multiplier) - bet)] });
            if (client.tools.commandPassed(15)) {
                userWon = false;
                stoppedGame = true;
            }

            setTimeout(await updateStatus(client, interaction, multiplier, profit), 1500);
        }
    }

    const wait = (func, timeToDelay) => new Promise((resolve) => setTimeout(func, timeToDelay));
    await wait(await updateStatus(client, interaction, multiplier, profit), 1500);
}

module.exports.help = {
    name: "crash",
    description: "Are you fast enough to sell before the market crashes?",
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
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    ownerOnly: false,
    cooldown: 900,
    enabled: true
}