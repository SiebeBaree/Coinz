const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const guildUsersSchema = require("../../database/schemas/guildUsers");

module.exports.execute = async (client, interaction, data) => {
    const confirmEmbed = new MessageEmbed()
        .setTitle(`Purge ALL data from this server?`)
        .setColor("RED")
        .setFooter({ text: client.config.embed.footer })
        .setDescription(`Are you sure you want to delete ALL data from this server?`)

    const confirmRow = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("purge_yes")
            .setLabel("Yes")
            .setStyle("DANGER"),
        new MessageButton()
            .setCustomId("purge_no")
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
            .setTitle(`Purge Data`)
            .setColor("GREEN")
            .setFooter({ text: client.config.embed.footer })
            .setDescription(`Oof, no data was deleted...`)

        if (interactionCollector.customId === 'purge_yes') {
            embed.setColor("RED");
            embed.setDescription(`All data is purged.`);
            await guildUsersSchema.deleteMany({ guildId: interaction.guildId });
        }

        await interaction.editReply({ embeds: [embed] });
    })

    collector.on('end', async (interactionCollector) => {
        await interaction.editReply({ components: [] });
    })
}

module.exports.help = {
    name: "purge",
    description: "Purge all data on this server.",
    options: [],
    category: "misc",
    extraFields: [],
    memberPermissions: ["ADMINISTRATOR"],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    ownerOnly: false,
    cooldown: 300,
    enabled: true
}