const guildUserSchema = require('../database/schemas/guildUsers');
const database = require('../database/mongoose');
const { MessageActionRow, MessageButton } = require('discord.js');
const axios = require("axios").default;
require('dotenv').config();

// Because our Stocks API has a rate limit of 1000 requests per month we need to bundle the stocks per groups of 10.
// Every group only counts as 1 request. Thats 20 stocks updated every 1.5 hours.
// Later for $10/month (15000 requests per month) we can upgrade the API to allow 50 stocks updated every 15 minutes
const stocks = [
    ['AAPL', 'MSFT', 'AMZN', 'GOOG', 'TSLA', 'NVDA', 'FB', 'PFE', 'DIS', 'KO'],
    ['ADBE', 'INTC', 'MCD', 'NKE', 'DHR', 'NFLX', 'BA', 'BLK', 'GM', 'FDX']
];

module.exports.addMoney = async (guildId, userId, amount) => {
    await guildUserSchema.updateOne({ guildId: guildId, userId: userId }, {
        $inc: {
            wallet: amount
        }
    });
}

module.exports.removeMoney = async (guildId, userId, amount) => {
    let guildUserData = await database.fetchGuildUser(guildId, userId);
    if (guildUserData.wallet - amount < 0) amount = guildUserData.wallet;

    await guildUserSchema.updateOne({ guildId: guildId, userId: userId }, {
        $inc: {
            wallet: -amount
        }
    });
}

module.exports.setListButtons = (currentPage, maxPages, disableAll = false) => {
    var disablePrevious = false;
    var disableNext = false;

    if (currentPage <= 0) disablePrevious = true;
    if (currentPage + 1 >= maxPages) disableNext = true;
    if (disableAll) disablePrevious, disableNext = true;

    let row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("toFirstPage")
            .setStyle("PRIMARY")
            .setEmoji("⏮")
            .setDisabled(disablePrevious),
        new MessageButton()
            .setCustomId("toPreviousPage")
            .setStyle("PRIMARY")
            .setEmoji("⬅️")
            .setDisabled(disablePrevious),
        new MessageButton()
            .setCustomId("toNextPage")
            .setStyle("PRIMARY")
            .setEmoji("➡️")
            .setDisabled(disableNext),
        new MessageButton()
            .setCustomId("toLastPage")
            .setStyle("PRIMARY")
            .setEmoji("⏭")
            .setDisabled(disableNext)
    );
    return row;
};

module.exports.getNewStockData = async (ticker) => {
    let symbols = "";
    for (const stockList in stocks) {
        if (stocks[stockList].includes(ticker)) {
            symbols = stocks[stockList].join(',');
            break;
        }
    }

    if (symbols !== "") {
        let options = {
            method: 'GET',
            url: 'https://stock-data-yahoo-finance-alternative.p.rapidapi.com/v8/finance/spark',
            params: { symbols: symbols, range: '1d', interval: '15m' },
            headers: {
                'x-rapidapi-host': 'stock-data-yahoo-finance-alternative.p.rapidapi.com',
                'x-rapidapi-key': `${process.env.STOCK_API_KEY}`
            }
        };

        try {
            const response = await axios.request(options);
            return response.data;
        } catch (e) {
            console.log(e);
        }
    }
    return null;
}