const { MessageEmbed } = require('discord.js');

function createEmbed(client, data) {
    const embed = new MessageEmbed()
        .setTitle(`Horse Race`)
        .setColor(data.color || client.config.embed.color)
        .setDescription(`:moneybag: **Bet:** :coin: ${data.bet}\n:hourglass: **Status:** ${data.status}\n\n**1.** ${"-".repeat(data.horses[0])}:horse_racing:\n**2.** ${"-".repeat(data.horses[1])}:horse_racing:\n**3.** ${"-".repeat(data.horses[2])}:horse_racing:\n**4.** ${"-".repeat(data.horses[3])}:horse_racing:\n**5.** ${"-".repeat(data.horses[4])}:horse_racing:`)
    return embed;
}

module.exports.execute = async (client, interaction, data) => {
    const bet = interaction.options.getInteger('bet');
    const horseNr = interaction.options.getInteger('horse');

    if (bet > data.guildUser.wallet) {
        await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, data.help.name);
        return interaction.reply({ content: `You don't have :coin: ${bet} in your wallet.`, ephemeral: true });
    }

    // setup variable
    data.bet = bet;
    data.userWon = false;
    data.stoppedGame = false;
    data.horses = Array(5).fill(10);
    data.status = "Racing...";

    await interaction.reply({ embeds: [createEmbed(client, data)] });

    // this is a recursive function. Please be careful if you want to edit this function.
    // If you don't know what your doing you might end up with a infinite loop.
    var updateStatus = async function (client, interaction, data) {
        return async function () {
            data.horses[client.tools.randomNumber(0, 4)]--;
            data.horses[client.tools.randomNumber(0, 4)]--;

            for (let i = 0; i < data.horses.length; i++) {
                if (data.horses[i] <= 0) {
                    if (data.horses[i] < 0) data.horses[i] = 0;

                    if (i + 1 === horseNr) {
                        data.userWon = true;
                        data.stoppedGame = true;
                        break;
                    } else {
                        // no break because 2 horses could be winning at the same time
                        data.userWon = false;
                        data.stoppedGame = true;
                    }
                }
            }

            // returning in this function also stops the command
            if (data.userWon && data.stoppedGame) {
                await client.tools.addMoney(interaction.guildId, interaction.member.id, parseInt(data.bet * 4));
                data.color = "GREEN";
                data.status = `Your horse won!\n:money_with_wings: **Profit:** :coin: ${parseInt(data.bet * 3)}`;
                return await interaction.editReply({ embeds: [createEmbed(client, data)] });
            } else if (!data.userWon && data.stoppedGame) {
                await client.tools.removeMoney(interaction.guildId, interaction.member.id, data.bet);
                data.color = "RED";
                data.status = "You lost your money...";
                return await interaction.editReply({ embeds: [createEmbed(client, data)] });
            }

            await interaction.editReply({ embeds: [createEmbed(client, data)] });
            setTimeout(await updateStatus(client, interaction, data), 1500);
        }
    }

    const wait = (func, timeToDelay) => new Promise((resolve) => setTimeout(func, timeToDelay));
    await wait(await updateStatus(client, interaction, data), 1500);
}

module.exports.help = {
    name: "horse-race",
    description: "Bet on the fastest horse to earn money.",
    options: [
        {
            name: 'bet',
            type: 'INTEGER',
            description: 'The bet you want to place.',
            required: true,
            min_value: 50
        },
        {
            name: 'horse',
            type: 'INTEGER',
            description: 'The horse you want to bet on.',
            required: true,
            min_value: 1,
            max_value: 5
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