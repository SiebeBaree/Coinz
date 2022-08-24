const Command = require('../../structures/Command.js');
const { EmbedBuilder, ApplicationCommandOptionType, ComponentType } = require('discord.js');
const ItemModel = require('../../models/Item');
const MemberModel = require('../../models/Member');

class Shop extends Command {
    info = {
        name: "shop",
        description: "View, buy or sell items with this command.",
        options: [
            {
                name: 'list',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get all items or get more information about a specific item.',
                options: [
                    {
                        name: 'item-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The item id you want more information on.',
                        required: false
                    }
                ]
            },
            {
                name: 'buy',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Buy an item from the shop.',
                options: [
                    {
                        name: 'item-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The item id you want to buy.',
                        required: true
                    },
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Integer,
                        description: 'The amount you want to buy. Default = 1',
                        required: false,
                        min_value: 1,
                        max_value: 100
                    }
                ]
            },
            {
                name: 'sell',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Buy an item from the shop',
                options: [
                    {
                        name: 'item-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The item id you want to sell.',
                        required: true
                    },
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Integer,
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
        cooldown: 0,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    itemsPerPage = 5;

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        if (interaction.options.getSubcommand() === "list") return await this.execList(interaction, data);
        if (interaction.options.getSubcommand() === "buy") return await this.execBuy(interaction, data);
        if (interaction.options.getSubcommand() === "sell") return await this.execSell(interaction, data);
        return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${this.info.name}\`.`, ephemeral: true });
    }

    async execList(interaction, data) {
        const itemId = interaction.options.getString('item-id');

        if (itemId) {
            const item = await bot.database.fetchItem(itemId.toLowerCase());
            if (item == null) return await interaction.reply({ content: `That item doesn't exist. Please use </shop list:983096143284174861> to view all items.`, ephemeral: true });
            await interaction.deferReply();

            let buyPrice = ':coin: ' + item.buyPrice;
            let sellPrice = ':coin: ' + item.sellPrice;
            if (item.buyPrice === 0) buyPrice = "You can't buy this item";
            if (item.sellPrice === 0) sellPrice = "You can't sell this item";

            const embed = new EmbedBuilder()
                .setTitle(item.name)
                .setColor(bot.config.embed.color)
                .setFooter({ text: bot.config.embed.footer })
                .setDescription(`> ${item.longDescription || item.shortDescription}`)
                .setThumbnail(`https://cdn.discordapp.com/emojis/${item.emoteId || '941682404500856922'}.png`)  // https://discord.com/developers/docs/reference#image-formatting
                .addFields(
                    { name: 'Prices', value: `**BUY:** ${buyPrice}\n**SELL:** ${sellPrice}`, inline: true },
                    { name: 'Item Info', value: `**Category:** \`${item.category}\`\n**Item ID:** \`${item.itemId}\``, inline: true }
                )

            await interaction.editReply({ embeds: [embed] })
        } else {
            await interaction.deferReply();
            let category = "tools";
            let shopItems = await this.getItems(category);
            let maxPages = Math.ceil(shopItems.length / this.itemsPerPage);
            let currentPage = 0;

            let shopStr = this.createShop(shopItems, currentPage);
            const interactionMessage = await interaction.editReply({ embeds: [this.createShopEmbed(shopStr, currentPage, maxPages)], components: [bot.tools.categoriesSelectMenu(category), bot.tools.pageButtons(currentPage, maxPages)], fetchReply: true });
            const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { max: 20, idle: 15000, time: 60000 });

            collector.on('collect', async (interactionCollector) => {
                if (interactionCollector.componentType === ComponentType.Button) {
                    if (interactionCollector.customId === 'toLastPage') currentPage = maxPages - 1;
                    else if (interactionCollector.customId === 'toFirstPage') currentPage = 0;
                    else if (interactionCollector.customId === 'toNextPage') currentPage++;
                    else if (interactionCollector.customId === 'toPreviousPage') currentPage--;
                } else if (interactionCollector.componentType === ComponentType.SelectMenu) {
                    category = interactionCollector.values[0];
                    shopItems = await this.getItems(category);
                    maxPages = Math.ceil(shopItems.length / this.itemsPerPage);
                    currentPage = 0;
                }

                shopStr = this.createShop(shopItems, currentPage);
                await interactionCollector.deferUpdate();
                await interaction.editReply({ embeds: [this.createShopEmbed(shopStr, currentPage, maxPages)], components: [bot.tools.categoriesSelectMenu(category), bot.tools.pageButtons(currentPage, maxPages)] });
            })

            collector.on('end', async (interactionCollector) => {
                await interaction.editReply({ components: [bot.tools.categoriesSelectMenu("", true), bot.tools.pageButtons(currentPage, maxPages, true)] });
            })
        }
    }

    async execBuy(interaction, data) {
        const itemId = interaction.options.getString('item-id');
        const amount = interaction.options.getInteger('amount') || 1;

        const item = await bot.database.fetchItem(itemId.toLowerCase());
        if (item == null) return await interaction.reply({ content: `That item doesn't exist. Please use </shop list:983096143284174861> to view all items.`, ephemeral: true });
        if (item.buyPrice == 0) return await interaction.reply({ content: `This item is not for sale.`, ephemeral: true });

        const totalPrice = item.buyPrice * amount;
        if (data.user.wallet < totalPrice) return await interaction.reply({ content: `You don't have enough money in your wallet. You need :coin: ${totalPrice}.`, ephemeral: true });
        await interaction.deferReply();
        await bot.tools.addItem(interaction.member.id, item.itemId, amount, data.user.inventory);
        await bot.tools.takeMoney(interaction.member.id, totalPrice);

        await interaction.editReply({ content: `You successfully bought **${amount}x** \`${item.name}\` for :coin: ${totalPrice}.` });
    }

    async execSell(interaction, data) {
        const itemId = interaction.options.getString('item-id');
        const amount = interaction.options.getInteger('amount') || 1;

        const item = await bot.database.fetchItem(itemId.toLowerCase());
        if (item == null) return await interaction.reply({ content: `That item doesn't exist. Please use </shop list:983096143284174861> to view all items.`, ephemeral: true });
        if (item.sellPrice == 0) return await interaction.reply({ content: `You can't sell this item.`, ephemeral: true });
        await interaction.deferReply();

        let inventoryItem;
        for (let i = 0; i < data.user.inventory.length; i++) {
            if (data.user.inventory[i].itemId == item.itemId) {
                inventoryItem = data.user.inventory[i];
                break;
            }
        }

        if (inventoryItem === undefined) return await interaction.editReply({ content: `You don't have that item in your inventory.` });
        if (inventoryItem.quantity < amount) return await interaction.editReply({ content: `You don't ${amount}x of that item in your inventory.` });

        const worth = item.sellPrice * amount;
        if (inventoryItem.quantity - amount <= 0) {
            await MemberModel.updateOne({ id: interaction.member.id, 'inventory.itemId': item.itemId }, { $pull: { 'inventory': { itemId: item.itemId } } });
        } else {
            await MemberModel.updateOne({ id: interaction.member.id, 'inventory.itemId': item.itemId }, { $inc: { 'inventory.$.quantity': -amount } });
        }

        await bot.tools.addMoney(interaction.member.id, worth);
        await interaction.editReply({ content: `You sold **${amount}x** \`${item.name}\` for :coin: ${worth}.` });
    }

    async getItems(category) {
        if (category === "all") return await ItemModel.find();
        return await ItemModel.find({ category: category.toLowerCase() });
    }

    createShop(shopItems, currentPage) {
        let shopStr = "";

        for (let i = 0; i < shopItems.length; i++) {
            if (i >= currentPage * this.itemsPerPage && i < currentPage * this.itemsPerPage + this.itemsPerPage) {
                let buyPrice = ':coin: ' + shopItems[i].buyPrice;
                if (shopItems[i].buyPrice === 0) buyPrice = "Not For Sale";

                let icon = shopItems[i].emoteId === "" ? ':x:' : `<:${shopItems[i].itemId}:${shopItems[i].emoteId}>`;
                shopStr += `${icon} **${shopItems[i].name}** ― ${buyPrice}\n**ID:** \`${shopItems[i].itemId}\`\n> ${shopItems[i].shortDescription}\n\n`
            }
        }
        return shopStr;
    }

    createShopEmbed(shopStr, currentPage, maxPages) {
        const embed = new EmbedBuilder()
            .setAuthor({ name: `Coinz Shop` })
            .setColor(bot.config.embed.color)
            .setFooter({ text: `/${this.info.name} list [item-id] to get more info about an item. ─ Page ${currentPage + 1} of ${maxPages}.` })
            .setDescription(shopStr)
        return embed;
    }
}

module.exports = Shop;