require("dotenv").config();
const axios = require("axios").default;
const moment = require("moment-timezone");
const StockModel = require("../models/Stock");

const market = require("../assets/stocks.json");
const crypto = require("../assets/crypto.json");

const bitvavo = require("bitvavo")().options({
    APIKEY: process.env.BITVAVO_API_KEY,
    APISECRET: process.env.BITVAVO_API_SECRET,
    ACCESSWINDOW: 10000,
    RESTURL: "https://api.bitvavo.com/v2",
    WSURL: "wss://ws.bitvavo.com/v2/",
    DEBUGGING: false
});

const timezone = "America/New_York";
const dateFormat = "DD/MM/YYYY";
const timeFormat = "HH:mm";
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const getStockData = async () => {
    let stocks = [[]];
    for (let i = 0; i < market.stocks.length; i++) {
        let arrayPos = stocks.length - 1;

        if (stocks[arrayPos].length >= 10) {
            stocks.push([market.stocks[i]]);
        } else {
            stocks[arrayPos].push(market.stocks[i]);
        }
    }

    try {
        let totalApiData = {};

        for (let i = 0; i < stocks.length; i++) {
            let options = {
                method: "GET",
                url: "https://stock-data-yahoo-finance-alternative.p.rapidapi.com/v8/finance/spark",
                params: { symbols: stocks[i].join(","), range: "1d", interval: "15m" },
                headers: {
                    "x-rapidapi-host": "stock-data-yahoo-finance-alternative.p.rapidapi.com",
                    "x-rapidapi-key": process.env.STOCK_API_KEY
                }
            };

            const response = await axios.request(options);
            totalApiData = {
                ...totalApiData,
                ...response.data
            };
        }

        return totalApiData;
    } catch (e) {
        bot.logger.error(e);
        return null;
    }
}

const isMarketOpen = () => {
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

const uploadStockData = async (data) => {
    for (const element in data) {
        let stockDocument = await StockModel.findOne({ ticker: element });

        if (stockDocument) {
            await StockModel.updateOne({ ticker: element }, {
                $set: {
                    price: data[element].close[data[element].close.length - 1],
                    previousClose: data[element].previousClose,
                    lastUpdated: data[element].timestamp[data[element].timestamp.length - 1]
                }
            });
        } else {
            stockDocument = new StockModel({
                ticker: element,
                type: "Stock",
                fullName: "undefined",
                price: data[element].close[data[element].close.length - 1],
                previousClose: data[element].previousClose,
                lastUpdated: data[element].timestamp[data[element].timestamp.length - 1]
            });
            await stockDocument.save().catch(e => bot.logger.error(e));
        }
    }
}

const getCryptoData = async () => {
    let cryptoData = {};

    for (let i = 0; i < crypto.crypto.length; i++) {
        try {
            let response = await bitvavo.tickerPrice({ market: `${crypto.crypto[i]}-EUR` });
            if (response.errorCode === undefined) {
                cryptoData[crypto.crypto[i]] = {
                    price: parseFloat(response.price)
                };
            }
        } catch (e) {
            bot.logger.error(e);
        }
    }

    return cryptoData;
}

const uploadCryptoData = async (data) => {
    for (const element in data) {
        let stockDocument = await StockModel.findOne({ ticker: `${element}` });

        try {
            let response24h = await bitvavo.ticker24h({ market: `${element}-EUR` });

            if (stockDocument) {
                await StockModel.updateOne({ ticker: element, type: "Crypto" }, {
                    $set: {
                        price: data[element].price,
                        previousClose: response24h.open,
                        lastUpdated: parseInt(Date.now() / 1000)
                    }
                });
            } else {
                stockDocument = new StockModel({
                    ticker: element,
                    type: "Crypto",
                    fullName: "undefined",
                    price: data[element].price,
                    previousClose: response24h.open,
                    lastUpdated: parseInt(Date.now() / 1000)
                });
                await stockDocument.save().catch(e => bot.logger.error(e));
            }
        } catch (e) {
            bot.logger.error(e);
        }
    }
}

module.exports = {
    getStockData,
    isMarketOpen,
    uploadStockData,
    getCryptoData,
    uploadCryptoData
};