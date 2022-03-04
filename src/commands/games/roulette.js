const { MessageEmbed } = require('discord.js');

const redColors = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

function createEmbed(client, data) {
    let color = "GREEN";
    if (!data.playerWon) color = "RED";

    const embed = new MessageEmbed()
        .setTitle(`Roulette`)
        .setColor(color)
        .addFields(
            { name: 'Ball', value: `The ball landed on **${data.color} ${data.ball}**`, inline: false },
            { name: 'Multiplier', value: `${data.multiplier}x`, inline: true },
            { name: 'Profit', value: `:coin: ${data.playerWon ? parseInt(data.multiplier * data.bet - data.bet) : -data.bet}`, inline: true }
        )
    return embed;
}

function playerWon(data) {
    switch (data.userSpace) {
        case 'red':
            data.playerWon = redColors.includes(data.ball);
            data.multiplier = 2;
            break;
        case 'black':
            data.playerWon = !redColors.includes(data.ball);
            data.multiplier = 2;
            break;
        case 'odd':
            data.playerWon = data.ball % 2 === 1;
            data.multiplier = 2;
            break;
        case 'even':
            data.playerWon = data.ball % 2 === 0;
            data.multiplier = 2;
            break;
        case '1st':
            data.playerWon = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(data.ball);
            data.multiplier = 3;
            break;
        case '2nd':
            data.playerWon = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].includes(data.ball);
            data.multiplier = 3;
            break;
        case '3rd':
            data.playerWon = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].includes(data.ball);
            data.multiplier = 3;
            break;
        case '1-12':
            data.playerWon = data.ball >= 1 && data.ball <= 12;
            data.multiplier = 3;
            break;
        case '13-24':
            data.playerWon = data.ball >= 13 && data.ball <= 24;
            data.multiplier = 3;
            break;
        case '25-36':
            data.playerWon = data.ball >= 25 && data.ball <= 36;
            data.multiplier = 3;
            break;
        case '1-18':
            data.playerWon = data.ball >= 1 && data.ball <= 18;
            data.multiplier = 2;
            break;
        case '19-36':
            data.playerWon = data.ball >= 19 && data.ball <= 36;
            data.multiplier = 2;
            break;
        default:
            data.multiplier = 1;
            data.space = -1;
            break;
    }

    if (data.space === -1) {
        try {
            data.playerWon = data.ball === parseInt(data.userSpace);
            data.multiplier = 36;
            data.space = 0;
        } catch (e) { }
    }
    return data;
}

module.exports.execute = async (client, interaction, data) => {
    const bet = interaction.options.getInteger('bet');
    if (bet > data.guildUser.wallet) {
        await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, data.cmd.help.name);
        return interaction.reply({ content: `You don't have :coin: ${bet} in your wallet.`, ephemeral: true });
    }
    const space = interaction.options.getString('space');

    // initialize variables
    data.bet = bet;
    data.userSpace = space.toLowerCase();
    data.playerWon = false;
    data.ball = client.tools.randomNumber(0, 36);
    data.multiplier = 1;
    data = playerWon(data);
    data.color = redColors.includes(data.ball) ? "red" : "black";
    if (data.space === -1) return interaction.reply({ content: `That is not a valid space. Please check all spaces with \`/help roulette\`.`, epehermal: true });

    if (data.playerWon) {
        await client.tools.addMoney(interaction.guildId, interaction.member.id, parseInt(data.bet * data.multiplier));
    } else {
        await client.tools.removeMoney(interaction.guildId, interaction.member.id, data.bet);
    }

    const embed = new MessageEmbed()
        .setTitle(`Roulette`)
        .setColor(client.config.embed.color)
        .setDescription("Spinning the wheel...")
        .setImage("https://media3.giphy.com/media/26uf2YTgF5upXUTm0/giphy.gif");

    await interaction.reply({ embeds: [embed] });
    await client.tools.timeout(5000);
    await interaction.editReply({ embeds: [createEmbed(client, data)] });
}

module.exports.help = {
    name: "roulette",
    description: "Play a game of roulette.",
    options: [
        {
            name: 'bet',
            type: 'INTEGER',
            description: 'The bet you want to place.',
            required: true,
            min_value: 50
        },
        {
            name: 'space',
            type: 'STRING',
            description: 'For more information on this, visit /help roulette',
            required: true
        }
    ],
    category: "games",
    extraFields: [{ name: 'Space Multiplier', value: '[x36] Straight (1, 2, 3, ..., 36)\n[x3] 1-12, 13-24, 25-36\n[x3] 1st, 2nd, 3rd\n[x2] 1-18, 19-36\n[x 2] Odd, Even\n[x2] red, black', inline: false }],
    image: "https://i.imgur.com/sQuGz7D.png",
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    ownerOnly: false,
    cooldown: 900,
    enabled: true
}