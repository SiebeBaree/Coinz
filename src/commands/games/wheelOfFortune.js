const { MessageEmbed } = require('discord.js');

module.exports.execute = async (client, interaction, data) => {
    await interaction.reply({ content: "This command is still under development. It will be released on <t:1656151200:D>.", ephemeral: true })
}

module.exports.help = {
    name: "wheel-of-fortune",
    description: "Spin the wheel of fortune and claim your prize.",
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