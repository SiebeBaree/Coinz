const { MessageEmbed } = require('discord.js');
const stocksSchema = require('../../database/schemas/stocks');
const guildUserSchema = require('../../database/schemas/guildUsers');
const moment = require("moment-timezone");

async function checkForNewPrice(client, stock) {
    if (stock.lastPriceCheck < parseInt(Date.now() / 1000) - 4500) {
        var now = moment().tz('America/New_York'); // set timezone to NY timezone to have same timezone as stocks

        // do not get stock API on weekends
        if (now.day() === 0 || now.day() === 6) return stock;

        // use the api to get new stocks
        const newPrices = await client.tools.getNewStockData(stock.ticker);
        if (newPrices === null) return stock;

        for (const stock in newPrices) {
            // update new stock price in db
            await stocksSchema.updateOne({ ticker: newPrices[stock].symbol }, {
                price: client.calc.roundNumber(newPrices[stock].close[newPrices[stock].close.length - 1]),
                previousClose: client.calc.roundNumber(newPrices[stock].previousClose),
                lastUpdated: newPrices[stock].timestamp[newPrices[stock].timestamp.length - 1],
                lastPriceCheck: parseInt(Date.now() / 1000)
            });
        }
        return await client.database.fetchStock(stock.ticker);
    }
    return stock;
}

async function getStocks() {
    let str = "";
    const stocks = await stocksSchema.find();
    for (const stock in stocks) str += `• **${stocks[stock].fullName}** (${stocks[stock].ticker})\n`;
    return str;
}

async function execInfo(client, interaction, data) {
    const ticker = interaction.options.getString('ticker');

    if (ticker == null) {
        await interaction.deferReply();
        let stocks = await getStocks();
        if (stocks == "") stocks = "No stocks were found. Please try again.";

        const embed = new MessageEmbed()
            .setAuthor({ name: `Stocks list` })
            .setColor(client.config.embed.color)
            .setDescription(`To view more info about a stock please use \`/market info <ticker>\`\n__Example:__ \`/market info AAPL\`\n\n${stocks}`)

        await interaction.editReply({ embeds: [embed] });
    } else {
        let stock = await client.database.fetchStock(ticker.toUpperCase());
        if (stock == null) return interaction.reply({ content: `Sorry we don't know any stock with ticker \`${ticker.toUpperCase()}\`.\nPlease use \`/market info\` to get all stocks.`, ephemeral: true });

        // defer reply to ensure api has enough time to get stocks
        await interaction.deferReply();

        // check for new price
        stock = await checkForNewPrice(client, stock);

        // calculate change compared to close stock yesterday
        let icon = ":chart_with_upwards_trend:"
        const changePercentage = client.calc.roundNumber(((stock.price - stock.previousClose) / stock.previousClose * 100), 2);
        if (changePercentage < 0) icon = ":chart_with_downwards_trend:";

        const embed = new MessageEmbed()
            .setAuthor({ name: `${stock.type}: ${stock.fullName}` })
            .setColor(client.config.embed.color)
            .setThumbnail(`attachment://${stock.ticker}.png`)
            .addFields(
                { name: `Info`, value: `:envelope: **Type:** ${stock.type}\n:tickets: **Ticker:** ${stock.ticker}\n:apple: **Full Name:** ${stock.fullName}\n:clock1: **Last Updated:** <t:${stock.lastUpdated}:R>`, inline: true },
                { name: `Stats`, value: `:moneybag: **Price:** :coin: ${stock.price}\n${icon} **Change:** ${changePercentage}%\n:radio_button: **Market:** ${client.tools.marketIsOpen() ? 'Open' : 'Closed'}`, inline: true },
            )
        await interaction.editReply({ embeds: [embed], files: [`src/data/stocks/${stock.ticker}.png`] });
    }
}

async function execBuy(client, interaction, data) {
    const ticker = interaction.options.getString('ticker');
    const amount = interaction.options.getInteger('amount') || 1;

    let stock = await client.database.fetchStock(ticker.toUpperCase());
    if (stock == null) return interaction.reply({ content: `Sorry we don't know any stock with ticker \`${ticker.toUpperCase()}\`.\nPlease use \`/market info\` to get all stocks.`, ephemeral: true });
    await interaction.deferReply();
    stock = await checkForNewPrice(client, stock);

    const totalPrice = Math.round(stock.price * amount);
    if (data.guildUser.wallet < totalPrice) {
        const embed = new MessageEmbed()
            .setTitle(`Not enough money`)
            .setColor("RED")
            .setDescription(`You do not have enough money in your wallet.`)
            .addFields(
                { name: 'Total Price', value: `:coin: ${totalPrice}`, inline: true },
                { name: 'Money In Wallet', value: `:coin: ${data.guildUser.wallet}`, inline: true },
                { name: 'Money Needed', value: `:coin: ${(totalPrice - data.guildUser.wallet) || 1}`, inline: true }
            )
        return interaction.editReply({ embeds: [embed] });
    }

    const stocksObj = {
        ticker: stock.ticker,
        type: stock.type,
        buyPrice: stock.price,
        datePurchased: parseInt(Date.now() / 1000),
        quantity: amount
    };

    await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
        $push: { stocksBought: stocksObj },
        $inc: { wallet: -totalPrice }
    });

    const embed = new MessageEmbed()
        .setAuthor({ name: `You just bought ${amount}x ${stock.fullName} stock` })
        .setColor(client.config.embed.color)
        .addFields(
            { name: 'Info', value: `:envelope: **Type:** ${stocksObj.type}\n:tickets: **Ticker:** ${stocksObj.ticker}\n:apple: **Full Name:** ${stock.fullName}\n:clock1: **Time Bought:** <t:${stocksObj.datePurchased}:f>`, inline: true },
            { name: 'Stats', value: `:moneybag: **Buy Price:** :coin: ${stock.price}\n:1234: **Amount:** ${stocksObj.quantity}x\n:gem: **Total Price:** :coin: ${totalPrice}`, inline: true }
        )
    await interaction.editReply({ embeds: [embed] });
}

async function execSell(client, interaction, data) {
    return interaction.reply({ content: "Feature not working yet" })
    // const ticker = interaction.options.getString('ticker');
    // const amount = interaction.options.getInteger('amount') || 1;

    // const embed = new MessageEmbed()
    //     .setAuthor({ name: `` })
    //     .setColor(client.config.embed.color)
    //     .addFields(
    //         { name: '', value: ``, inline: true },
    //         { name: '', value: ``, inline: true }
    //     )
    // await interaction.reply({ embeds: [embed] });
}

module.exports.execute = async (client, interaction, data) => {
    if (interaction.options.getSubcommand() === "info") return await execInfo(client, interaction, data);
    if (interaction.options.getSubcommand() === "buy") return await execBuy(client, interaction, data);
    if (interaction.options.getSubcommand() === "sell") return await execSell(client, interaction, data);
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
                    description: 'The ticker of the stock you want to buy.',
                    required: true
                },
                {
                    name: 'amount',
                    type: 'INTEGER',
                    description: 'How much stocks you want to buy. Default = 1',
                    required: false,
                    min_value: 1,
                    max_value: 1000
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
                    type: 'INTEGER',
                    description: 'How much stocks you want to sell. Default = 1',
                    required: false,
                    min_value: 1,
                    max_value: 1000
                }
            ]
        }
    ],
    usage: "<info | buy | sell> [ticker] [amount]",
    category: "stocks",
    extraFields: [],
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}