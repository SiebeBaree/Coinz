// What is this file?
// Use this file to upload new items to your items collection

// How to use this file?
// 1. Create a file 'src/data/shop/items.json'
// 2. Copy the data from 'src/data/shop/template.json' and paste it in your file
// 3. Add as many elements in the array you want.
// EXTRA: elements with a empty string as itemId will be ignored

// How to run this file?
// npm run items

const items = require('../assets/items.json').items;
require('dotenv').config();
const mongoose = require('mongoose');
const itemsSchema = require('../models/Item');

// If you enable this, you will override all existing items in the database
const overrideItems = false;

async function createItem(item) {
    let itemObj = await itemsSchema.findOne({ itemId: item.itemId });
    if (itemObj) {
        if (!overrideItems) return true;
        await itemsSchema.deleteOne({ itemId: item.itemId });
    }

    itemObj = new itemsSchema(item);
    await itemObj.save().catch(err => console.log(err));
    return itemObj && overrideItems ? true : false;
}

(async () => {
    // Connect to the database
    try {
        await mongoose.connect(process.env.DATABASE_URI, {
            dbName: 'coinz_v2',
            keepAlive: true,
            keepAliveInitialDelay: 300000
        });
        console.log(`Connected to MongoDB.`);
    } catch (e) {
        console.log('Unable to connect to MongoDB Database.\nError: ' + err);
    }

    for (let i = 0; i < items.length; i++) {
        if (items[i].itemId !== "") {
            let output = await createItem(items[i]);

            if (output) {
                console.log(`Item ${items[i].itemId} already exists.`);
            } else {
                console.log(`Item ${items[i].itemId} was added to the database.`);
            }
        } else {
            console.log(`Item ${i} was empty...`);
        }
    }
})();