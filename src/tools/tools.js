const guildUserSchema = require('../database/schemas/guildUsers');
const database = require('../database/mongoose');
const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const axios = require("axios").default;
require('dotenv').config();
const fs = require('fs');

// Because our Stocks API has a rate limit of 1000 requests per month we need to bundle the stocks per groups of 10.
// Every group only counts as 1 request. Thats 20 stocks updated every 75 minutes ~ 883 requests/month (+ 8 weekend days)
// Later for $10/month (15000 requests per month) we can upgrade the API to allow 60 stocks updated every 15 minutes ~ 13.248 requests/month (+ 8 weekend days)
const stocks = require('../data/market/stocks.json').stocks;

module.exports.addMoney = async (guildId, userId, amount) => {
    await guildUserSchema.updateOne({ guildId: guildId, userId: userId }, {
        $inc: {
            wallet: amount
        }
    });
}

module.exports.removeMoney = async (guildId, userId, amount) => {
    let guildUserData = await database.fetchGuildUser(guildId, userId);
    if (guildUserData.wallet - amount < 0) amount = guildUserData.wallet;

    await guildUserSchema.updateOne({ guildId: guildId, userId: userId }, {
        $inc: {
            wallet: -amount
        }
    });
}

module.exports.setListButtons = (currentPage, maxPages, disableAll = false) => {
    var disablePrevious = false;
    var disableNext = false;

    if (currentPage <= 0) disablePrevious = true;
    if (currentPage + 1 >= maxPages) disableNext = true;
    if (disableAll) disablePrevious, disableNext = true;

    let row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("toFirstPage")
            .setStyle("PRIMARY")
            .setEmoji("⏮")
            .setDisabled(disablePrevious),
        new MessageButton()
            .setCustomId("toPreviousPage")
            .setStyle("PRIMARY")
            .setEmoji("⬅️")
            .setDisabled(disablePrevious),
        new MessageButton()
            .setCustomId("toNextPage")
            .setStyle("PRIMARY")
            .setEmoji("➡️")
            .setDisabled(disableNext),
        new MessageButton()
            .setCustomId("toLastPage")
            .setStyle("PRIMARY")
            .setEmoji("⏭")
            .setDisabled(disableNext)
    );
    return row;
}

module.exports.createSelectMenu = (defaultLabel, disabled = false) => {
    let options = [
        { label: 'Tools', value: 'tools' },
        { label: 'Pets', value: 'pets' },
        { label: 'Fish', value: 'fish' },
        { label: 'Miners', value: 'miners' },
        { label: 'Crops', value: 'crops' },
        { label: 'Boosters', value: 'boosters' },
        { label: 'Rare Items', value: 'rare_items' },
        { label: 'Other', value: 'other' },
        { label: 'All Items', value: 'all' }
    ]

    for (let i = 0; i < options.length; i++) {
        if (options[i].value === defaultLabel) {
            options[i].default = true;
        }
    }

    const selectMenu = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('selectCategoryShop')
                .setPlaceholder('The interaction has ended')
                .setDisabled(disabled)
                .addOptions(options),
        );
    return selectMenu;
}

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

module.exports.userHasItem = async (inv, itemId) => {
    for (let i = 0; i < inv.length; i++) if (inv[i].itemId === itemId) return true;
    return false;
}

module.exports.giveItem = async (interaction, data, itemId, quantity) => {
    if (await this.userHasItem(data.guildUser.inventory, itemId)) {
        await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id, 'inventory.itemId': itemId }, {
            $inc: { 'inventory.$.quantity': quantity }
        });
    } else {
        const invObj = {
            itemId: itemId,
            quantity: quantity
        };

        await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
            $push: { inventory: invObj },
        });
    }
}

module.exports.takeItem = async (interaction, data, itemId, quantity) => {
    let item;
    for (let i = 0; i < data.guildUser.inventory.length; i++) if (data.guildUser.inventory[i].itemId === itemId) item = data.guildUser.inventory[i];
    if (item === undefined) return false;

    if (item.quantity - quantity > 0) {
        await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id, 'inventory.itemId': item.itemId }, {
            $inc: { 'inventory.$.quantity': -quantity }
        });
    } else {
        await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
            $pull: { 'inventory': { itemId: item.itemId } }
        });
    }
    return true;
}

module.exports.randomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.commandPassed = (chance) => {
    return chance >= this.randomNumber(1, 100);
}