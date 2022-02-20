const axios = require("axios").default;
const fs = require('fs');
require('dotenv').config();

// Because our Stocks API has a rate limit of 1000 requests per month we need to bundle the stocks per groups of 10.
// Every group only counts as 1 request. Thats 20 stocks updated every 75 minutes ~ 883 requests/month (+ 8 weekend days)
// Later for $10/month (15000 requests per month) we can upgrade the API to allow 60 stocks updated every 15 minutes ~ 13.248 requests/month (+ 8 weekend days)
const stocks = require('../data/market/stocks.json').stocks;

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
            const apiData = response.data;

            const markets = require('../data/market/markets.json');

            markets.marketStart = apiData.start;
            markets.marketClose = apiData.end;

            fs.writeFile(`${process.cwd()}/src/data/market/markets.json`, JSON.stringify(markets, null, 4), function writeJSON(err) {
                if (err) return console.log(err);
            });

            return apiData;
        } catch (e) {
            console.log(e);
        }
    }
    return null;
}

module.exports.marketIsOpen = async () => {
    const now = parseInt(Date.now() / 1000);
    const marketInfo = require('../data/market/markets.json');
    return (now >= marketInfo.marketStart && now <= marketInfo.marketClose ? true : false)
}