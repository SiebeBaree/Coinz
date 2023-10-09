import { schedule } from "node-cron";
import { getExpireTime, isMarketOpen } from "../lib/stocks";
import investments from "../lib/data/investments.json";
import axios from "axios";
import Investment from "../models/Investment";
import crypto from "../lib/crypto";

type InvestmentResponse = {
    ticker: string;
    price: string;
    changed: string;
    expires: Date;
}

// Run every 10 minutes from Monday to Friday
schedule("*/10 * * * 1-5", async () => {
    if (!isMarketOpen()) return;

    const stockPromises: Promise<InvestmentResponse | null>[] = [];
    try {
        for (const stock of investments.stocks) {
            const stockPromise = axios.get(`https://realstonks.p.rapidapi.com/${stock.toUpperCase()}`, {
                headers: {
                    "X-RapidAPI-Key": process.env.STOCKS_API_KEY!,
                    "X-RapidAPI-Host": "realstonks.p.rapidapi.com",
                },
            })
                .then(response => {
                    if (response.status !== 200) return null;

                    return {
                        ticker: stock,
                        price: response.data["price"].toString(),
                        changed: response.data["change_percentage"].toString(),
                        expires: getExpireTime(),
                    } as InvestmentResponse;
                })
                .catch(() => null);

            stockPromises.push(stockPromise);
        }

        if (stockPromises.length === 0) return;
        const stockData = new Map<string, InvestmentResponse>();
        const responses = await Promise.all(stockPromises);

        for (const response of responses) {
            if (response === null) continue;
            stockData.set(response.ticker, response);
        }

        for (const [ticker, data] of stockData) {
            let investment = await Investment.findOne({ ticker });
            if (investment === null) {
                investment = new Investment({
                    ticker: ticker.toUpperCase(),
                    type: "Stock",
                    fullName: "Unconfigured",
                    price: data.price,
                    changed: data.changed,
                    expires: data.expires,
                });
            } else {
                investment.price = data.price;
                investment.changed = data.changed;
                investment.expires = data.expires;
            }

            await investment.save();
        }
    } catch (error) {
        console.error(error);
    }
}, {
    scheduled: true,
    timezone: "America/New_York",
});

// Run every minute
schedule("* * * * *", async () => {
    for (const ticker of investments.crypto) {
        try {
            const response = await crypto.ticker24h({ market: `${ticker.toUpperCase()}-EUR` });
            if (response.errorCode !== undefined) continue;

            const factor = Math.pow(10, 2);
            let changePercentage = Math.round((((response.last - response.open) / response.open * 100) + Number.EPSILON) * factor) / factor;
            if (isNaN(changePercentage)) changePercentage = 0;

            let investment = await Investment.findOne({ ticker });
            if (investment === null) {
                investment = new Investment({
                    ticker: ticker.toUpperCase(),
                    type: "Crypto",
                    fullName: "Unconfigured",
                    price: response.last.toString(),
                    changed: changePercentage.toString(),
                    expires: new Date(Date.now() + (1000 * 60)),
                });
            }

            investment.price = response.last.toString();
            investment.changed = changePercentage.toString();
            investment.expires = new Date(Date.now() + (1000 * 60));
        } catch (error) {
            console.error(error);
        }
    }
}, {
    scheduled: true,
    timezone: "America/New_York",
});