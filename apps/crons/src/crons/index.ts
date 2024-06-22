import process from 'node:process';
import axios from 'axios';
import { schedule } from 'node-cron';
import investments from '../data/investments.json';
import crypto from '../lib/crypto';
import { calculatePercentageChange, getChunks, getExpireTime, isMarketOpen } from '../lib/stocks';
import Investment from '../models/Investment';

// Run every 10 minutes from Monday to Friday
schedule(
    '*/10 * * * 1-5',
    async () => {
        if (!isMarketOpen()) return;

        try {
            const chunks = getChunks(investments.stocks, 10);
            for (const chunk of chunks) {
                const tickers = chunk.map((stock) => stock.ticker.toUpperCase()).join(',');

                const response = await axios.get(
                    `https://yfapi.net/v8/finance/spark?interval=1h&range=1d&symbols=${tickers}`,
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-API-Key': process.env.STOCKS_API_KEY!,
                        },
                    },
                );

                if (response.status !== 200) continue;

                const stocks = Object.keys(response.data);
                for (const ticker of stocks) {
                    const stock = response.data[ticker];
                    const close = stock.close[stock.close.length - 1];
                    await Investment.updateOne(
                        { ticker: stock.symbol },
                        {
                            $set: {
                                price: close.toString(),
                                changed: calculatePercentageChange(close, stock.previousClose).toString(),
                                expires: getExpireTime(),
                            },
                        },
                    );
                }
            }
        } catch (error) {
            console.error(error);
        }
    },
    {
        scheduled: true,
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
        scheduled: true,
        timezone: 'America/New_York',
    },
);
