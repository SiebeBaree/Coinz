const { MessageEmbed } = require('discord.js');

module.exports.execute = async (client, interaction, data) => {
    const member = interaction.options.getUser('user') || interaction.member;
    if (member.bot) return interaction.reply({ content: 'That user is a bot. You can only check the balance of a real person.', ephemeral: true });
    await interaction.deferReply();
    const memberData = await client.database.fetchGuildUser(interaction.guildId, member.id);
    const netWorth = await client.calc.getNetWorth(client, memberData);

    const embed = new MessageEmbed()
        .setAuthor({ name: `${member.displayName || member.username}'s balance`, iconURL: `${member.displayAvatarURL() || client.config.embed.defaultIcon}` })
        .setColor(client.config.embed.color)
        .addFields(
            { name: 'Wallet', value: `:coin: ${memberData.wallet}`, inline: true },
            { name: 'Bank', value: `:coin: ${memberData.bank}`, inline: true },
            { name: 'Net Worth', value: `:coin: ${netWorth.netWorth}`, inline: true }
        )
    await interaction.editReply({ embeds: [embed] });
}

module.exports.help = {
    name: "balance",
    description: "Get your balance or the balance of another user.",
    options: [
        {
            name: 'user',
            type: 'USER',
            description: 'Get the balance of another user.',
            required: false
        }
    ],
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}