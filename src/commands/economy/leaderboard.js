const { MessageEmbed } = require('discord.js');
const guildUserSchema = require('../../database/schemas/guildUsers');
const usersPerPage = 10;

async function createEmbed(client, data) {
    const embed = new MessageEmbed()
        .setTitle(`LeaderBoard (Sort By: ${data.sort})`)
        .setColor(client.config.embed.color)
        .setDescription(await createLeaderBoard(client, data.guildUsers, data.currentPage))
        .setFooter({ text: `Page ${data.currentPage + 1}/${data.maxPages}` })
    return embed;
}

async function createLeaderBoard(client, users, currentPage) {
    str = "";

    for (let i = currentPage * usersPerPage; i < (currentPage + 1) * usersPerPage; i++) {
        if (i > users.length - 1) break;

        try {
            let user = client.users.cache.get(users[i].userId);
            if (user === undefined) user = await client.users.fetch(users[i].userId);
            str += `${currentPage * usersPerPage + i + 1}. **${user.username}#${user.discriminator}** ─ Bank Balance: :coin: ${users[i].bank}\n`;
        } catch {
            str += `${currentPage * usersPerPage + i + 1}. **Unknown** ─ Bank Balance: :coin: ${users[i].bank}\n`;
        }
    }

    if (str === "") {
        str = "There are no users found!";
    }

    return str;
}

module.exports.execute = async (client, interaction, data) => {
    await interaction.deferReply();

    data.sort = "Bank";
    data.currentPage = 0;
    data.guildUsers = await guildUserSchema.find({ guildId: interaction.guildId }).sort({ bank: -1 });
    data.maxPages = Math.ceil(data.guildUsers.length / 10);

    await interaction.editReply({ embeds: [await createEmbed(client, data)], components: [client.tools.setListButtons(data.currentPage, data.maxPages)] });
    const interactionMessage = await interaction.fetchReply();

    const filter = async (i) => {
        if (i.member.id === interaction.member.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, max: 20, idle: 15000, time: 60000 });

    collector.on('collect', async (interactionCollector) => {
        if (interactionCollector.componentType.toUpperCase() === "BUTTON") {
            if (interactionCollector.customId === 'toLastPage') currentPage = maxPages - 1;
            else if (interactionCollector.customId === 'toFirstPage') currentPage = 0;
            else if (interactionCollector.customId === 'toNextPage') currentPage++;
            else if (interactionCollector.customId === 'toPreviousPage') currentPage--;
        }

        await interactionCollector.deferUpdate();
        await interaction.editReply({ embeds: [await createEmbed(client, data)], components: [client.tools.setListButtons(data.currentPage, data.maxPages)] });
    })

    collector.on('end', async (interactionCollector) => {
        await interaction.editReply({ components: [client.tools.setListButtons(data.currentPage, data.maxPages, true)] });
    })
}

module.exports.help = {
    name: "leaderboard",
    description: "Get the leaderboard of your server.",
    options: [],
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 10,
    enabled: true
}