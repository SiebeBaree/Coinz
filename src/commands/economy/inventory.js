const { MessageEmbed } = require('discord.js');
const shopSchema = require('../../database/schemas/shop');

const itemsPerPage = 10;

async function getItems(inventory, category = "all") {
    let items = [];

    for (let invItem in inventory) {
        let item = await shopSchema.findOne({ itemId: inventory[invItem].itemId });
        item.quantity = inventory[invItem].quantity; // Add quantity to item
        if (item != null && (category === "all" || item.category === category.toLowerCase())) items.push(item);
    }

    return items;
}

function createInventory(item, currentPage) {
    let invStr = "";

    for (let i = 0; i < item.length; i++) {
        if (i >= currentPage * itemsPerPage && i < currentPage * itemsPerPage + itemsPerPage) {
            invStr += `${item[i].icon || ':heavy_multiplication_x:'} **${item[i].name}** ― ${item[i].quantity}\n**ID:** \`${item[i].itemId}\`\n\n`
        }
    }
    return invStr;
}

function createInvEmbed(client, member, desc, currentPage, maxPages) {
    let embed = new MessageEmbed()
        .setAuthor({ name: `${member.displayName || member.username}'s inventory`, iconURL: `${member.displayAvatarURL() || client.config.embed.defaultIcon}` })
        .setColor(client.config.embed.color)
        .setFooter({ text: `/shop list [item-id] to get more info about an item. ─ Page ${currentPage + 1} of ${maxPages}.` })
        .setDescription(desc)
    return embed;
}

module.exports.execute = async (client, interaction, data) => {
    const member = interaction.options.getUser('user') || interaction.member;

    const memberData = await client.database.fetchGuildUser(interaction.guildId, member.id);
    if (memberData.inventory.length <= 0 && member.id === interaction.member.id) return interaction.reply({ content: `You don't have anything in your inventory.`, ephemeral: true });
    if (memberData.inventory.length <= 0) return interaction.reply({ content: `This user doesn't have anything in his inventory.`, ephemeral: true });
    await interaction.deferReply();

    let category = "all";
    let invItems = await getItems(memberData.inventory, category);
    let maxPages = Math.ceil(invItems.length / itemsPerPage);
    let currentPage = 0;

    let invStr = createInventory(invItems, currentPage);
    await interaction.editReply({ embeds: [createInvEmbed(client, member, invStr, currentPage, maxPages)], components: [client.tools.createSelectMenu(category), client.tools.setListButtons(currentPage, maxPages)] });
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
        } else if (interactionCollector.componentType.toUpperCase() === "SELECT_MENU") {
            category = interactionCollector.values[0];
            invItems = await getItems(memberData.inventory, category);
            maxPages = Math.ceil(invItems.length / itemsPerPage);
            currentPage = 0;
        }

        invStr = createInventory(invItems, currentPage);
        await interactionCollector.deferUpdate();
        await interaction.editReply({ embeds: [createInvEmbed(client, member, invStr, currentPage, maxPages)], components: [client.tools.createSelectMenu(category), client.tools.setListButtons(currentPage, maxPages)] });
    })

    collector.on('end', async (interactionCollector) => {
        await interaction.editReply({ components: [client.tools.createSelectMenu("", true), client.tools.setListButtons(currentPage, maxPages, true)] });
    })
}

module.exports.help = {
    name: "inventory",
    description: "View your or someone's inventory.",
    options: [
        {
            name: 'user',
            type: 'USER',
            description: 'Get the inventory of another user.',
            required: false
        }
    ],
    usage: "[user]",
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "READ_MESSAGE_HISTORY"],
    ownerOnly: false,
    cooldown: 10,
    enabled: true
}