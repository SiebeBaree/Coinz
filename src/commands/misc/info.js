const { MessageEmbed } = require('discord.js');
var { dependencies } = require('../../../package.json');

module.exports.execute = async (client, interaction, data) => {
    await interaction.deferReply();
    const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    const promises = [
        client.shard.fetchClientValues('guilds.cache.size'),
        client.shard.broadcastEval(c => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)),
    ];

    Promise.all(promises)
        .then(results => {
            const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
            const totalMembers = results[1].reduce((acc, memberCount) => acc + memberCount, 0);

            const newEmbed = new MessageEmbed()
                .setAuthor({ name: `Bot Statistics`, iconURL: `${client.user.avatarURL() || client.config.embed.defaultIcon}` })
                .setColor(client.config.embed.color)
                .setFooter({ text: client.config.embed.footer })
                .setTimestamp()
                .setDescription('**If you like this bot, maybe consider [donating](https://coinzbot.xyz/donate).**')
                .addFields(
                    { name: 'Info', value: `:man_technologist: **Developer:** \`Siebe#9999\`\n:globe_with_meridians: **Website: [coinzbot.xyz](${client.config.website})**\n:beginner: **Official Server: [discord.gg/asnZQwc6kW](https://discord.gg/asnZQwc6kW)**\n:books: **Library:** \`discord.js${dependencies["discord.js"]}\``, inline: true },
                    { name: 'Statistics', value: `:video_game: **Commands:** \`${client.commands.size}\`\n:spider_web: **Shard:** \`${interaction.guild.shardId + 1}/${client.shard.count}\`\n:white_check_mark: **Uptime:** \`${client.calc.msToTime(client.uptime)}\`\n:film_frames: **Memory Usage:** \`${Math.round(usedMemory * 100) / 100}\` MB\n:bust_in_silhouette: **Users:** \`${totalMembers}\`\n:printer: **Servers:** \`${totalGuilds}\``, inline: true },
                    { name: 'Disclamer', value: `Icons from the shop are from [icons8](https://icons8.com).`, inline: false }
                )
            return interaction.editReply({ embeds: [newEmbed] });
        }).catch();
}

module.exports.help = {
    name: "info",
    description: "Get some information about Coinz.",
    options: [],
    category: "misc",
    extraFields: [],
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}