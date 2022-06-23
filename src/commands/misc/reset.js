const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const guildUsersSchema = require("../../database/schemas/guildUsers");

module.exports.execute = async (client, interaction, data) => {
    const member = interaction.options.getUser('user') || interaction.member;

    const confirmEmbed = new MessageEmbed()
        .setAuthor({ name: `Reset account of ${member.displayName || member.username}`, iconURL: `${member.displayAvatarURL() || client.config.embed.defaultIcon}` })
        .setColor("RED")
        .setFooter({ text: client.config.embed.footer })
        .setDescription(`Are you sure you want to reset the account of ${member.displayName || member.username}?`)

    const confirmRow = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("reset_yes")
            .setLabel("Yes")
            .setStyle("DANGER"),
        new MessageButton()
            .setCustomId("reset_no")
            .setLabel("No")
            .setStyle("SECONDARY")
    );

    await interaction.reply({ embeds: [confirmEmbed], components: [confirmRow] });
    const interactionMessage = await interaction.fetchReply();

    const filter = async (i) => {
        if (i.member.id === interaction.member.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, max: 1, time: 15000 });

    collector.on('collect', async (interactionCollector) => {
        await interactionCollector.deferUpdate();

        let embed = new MessageEmbed()
            .setAuthor({ name: `Reset account of ${member.displayName || member.username}`, iconURL: `${member.displayAvatarURL() || client.config.embed.defaultIcon}` })
            .setColor("GREEN")
            .setFooter({ text: client.config.embed.footer })
            .setDescription(`You canceled the reset, ${member.displayName || member.username} keeps their stats.`)

        if (interactionCollector.customId === 'reset_yes') {
            embed.setColor("RED");
            embed.setDescription(`You succesfully reset the account of ${member.displayName || member.username}.`);
            await guildUsersSchema.deleteOne({ guildId: interaction.guildId, userId: member.id });
        }

        await interaction.editReply({ embeds: [embed] });
    })

    collector.on('end', async (interactionCollector) => {
        await interaction.editReply({ components: [] });
    })
}

module.exports.help = {
    name: "reset",
    description: "Reset your account on this server.",
    options: [
        {
            name: 'user',
            type: 'USER',
            description: 'Tag the player you want to reset (default = yourself, ADMINISTATOR REQUIRED).',
            required: false
        }
    ],
    category: "misc",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 60,
    enabled: true
}