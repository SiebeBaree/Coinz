import dotenv from "dotenv"
dotenv.config()

import { connect } from "mongoose"
import Item from "../models/Item.js"
import itemData from "../assets/items.json" assert { type: "json" }
import Logger from "../structures/Logger.js"

const logger = new Logger();
const { items } = itemData;
const OVERRIDE_ITEMS = false;

async function createItem(item) {
    let itemObj = await Item.findOne({ itemId: item.itemId });
    if (itemObj) {
        if (!OVERRIDE_ITEMS) return true;
        await Item.deleteOne({ itemId: item.itemId });
    }

    itemObj = new Item(item);
    await itemObj.save().catch(err => logger.error(err));
    return itemObj && OVERRIDE_ITEMS ? true : false;
}

(async () => {
    try {
        const DB_NAME = process.env.NODE_ENV === "production" ? "coinz" : "coinz_beta";
        connect(process.env.DATABASE_URI, {
            dbName: DB_NAME,
            useNewUrlParser: true,
            maxPoolSize: 100,
            minPoolSize: 5,
            family: 4,
            heartbeatFrequencyMS: 30000,
            keepAlive: true,
            keepAliveInitialDelay: 300000
        }).then(() => logger.ready('Connected to MongoDB'));
    } catch (e) {
        logger.error('Unable to connect to MongoDB Database.\nError: ' + err);
        process.exit(0);
    }

    for (let i = 0; i < items.length; i++) {
        if (items[i].itemId !== "") {
            let output = await createItem(items[i]);

            if (output && !OVERRIDE_ITEMS) {
                logger.log(`Item ${items[i].itemId} already exists.`);
            } else {
                logger.log(`Item ${items[i].itemId} was added to the database.`);
            }
        } else {
            logger.warn(`Item ${i} was empty...`);
        }
    }

    process.exit(0);
})()