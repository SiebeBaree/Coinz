const { MessageEmbed } = require('discord.js');
const shopSchema = require('../../database/schemas/items');
const guildUserSchema = require('../../database/schemas/guildUsers');

const itemsPerPage = 5;

async function getItems(category) {
    if (category === "all") return await shopSchema.find();
    return await shopSchema.find({ category: category.toLowerCase() });
}

function createShop(shopItems, currentPage) {
    let shopStr = "";

    for (let i = 0; i < shopItems.length; i++) {
        if (i >= currentPage * itemsPerPage && i < currentPage * itemsPerPage + itemsPerPage) {
            let buyPrice = ':coin: ' + shopItems[i].buyPrice;
            if (shopItems[i].buyPrice === 0) buyPrice = "Not For Sale";

            let icon = shopItems[i].emoteId === "" ? ':x:' : `<:${shopItems[i].itemId}:${shopItems[i].emoteId}>`;
            shopStr += `${icon} **${shopItems[i].name}** ― ${buyPrice}\n**ID:** \`${shopItems[i].itemId}\`\n> ${shopItems[i].shortDescription}\n\n`
        }
    }
    return shopStr;
}

function createShopEmbed(client, shopStr, currentPage, maxPages) {
    let embed = new MessageEmbed()
        .setAuthor({ name: `Coinz Shop` })
        .setColor(client.config.embed.color)
        .setFooter({ text: `/shop list [item-id] to get more info about an item. ─ Page ${currentPage + 1} of ${maxPages}.` })
        .setDescription(shopStr)
    return embed;
}

async function execList(client, interaction, data) {
    const itemId = interaction.options.getString('item-id');

    if (itemId) {
        const item = await client.database.fetchItem(itemId.toLowerCase());
        if (item == null) return interaction.reply({ content: `That item doesn't exist. Please use \`/shop\` to view all items.`, ephemeral: true });
        await interaction.deferReply();

        const embed = new MessageEmbed()
            .setTitle(item.name)
            .setColor(client.config.embed.color)
            .setFooter({ text: client.config.embed.footer })
            .setDescription(`> ${item.longDescription || item.shortDescription}`)
            .setThumbnail(`https://cdn.discordapp.com/emojis/${item.emoteId || '941682404500856922'}.png`)  // https://discord.com/developers/docs/reference#image-formatting

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
        await interaction.deferReply();
        let category = "tools";
        let shopItems = await getItems(category);
        let maxPages = Math.ceil(shopItems.length / itemsPerPage);
        let currentPage = 0;

        let shopStr = createShop(shopItems, currentPage);
        await interaction.editReply({ embeds: [createShopEmbed(client, shopStr, currentPage, maxPages)], components: [client.tools.createSelectMenu(category), client.tools.setListButtons(currentPage, maxPages)] });
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
                shopItems = await getItems(category);
                maxPages = Math.ceil(shopItems.length / itemsPerPage);
                currentPage = 0;
            }

            shopStr = createShop(shopItems, currentPage);
            await interactionCollector.deferUpdate();
            await interaction.editReply({ embeds: [createShopEmbed(client, shopStr, currentPage, maxPages)], components: [client.tools.createSelectMenu(category), client.tools.setListButtons(currentPage, maxPages)] });
        })

        collector.on('end', async (interactionCollector) => {
            await interaction.editReply({ components: [client.tools.createSelectMenu("", true), client.tools.setListButtons(currentPage, maxPages, true)] });
        })
    }
}

async function execBuy(client, interaction, data) {
    const itemId = interaction.options.getString('item-id');
    const amount = interaction.options.getInteger('amount') || 1;

    const item = await client.database.fetchItem(itemId.toLowerCase());
    if (item == null) return interaction.reply({ content: `That item doesn't exist. Please use \`/shop\` to view all items.`, ephemeral: true });
    if (item.buyPrice == 0) return interaction.reply({ content: `This item is not for sale.`, ephemeral: true });

    const totalPrice = item.buyPrice * amount;
    if (data.guildUser.wallet < totalPrice) return interaction.reply({ content: `You don't have enough money in your wallet. You need :coin: ${totalPrice}.`, ephemeral: true });
    await interaction.deferReply();
    await client.tools.giveItem(interaction, data, item.itemId, amount);
    await client.tools.removeMoney(interaction.guildId, interaction.member.id, totalPrice);

    await interaction.editReply({ content: `You successfully bought **${amount}x** \`${item.name}\` for :coin: ${totalPrice}.` });
}

async function execSell(client, interaction, data) {
    const itemId = interaction.options.getString('item-id');
    const amount = interaction.options.getInteger('amount') || 1;

    const item = await client.database.fetchItem(itemId.toLowerCase());
    if (item == null) return interaction.reply({ content: `That item doesn't exist. Please use \`/shop\` to view all items.`, ephemeral: true });
    if (item.sellPrice == 0) return interaction.reply({ content: `You can't sell this item.`, ephemeral: true });

    let inventoryItem;
    for (let i = 0; i < data.guildUser.inventory.length; i++) {
        if (data.guildUser.inventory[i].itemId == item.itemId) {
            inventoryItem = data.guildUser.inventory[i];
            break;
        }
    }

    if (inventoryItem === undefined) return interaction.reply({ content: `You don't have that item in your inventory.`, ephemeral: true });
    if (inventoryItem.quantity < amount) return interaction.reply({ content: `You don't ${amount}x of that item in your inventory.`, ephemeral: true });
    await interaction.deferReply();

    const worth = item.sellPrice * amount;
    if (inventoryItem.quantity - amount <= 0) {
        await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id, 'inventory.itemId': item.itemId }, {
            $pull: { 'inventory': { itemId: item.itemId } }
        });
    } else {
        await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id, 'inventory.itemId': item.itemId }, {
            $inc: { 'inventory.$.quantity': -amount }
        });
    }

    await client.tools.addMoney(interaction.guildId, interaction.member.id, worth);
    await interaction.editReply({ content: `You sold **${amount}x** \`${item.name}\` for :coin: ${worth}.` });
}

module.exports.execute = async (client, interaction, data) => {
    if (interaction.options.getSubcommand() === "list") return await execList(client, interaction, data);
    if (interaction.options.getSubcommand() === "buy") return await execBuy(client, interaction, data);
    if (interaction.options.getSubcommand() === "sell") return await execSell(client, interaction, data);
    return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${data.cmd.help.name}\`.`, ephemeral: true });
}

module.exports.help = {
    name: "shop",
    description: "View, buy or sell items with this command.",
    options: [
        {
            name: 'list',
            type: 'SUB_COMMAND',
            description: 'Get all items or get more information about a specific item.',
            options: [
                {
                    name: 'item-id',
                    type: 'STRING',
                    description: 'The item id you want more information on.',
                    required: false
                }
            ]
        },
        {
            name: 'buy',
            type: 'SUB_COMMAND',
            description: 'Buy an item from the shop.',
            options: [
                {
                    name: 'item-id',
                    type: 'STRING',
                    description: 'The item id you want to buy.',
                    required: true
                },
                {
                    name: 'amount',
                    type: 'INTEGER',
                    description: 'The amount you want to buy. Default = 1',
                    required: false,
                    min_value: 1,
                    max_value: 100
                }
            ]
        },
        {
            name: 'sell',
            type: 'SUB_COMMAND',
            description: 'Buy an item from the shop',
            options: [
                {
                    name: 'item-id',
                    type: 'STRING',
                    description: 'The item id you want to sell.',
                    required: true
                },
                {
                    name: 'amount',
                    type: 'INTEGER',
                    description: 'The amount you want to sell. Default = 1',
                    required: false,
                    min_value: 1,
                    max_value: 100
                }
            ]
        }
    ],
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 5,
    enabled: true
}