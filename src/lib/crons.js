import dotenv from "dotenv";
dotenv.config();

import { schedule } from "node-cron";
import { getStockData, getCryptoData, isMarketOpen, uploadCryptoData, uploadStockData } from "./investing.js"
import Cooldown from "../models/Cooldown.js"
import Premium from "../models/Premium.js"
import mongoose from "mongoose"
const { connect } = mongoose;

// Connecting to MongoDB Database
connect(process.env.DATABASE_URI, { dbName: process.env.NODE_ENV === "production" ? "coinz" : "coinz_beta" })
    .then(() => console.log('Connected crons to MongoDB'));

// Stock Cron
schedule("*/40 * * * 1-5", async () => {
    if (process.env.NODE_ENV === "production") {
        if (!isMarketOpen()) return;
        const data = await getStockData();
        if (data === null) return console.error("Stocks Cron went wrong... No data found.");
        await uploadStockData(data);
    }
}, {
    scheduled: true,
    timezone: "America/New_York"
});

// Crypto Cron
schedule("*/3 * * * *", async () => {
    if (process.env.NODE_ENV === "production") {
        const data = await getCryptoData();
        if (data === null) return console.error("Crypto Cron went wrong... No data found.");
        await uploadCryptoData(data);
    }
});

// Removed Expired Cooldowns Cron
schedule("*/30 * * * *", async function () {
    const deleted = await Cooldown.deleteMany({ expiresOn: { $lte: parseInt(Date.now() / 1000) } });
    console.log(`Removed ${deleted.deletedCount} expired cooldowns.`);
});

// Remove expired premium status from users and guilds
schedule("30 5 * * *", async function () {
    try {
        const now = Math.floor(Date.now() / 1000);
        await Premium.deleteMany({ premiumExpiresAt: { $lte: now } });
    } catch (e) {
        console.error(e);
    }
});
