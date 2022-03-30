const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js');
const stocksSchema = require('../../database/schemas/stocks');
const guildUserSchema = require('../../database/schemas/guildUsers');
const moment = require('moment-timezone');
const market = require('../../data/market/stocks.json');

const timezone = "America/New_York";
const dateFormat = "DD/MM/YYYY";
const timeFormat = "HH:mm";
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const maxOwnedStock = 50000000;
const maxPurchase = 1000000;
const itemsPerPage = 5;

function createEmbed(client, stocks, currentPage, maxPages) {
    const embed = new MessageEmbed()
        .setAuthor({ name: `Market list` })
        .setColor(client.config.embed.color)
        .setDescription(`**More Info:** \`/market info <ticker>\`\n**Example:** \`/market info AAPL\`\n\n${createStocksStr(client, stocks, currentPage)}\nLast Updated: <t:${stocks[0].lastUpdated}:R>`)
        .setFooter({ text: `Page ${currentPage + 1} of ${maxPages}.` })
    return embed;
}

async function getStocks(category) {
    return await stocksSchema.find({ type: category });
}

function createStocksStr(client, stocks, currentPage) {
    let str = "";
    for (let i = 0; i < stocks.length; i++) {
        if (i >= currentPage * itemsPerPage && i < currentPage * itemsPerPage + itemsPerPage) {
            const change = calculateChange(client, stocks[i]);
            str += `• **${stocks[i].fullName}** (${stocks[i].ticker})\n> :coin: ${stocks[i].price} (${change.icon} ${change.changePercentage}%)\n\n`
        }
    }
    return str;
}

function calculateChange(client, stock) {
    let icon = ":chart_with_upwards_trend:"
    let changePercentage = client.calc.roundNumber(((stock.price - stock.previousClose) / stock.previousClose * 100), 2);
    if (changePercentage < 0) icon = ":chart_with_downwards_trend:";
    return { icon: icon, changePercentage: changePercentage };
}

function createSelectMenu(defaultLabel, disabled = false) {
    let options = [
        { label: 'Stocks', value: 'Stock' },
        { label: 'Crypto', value: 'Crypto' }
    ]

    for (let i = 0; i < options.length; i++) {
        if (options[i].value === defaultLabel) {
            options[i].default = true;
        }
    }

    const selectMenu = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('selectCategoryMarket')
                .setPlaceholder('The interaction has ended')
                .setDisabled(disabled)
                .addOptions(options),
        );
    return selectMenu;
}

async function isMarketOpen() {
    try {
        const now = moment.tz(Date.now(), timezone);
        const date = now.format(dateFormat);
        const openDateTime = moment.tz(`${date} ${market.openingTime}`, dateTimeFormat, timezone);
        const closeDateTime = moment.tz(`${date} ${market.closeTime}`, dateTimeFormat, timezone);

        if (now.isBetween(openDateTime, closeDateTime) && !market.marketCloseDays.includes(parseInt(now.format("ddd")))) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
}

async function execInfo(client, interaction, data) {
    const ticker = interaction.options.getString('ticker');

    if (ticker == null) {
        await interaction.deferReply();
        let category = "Stock";
        let stocks = await getStocks(category);
        let maxPages = Math.ceil(stocks.length / itemsPerPage);
        let currentPage = 0;

        await interaction.editReply({ embeds: [createEmbed(client, stocks, currentPage, maxPages)], components: [createSelectMenu(category), client.tools.setListButtons(currentPage, maxPages)] });
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
                stocks = await getStocks(category);
                maxPages = Math.ceil(stocks.length / itemsPerPage);
                currentPage = 0;
            }

            await interactionCollector.deferUpdate();
            await interaction.editReply({ embeds: [createEmbed(client, stocks, currentPage, maxPages)], components: [createSelectMenu(category), client.tools.setListButtons(currentPage, maxPages)] });
        })

        collector.on('end', async (interactionCollector) => {
            await interaction.editReply({ components: [createSelectMenu("", true), client.tools.setListButtons(currentPage, maxPages, true)] });
        })
    } else {
        let stock = await client.database.fetchStock(ticker.toUpperCase());
        if (stock == null) return interaction.reply({ content: `Sorry we don't know any asset with ticker \`${ticker.toUpperCase()}\`.\nPlease use \`/market info\` to get all stocks and crypto.`, ephemeral: true });

        let market = "";
        if (stock.type === "Stock") market = `\n:radio_button: **Market:** ${isMarketOpen() ? 'Open' : 'Closed'}`;
        const change = calculateChange(client, stock);

        const embed = new MessageEmbed()
            .setAuthor({ name: `${stock.type}: ${stock.fullName}` })
            .setColor(client.config.embed.color)
            .setThumbnail(`https://cdn.coinzbot.xyz/ticker/${stock.ticker.toUpperCase()}.png`)
            .addFields(
                { name: `Info`, value: `:envelope: **Type:** ${stock.type}\n:tickets: **Ticker:** ${stock.ticker}\n:apple: **Full Name:** ${stock.fullName}\n:clock1: **Last Updated:** <t:${stock.lastUpdated}:R>`, inline: true },
                { name: `Stats`, value: `:moneybag: **Price:** :coin: ${stock.price}\n${change.icon} **Change:** ${change.changePercentage}%${market}`, inline: true },
            )
        await interaction.reply({ embeds: [embed] });
    }
}

async function execBuy(client, interaction, data) {
    const ticker = interaction.options.getString('ticker');
    let amount = interaction.options.getInteger('amount');
    let price = interaction.options.getInteger('price');

    if (price === null && amount === null) return await interaction.reply({ content: `You have to give an amount that you wan't to buy or price to buy fractional.`, ephemeral: true });
    if (price !== null && amount !== null) return await interaction.reply({ content: `You cannot buy an amount and give a price at the same time.`, ephemeral: true })

    let stock = await client.database.fetchStock(ticker.toUpperCase());
    if (stock == null) return interaction.reply({ content: `Sorry we don't know any stock or crypto with ticker \`${ticker.toUpperCase()}\`.\nPlease use \`/market info\` to get all stocks and crypto currencies.`, ephemeral: true });

    if (amount !== null) {
        price = Math.round(stock.price * amount);
    } else {
        amount = client.calc.roundNumber(price / stock.price, 3);
    }

    if (amount > maxOwnedStock) return await interaction.reply({ content: `You can't own more than ${maxOwnedStock} shares or crypto.`, ephemeral: true });
    if (price > maxPurchase) return await interaction.reply({ content: `You can't buy more than :coin: ${maxPurchase} at once.`, ephemeral: true });

    if (data.guildUser.wallet < price) {
        const embed = new MessageEmbed()
            .setTitle(`Not enough money`)
            .setColor("RED")
            .setDescription(`You do not have enough money in your wallet.`)
            .addFields(
                { name: 'Total Price', value: `:coin: ${price}`, inline: true },
                { name: 'Money In Wallet', value: `:coin: ${data.guildUser.wallet}`, inline: true },
                { name: 'Money Needed', value: `:coin: ${(price - data.guildUser.wallet) || 1}`, inline: true }
            )
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    await interaction.deferReply();

    let userAlreadyHasStock = false;
    for (let i = 0; i < data.guildUser.stocks.length; i++) {
        if (data.guildUser.stocks[i].ticker === stock.ticker) {
            userAlreadyHasStock = true;
            break;
        }
    }

    if (userAlreadyHasStock) {
        await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id, 'stocks.ticker': stock.ticker }, {
            $inc: {
                'stocks.$.quantity': amount,
                'stocks.$.buyPrice': price
            }
        });
    } else {
        const stocksObj = {
            ticker: stock.ticker,
            quantity: amount,
            buyPrice: price
        };

        await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
            $push: { stocks: stocksObj }
        });
    }
    await client.tools.removeMoney(interaction.guildId, interaction.member.id, price)

    const embed = new MessageEmbed()
        .setTitle(`You just bought ${amount}x ${stock.fullName}`)
        .setColor(client.config.embed.color)
        .setThumbnail(`https://cdn.coinzbot.xyz/ticker/${stock.ticker.toUpperCase()}.png`)
        .addFields(
            { name: 'Info', value: `:envelope: **Type:** ${stock.type}\n:tickets: **Ticker:** ${stock.ticker}\n:apple: **Full Name:** ${stock.fullName}`, inline: true },
            { name: 'Stats', value: `:moneybag: **Unit Price:** :coin: ${stock.price}\n:1234: **Amount:** ${amount}x\n:gem: **Buy Price:** :coin: ${price}`, inline: true }
        )
    await interaction.editReply({ embeds: [embed] });
}

async function execSell(client, interaction, data) {
    const ticker = interaction.options.getString('ticker');
    const amount = interaction.options.getNumber('amount');

    let stock = await client.database.fetchStock(ticker.toUpperCase());
    if (stock == null) return interaction.reply({ content: `Sorry we don't know any stock or crypto with ticker \`${ticker.toUpperCase()}\`.\nPlease use \`/market info\` to get all stocks and crypto currencies.`, ephemeral: true });
    await interaction.deferReply();

    let userHasStock = false;
    let stockData;
    for (let i = 0; i < data.guildUser.stocks.length; i++) {
        if (data.guildUser.stocks[i].ticker === stock.ticker) {
            if (data.guildUser.stocks[i].quantity < amount) return await interaction.editReply({ content: `You only have ${data.guildUser.stocks[i].quantity}x of ${stock.fullName}.` });
            userHasStock = true;
            stockData = data.guildUser.stocks[i];
            break;
        }
    }

    if (!userHasStock) return await interaction.editReply({ content: `You don't own that stock or crypto.` });
    const price = Math.round(stock.price * amount);

    await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id, 'stocks.ticker': stock.ticker }, {
        $inc: {
            'stocks.$.quantity': -amount,
            'stocks.$.buyPrice': -parseInt(amount / stockData.quantity * stockData.buyPrice)
        }
    });

    await client.tools.addMoney(interaction.guildId, interaction.member.id, price)

    const embed = new MessageEmbed()
        .setTitle(`You sold ${amount}x ${stock.fullName}`)
        .setColor(client.config.embed.color)
        .setThumbnail(`https://cdn.coinzbot.xyz/ticker/${stock.ticker.toUpperCase()}.png`)
        .addFields(
            { name: 'Info', value: `:envelope: **Type:** ${stock.type}\n:tickets: **Ticker:** ${stock.ticker}\n:apple: **Full Name:** ${stock.fullName}`, inline: true },
            { name: 'Stats', value: `:moneybag: **Unit Price:** :coin: ${stock.price}\n:1234: **Amount:** ${amount}x\n:gem: **Sell Price:** :coin: ${price}`, inline: true }
        )
    await interaction.editReply({ embeds: [embed] });
}

module.exports.execute = async (client, interaction, data) => {
    if (interaction.options.getSubcommand() === "info") return await execInfo(client, interaction, data);
    if (interaction.options.getSubcommand() === "buy") return await execBuy(client, interaction, data);
    if (interaction.options.getSubcommand() === "sell") return await execSell(client, interaction, data);
    return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${data.cmd.help.name}\`.`, ephemeral: true });
}

module.exports.help = {
    name: "market",
    description: "Buy, sell or get info about a stock.",
    options: [
        {
            name: 'info',
            type: 'SUB_COMMAND',
            description: 'Get info about a stock.',
            options: [
                {
                    name: 'ticker',
                    type: 'STRING',
                    description: 'The ticker of the stock you want to get info about.',
                    required: false
                }
            ]
        },
        {
            name: 'buy',
            type: 'SUB_COMMAND',
            description: 'Buy a stock.',
            options: [
                {
                    name: 'ticker',
                    type: 'STRING',
                    description: 'The ticker of the stock/crypto you want to buy.',
                    required: true
                },
                {
                    name: 'amount',
                    type: 'INTEGER',
                    description: 'How much stocks/crypto you want to buy. Use 0 to buy fractional.',
                    required: false,
                    min_value: 0,
                    max_value: 5000
                },
                {
                    name: 'price',
                    type: 'INTEGER',
                    description: 'How much money wou want to buy stocks/crypto with.',
                    required: false,
                    min_value: 50,
                    max_value: 250000
                }
            ]
        },
        {
            name: 'sell',
            type: 'SUB_COMMAND',
            description: 'Sell a stock.',
            options: [
                {
                    name: 'ticker',
                    type: 'STRING',
                    description: 'The ticker of the stock you want to sell.',
                    required: true
                },
                {
                    name: 'amount',
                    type: 'NUMBER',
                    description: 'How much stocks/crypto you want to sell.',
                    required: true,
                    min_value: 0,
                    max_value: maxOwnedStock
                }
            ]
        }
    ],
    category: "stocks",
    extraFields: [],
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}