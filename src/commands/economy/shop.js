const { MessageEmbed, ButtonInteraction, MessageActionRow, MessageSelectMenu } = require('discord.js');
const shopSchema = require('../../database/schemas/shop');

const itemsPerPage = 10;

async function getItems(category) {
    return await shopSchema.find({ category: category.toLowerCase() })
}

function createShop(shopItems, currentPage) {
    let shopStr = "";

    for (let i = 0; i < shopItems.length; i++) {
        if (i >= currentPage * itemsPerPage && i < currentPage * itemsPerPage + itemsPerPage) {
            let buyPrice = ':coin: ' + shopItems[i].buyPrice;
            if (shopItems[i].buyPrice === 0) buyPrice = "Not For Sale";
            shopStr += `${shopItems[i].icon || ':heavy_multiplication_x:'} **${shopItems[i].name}** ― ${buyPrice}\n> ${shopItems[i].shortDescription}\n\n`
        }
    }
    return shopStr;
}

function createShopEmbed(client, shopStr, currentPage, maxPages) {
    let embed = new MessageEmbed()
        .setAuthor({ name: `Coinz Shop` })
        .setColor(client.config.embed.color)
        .setFooter({ text: `/shop [item] to get more info about an item. ─ Page ${currentPage + 1} of ${maxPages}.` })
        .setDescription(shopStr)
    return embed;
}

function createSelectMenu(defaultLabel, disabled = false) {
    let options = [
        { label: 'Tools', value: 'tools' },
        { label: 'Pets', value: 'pets' },
        { label: 'Fish', value: 'fish' },
        { label: 'Miners', value: 'miners' },
        { label: 'Crops', value: 'crops' },
        { label: 'Boosters', value: 'boosters' },
        { label: 'Rare Items', value: 'rare_items' },
        { label: 'Other', value: 'other' }
    ]

    for (let i = 0; i < options.length; i++) {
        if (options[i].value === defaultLabel) {
            options[i].default = true;
        }
    }

    const selectMenu = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('selectCategory')
                .setPlaceholder('The interaction has ended')
                .setDisabled(disabled)
                .addOptions(options),
        );
    return selectMenu;
}

module.exports.execute = async (client, interaction, data) => {
    await interaction.deferReply();
    const itemId = interaction.options.getString('item');

    if (itemId) {
        const item = await client.database.fetchItem(itemId.toLowerCase());
        if (item == null) return interaction.editReply({ content: `That item doesn't exist. Please use \`/shop\` to view all items.` });

        const embed = new MessageEmbed()
            .setTitle(item.name)
            .setColor(client.config.embed.color)
            .setFooter({ text: client.config.embed.footer })
            .setDescription(`> ${item.longDescription || item.shortDescription}`)
            .setThumbnail(`https://cdn.discordapp.com/emojis/${item.icon || '941682404500856922'}.png`)  // https://discord.com/developers/docs/reference#image-formatting

        let buyPrice = ':coin: ' + item.buyPrice;
        let sellPrice = ':coin: ' + item.sellPrice;
        if (item.buyPrice === 0) buyPrice = "You can't buy this item";
        if (item.sellPrice === 0) sellPrice = "You can't sell this item";

        embed.addFields(
            { name: 'Prices', value: `**BUY:** ${buyPrice}\n**SELL:** ${sellPrice}`, inline: true },
            { name: 'Item Info', value: `**Category:** \`${item.category}\`\n**Item ID:** \`${item.itemId}\``, inline: true }
        )

        await interaction.editReply({ embeds: [embed] })
    } else {
        let category = "tools";
        let shopItems = await getItems(category);
        let maxPages = Math.ceil(shopItems.length / itemsPerPage);
        let currentPage = 0;

        let shopStr = createShop(shopItems, currentPage);
        await interaction.editReply({ embeds: [createShopEmbed(client, shopStr, currentPage, maxPages)], components: [createSelectMenu(category), client.tools.setListButtons(currentPage, maxPages)] });

        const filter = (i) => {
            if (i.member.id === interaction.member.id) return true;
            return i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: ButtonInteraction.member })
        }

        const collector = interaction.channel.createMessageComponentCollector({ filter, max: 20, idle: 10000, time: 30000 });

        collector.on('collect', async (interactionCollector) => {
            if (interactionCollector.componentType.toUpperCase() === "BUTTON") {
                if (interactionCollector.customId === 'toLastPage') currentPage = maxPages - 1;
                else if (interactionCollector.customId === 'toFirstPage') currentPage = 0;
                else if (interactionCollector.customId === 'toNextPage') currentPage++;
                else if (interactionCollector.customId === 'toPreviousPage') currentPage--;
            } else if (interactionCollector.componentType.toUpperCase() === "SELECT_MENU") {
                category = interactionCollector.values[0];
                shopItems = await getItems(category);
                maxPages = Math.ceil(shopItems.length / itemsPerPage);
                currentPage = 0;
            }

            shopStr = createShop(shopItems, currentPage);
            await interactionCollector.deferUpdate();
            await interaction.editReply({ embeds: [createShopEmbed(client, shopStr, currentPage, maxPages)], components: [createSelectMenu(category), client.tools.setListButtons(currentPage, maxPages)] });
        })

        collector.on('end', async (interactionCollector) => {
            await interaction.editReply({ components: [createSelectMenu("", true), client.tools.setListButtons(currentPage, maxPages, true)] });
        })
    }
}

module.exports.help = {
    name: "shop",
    description: "Shop for new items or look up there value.",
    options: [
        {
            name: 'item',
            type: 'STRING',
            description: 'The item you want more information on.',
            required: false
        }
    ],
    usage: "[item]",
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "READ_MESSAGE_HISTORY"],
    ownerOnly: false,
    cooldown: 10,
    enabled: true
}