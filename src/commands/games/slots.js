const { MessageEmbed } = require('discord.js');

const spinningEmote = "<a:spinning_slots:949712124165365810>";
const emotes = {
    ":100:": 1,
    ":moneybag:": 2.5,
    ":dollar:": 3,
    ":gem:": 4,
    ":first_place:": 6
}

function createEmbed(client, data) {
    const embed = new MessageEmbed()
        .setTitle(`Slot Machine`)
        .setColor(data.color || client.config.embed.color)
        .setDescription(`:moneybag: **Bet:** :coin: ${data.bet}\n:hourglass: **Status:** ${data.status}\n\n${getSlots(data.slot)}`)
    return embed;
}

function getSlots(slot) {
    let slotStr = "";

    for (let i = 0; i < slot.length; i++) {
        for (let j = 0; j < slot[i].length; j++) {
            slotStr += `${slot[i][j]}${j < slot[i].length - 1 ? " | " : ""}${(j === slot[i].length - 1 && i === Math.floor(slot.length / 2)) ? " :arrow_left:" : ""}`;
        }
        slotStr += "\n";
    }

    return slotStr;
}

module.exports.execute = async (client, interaction, data) => {
    const bet = interaction.options.getInteger('bet');

    if (bet > data.guildUser.wallet) {
        await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, data.cmd.help.name);
        return interaction.reply({ content: `You don't have :coin: ${bet} in your wallet.`, ephemeral: true });
    }

    // setup variable
    data.bet = bet;
    data.userWon = true;
    data.slot = [Array(3).fill(spinningEmote), Array(3).fill(spinningEmote), Array(3).fill(spinningEmote)];
    data.index = 0;
    data.status = "Spinning...";
    data.keys = Object.keys(emotes);

    await interaction.reply({ embeds: [createEmbed(client, data)] });

    // this is a recursive function. Please be careful if you want to edit this function.
    // If you don't know what your doing you might end up with a infinite loop.
    var updateStatus = async function (client, interaction, data) {
        return async function () {
            for (let i = 0; i < data.slot[0].length; i++) {
                data.slot[i][data.index] = data.keys[client.tools.randomNumber(0, data.keys.length - 1)];
            }

            data.index++;
            if (data.index < data.slot.length) {
                await interaction.editReply({ embeds: [createEmbed(client, data)] });
                setTimeout(await updateStatus(client, interaction, data), 2000);
            } else {
                let referenceEmote = data.slot[1][0];
                for (let i = 1; i < data.slot[1].length; i++) {
                    if (data.slot[1][i] !== referenceEmote) {
                        data.userWon = false;
                    }
                }

                if (data.userWon) {
                    let betMultiplier = emotes[referenceEmote];
                    data.status = `You won :coin: ${Math.round(data.bet * betMultiplier)}.`;
                    data.color = "GREEN";
                    await client.tools.addMoney(interaction.guildId, interaction.member.id, Math.round(data.bet * betMultiplier));
                } else {
                    data.status = `You lost :coin: ${data.bet}.`;
                    data.color = "RED";
                    await client.tools.removeMoney(interaction.guildId, interaction.member.id, data.bet);
                }
                return await interaction.editReply({ embeds: [createEmbed(client, data)] });
            }
        }
    }

    const wait = (func, timeToDelay) => new Promise((resolve) => setTimeout(func, timeToDelay));
    await wait(await updateStatus(client, interaction, data), 2000);
}

module.exports.help = {
    name: "slots",
    description: "Try your luck on the slot machines.",
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