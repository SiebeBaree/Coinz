const { MessageEmbed } = require('discord.js');

module.exports.execute = async (client, interaction, data) => {
    const bet = interaction.options.getInteger('bet');

    if (bet > data.guildUser.wallet) {
        await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, data.cmd.help.name);
        return interaction.reply({ content: `You don't have :coin: ${bet} in your wallet.`, ephemeral: true });
    }

    const side = interaction.options.getString('coin-side');
    const randomNumber = client.tools.randomNumber(0, 1);
    const sideLanded = randomNumber === 0 ? "HEAD" : "TAILS";

    const newEmbed = new MessageEmbed()
        .setAuthor({ name: `Coinflip`, iconURL: `${client.user.avatarURL() || client.config.embed.defaultIcon}` })
        .setColor(sideLanded === side ? "GREEN" : "RED")
        .setFooter({ text: client.config.embed.footer })
        .setDescription(`:coin: **You chose:** ${side}\n:moneybag: **Your Bet:** :coin: ${bet}\n\n**The coin landed on:** ${sideLanded}\n${side === sideLanded ? "**You won:** :coin: " + parseInt(bet * 1.5) : "**You lost:** :coin: " + bet}`)
        .setThumbnail(sideLanded === "HEAD" ? "https://cdn.coinzbot.xyz/games/coinflip/coin-head.png" : "https://cdn.coinzbot.xyz/games/coinflip/coin-tail.png")
    await interaction.reply({ embeds: [newEmbed] });

    if (sideLanded === side) {
        await client.tools.addMoney(interaction.guildId, interaction.member.id, parseInt(bet * 0.5));
    } else {
        await client.tools.removeMoney(interaction.guildId, interaction.member.id, bet);
    }
}

module.exports.help = {
    name: "coinflip",
    description: "Flip a coin and guess on what side it's going to land.",
    options: [
        {
            name: 'bet',
            type: 'INTEGER',
            description: 'The bet you want to place.',
            required: true,
            min_value: 50
        },
        {
            name: 'coin-side',
            type: 'STRING',
            description: 'The side of the coin you thinks it\'s going to land on. < HEAD or TAILS >',
            required: true,
            choices: [
                {
                    name: "HEAD",
                    value: "HEAD"
                },
                {
                    name: "TAILS",
                    value: "TAILS"
                }
            ]
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