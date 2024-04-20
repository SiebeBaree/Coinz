import process from 'node:process';
import { connect } from 'mongoose';
import items from './data/items.json';
import type { Item } from './models/item';
import ItemModel from './models/item';
import logger from './utils/logger';

(async () => {
    try {
        await connect(process.env.DATABASE_URI!);
        logger.info('Connected to the database.');
    } catch (error) {
        logger.error(error);
        process.exit(1);
    }

    if (process.env.CLEAR_DATABASE === 'true') {
        logger.info('Clearing the database.');
        await ItemModel.deleteMany({});
    }

    for (const item of items as Item[]) {
        const itemExists = await ItemModel.exists({ itemId: item.itemId });
        if (itemExists) {
            if (process.env.UPDATE_EXISTING_ITEMS === 'true') {
                logger.info(`Updating item ${item.itemId} in the database.`);
                await ItemModel.updateOne({ itemId: item.itemId }, item);
            } else {
                logger.info(`Item ${item.itemId} already exists in the database.`);
            }
        } else {
            logger.info(`Creating item ${item.itemId} in the database.`);
            await ItemModel.create(item);
        }
    }

    process.exit();
})();
