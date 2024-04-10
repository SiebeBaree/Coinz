import process from 'node:process';
import axios from 'axios';
import { schedule } from 'node-cron';
import botListings from '../data/bot-listings.json';
import investments from '../data/investments.json';
import ApiController from '../lib/bot-listings';
import crypto from '../lib/crypto';
import { getExpireTime, isMarketOpen } from '../lib/stocks';
import type { BotListing } from '../lib/types';
import BotStats from '../models/BotStats';
import Investment from '../models/Investment';

type InvestmentResponse = {
    ticker: string;
    name: string;
    price: string;
    changed: string;
    expires: Date;
};

// Run every 10 minutes from Monday to Friday
schedule(
    '*/10 * * * 1-5',
    async () => {
        if (!isMarketOpen()) return;

        const stockPromises: Promise<InvestmentResponse | null>[] = [];
        try {
            for (const stock of investments.stocks) {
                const stockPromise = axios
                    .get(`https://realstonks.p.rapidapi.com/${stock.ticker.toUpperCase()}`, {
                        headers: {
                            'X-RapidAPI-Key': process.env.STOCKS_API_KEY!,
                            'X-RapidAPI-Host': 'realstonks.p.rapidapi.com',
                        },
                    })
                    .then((response) => {
                        if (response.status !== 200) return null;

                        return {
                            ticker: stock.ticker,
                            name: stock.name,
                            price: response.data['price'].toString(),
                            changed: response.data['change_percentage'].toString(),
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
                        type: 'Stock',
                        fullName: data.name,
                        price: data.price,
                        changed: data.changed,
                        expires: data.expires,
                    });
                } else {
                    if (investment.fullName !== data.name) {
                        investment.fullName = data.name;
                    }

                    investment.price = data.price;
                    investment.changed = data.changed;
                    investment.expires = data.expires;
                }

                await investment.save();
            }
        } catch (error) {
            console.error(error);
        }
    },
    {
        scheduled: false,
        timezone: 'America/New_York',
    },
);

// Run every minute
schedule(
    '* * * * *',
    async () => {
        for (const investmentInfo of investments.crypto) {
            try {
                const response = await crypto.ticker24h({ market: `${investmentInfo.ticker.toUpperCase()}-EUR` });
                if (response.errorCode !== undefined) continue;

                const factor = Math.pow(10, 2);
                let changePercentage =
                    Math.round((((response.last - response.open) / response.open) * 100 + Number.EPSILON) * factor) /
                    factor;
                if (Number.isNaN(changePercentage)) changePercentage = 0;

                let investment = await Investment.findOne({ ticker: investmentInfo.ticker });
                if (investment === null) {
                    investment = new Investment({
                        ticker: investmentInfo.ticker.toUpperCase(),
                        type: 'Crypto',
                        fullName: investmentInfo.name,
                        price: response.last.toString(),
                        changed: changePercentage.toString(),
                        expires: new Date(Date.now() + 1000 * 60),
                    });
                } else {
                    if (investment.fullName !== investmentInfo.name) {
                        investment.fullName = investmentInfo.name;
                    }

                    investment.price = response.last.toString();
                    investment.changed = changePercentage.toString();
                    investment.expires = new Date(Date.now() + 1000 * 60);
                }

                await investment.save();
            } catch (error) {
                console.error(error);
            }
        }
    },
    {
        scheduled: false,
        timezone: 'America/New_York',
    },
);

// Run every 2 hours
schedule('0 */2 * * *', async () => {
    const stats = await BotStats.findOne({}, {}, { sort: { updatedAt: -1 } });
    if (stats === null) return;

    const sendApi = new ApiController(stats.guilds, stats.shards, stats.users);

    for (const botListing of botListings as unknown as BotListing[]) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        sendApi.sendApiCall(botListing).then((response) => {
            if (!response) console.log(`API call for ${botListing.name} failed`);
        });
    }
});
