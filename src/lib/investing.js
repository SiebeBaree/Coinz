import dotenv from "dotenv";
dotenv.config();

import axios from "axios"
import moment from "moment-timezone"
import Investment from "../models/Investment.js"
import investments from "../assets/investments.json" assert { type: "json" }
import { roundNumber } from "./helpers.js"

import bitvavoApi from "bitvavo"
const bitvavo = bitvavoApi().options({
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

export const calculateChange = (buyPrice, currentPrice) => {
    let changePercentage = roundNumber(((currentPrice - buyPrice) / buyPrice * 100), 2);
    if (isNaN(changePercentage)) changePercentage = 0;
    return { icon: changePercentage < 0 ? ":chart_with_downwards_trend:" : ":chart_with_upwards_trend:", changePercentage: changePercentage };
}

export const getStockData = async () => {
    let stocks = [[]];
    for (let i = 0; i < investments.stocks.length; i++) {
        let arrayPos = stocks.length - 1;

        if (stocks[arrayPos].length >= 10) {
            stocks.push([investments.stocks[i]]);
        } else {
            stocks[arrayPos].push(investments.stocks[i]);
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
        console.error(e);
        return null;
    }
}

export const isMarketOpen = () => {
    try {
        const now = moment.tz(Date.now(), timezone);
        const date = now.format(dateFormat);
        const openDateTime = moment.tz(`${date} ${investments.openingTime}`, dateTimeFormat, timezone);
        const closeDateTime = moment.tz(`${date} ${investments.closeTime}`, dateTimeFormat, timezone);

        if (now.isBetween(openDateTime, closeDateTime) && !investments.marketCloseDays.includes(parseInt(now.format("ddd")))) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
}

export const uploadStockData = async (data) => {
    for (const element in data) {
        let stockDocument = await Investment.findOne({ ticker: element });

        if (stockDocument) {
            await Investment.updateOne({ ticker: element }, {
                $set: {
                    price: data[element].close[data[element].close.length - 1],
                    previousClose: data[element].previousClose,
                    lastUpdated: data[element].timestamp[data[element].timestamp.length - 1]
                }
            });
        } else {
            stockDocument = new Investment({
                ticker: element,
                type: "Stock",
                fullName: "undefined",
                price: data[element].close[data[element].close.length - 1],
                previousClose: data[element].previousClose,
                lastUpdated: data[element].timestamp[data[element].timestamp.length - 1]
            });
            await stockDocument.save().catch(e => console.error(e));
        }
    }
}

export const getCryptoData = async () => {
    let data = {};

    for (let i = 0; i < investments.crypto.length; i++) {
        try {
            let response = await bitvavo.tickerPrice({ market: `${investments.crypto[i]}-EUR` });
            if (response.errorCode === undefined) {
                data[investments.crypto[i]] = { price: parseFloat(response.price) };
            }
        } catch (e) {
            console.error(e);
        }
    }

    return data;
}

export const uploadCryptoData = async (data) => {
    for (const element in data) {
        let stockDocument = await Investment.findOne({ ticker: `${element}` });

        try {
            let response24h = await bitvavo.ticker24h({ market: `${element}-EUR` });

            if (stockDocument) {
                await Investment.updateOne({ ticker: element, type: "Crypto" }, {
                    $set: {
                        price: data[element].price,
                        previousClose: response24h.open,
                        lastUpdated: parseInt(Date.now() / 1000)
                    }
                });
            } else {
                stockDocument = new Investment({
                    ticker: element,
                    type: "Crypto",
                    fullName: "undefined",
                    price: data[element].price,
                    previousClose: response24h.open,
                    lastUpdated: parseInt(Date.now() / 1000)
                });
                await stockDocument.save().catch(e => console.error(e));
            }
        } catch (e) {
            console.error(e);
        }
    }
}

export default {
    calculateChange,
    getStockData,
    isMarketOpen,
    uploadStockData,
    getCryptoData
}