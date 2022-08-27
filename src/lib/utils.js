const { ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { fetchMember } = require('./database');
const MemberModel = require('../models/Member');
const CompanyModel = require('../models/Company');
const CompanyPositions = require('../assets/companyPositions.json');
const CompanyProducts = require('../assets/companyProducts.json').products;

const addMoney = async (userId, amount) => {
    await MemberModel.updateOne({ id: userId }, { $inc: { wallet: amount } });
};

const takeMoney = async (userId, amount, goNegative = true) => {
    const UserData = await fetchMember(userId);
    if (UserData.wallet - amount < 0 && !goNegative) amount = UserData.wallet;
    await addMoney(userId, -amount);
};

const addItem = async (userId, itemId, quantity = 1, inventory = []) => {
    if (checkItem(inventory, itemId)) {
        await MemberModel.updateOne({ id: userId, 'inventory.itemId': itemId }, {
            $inc: { 'inventory.$.quantity': quantity }
        });
    } else {
        await MemberModel.updateOne({ id: userId }, {
            $push: {
                inventory:
                {
                    itemId: itemId,
                    quantity: quantity
                }
            },
        });
    }
};

const takeItem = async (userId, itemId, inventory, quantity = 1) => {
    const item = checkItem(inventory, itemId, true);
    if (!item) return false;

    if (item.quantity - quantity > 0) {
        await MemberModel.updateOne({ id: userId, 'inventory.itemId': item.itemId }, {
            $inc: { 'inventory.$.quantity': -quantity }
        });
    } else {
        await MemberModel.updateOne({ id: userId }, {
            $pull: { 'inventory': { itemId: item.itemId } }
        });
    }

    return true;
};

const checkItem = (inventory, itemId, new_ = false) => {
    for (let i = 0; i < inventory.length; i++) {
        if (inventory[i].itemId === itemId) {
            return new_ === true ? inventory[i] : true;
        }
    }

    return false;
};

const pageButtons = (currentPage, maxPages, disableAll = false) => {
    let disablePrevious = false;
    let disableNext = false;

    if (currentPage <= 0) disablePrevious = true;
    if (currentPage + 1 >= maxPages) disableNext = true;

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("toFirstPage")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("⏮")
            .setDisabled(disablePrevious || disableAll),
        new ButtonBuilder()
            .setCustomId("toPreviousPage")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("⬅️")
            .setDisabled(disablePrevious || disableAll),
        new ButtonBuilder()
            .setCustomId("toNextPage")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("➡️")
            .setDisabled(disableNext || disableAll),
        new ButtonBuilder()
            .setCustomId("toLastPage")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("⏭")
            .setDisabled(disableNext || disableAll)
    );
    return row;
};

const createSelectMenu = (options, customId, defaultLabel, disabled = false) => {
    for (let i = 0; i < options.length; i++) {
        if (options[i].value === defaultLabel) {
            options[i].default = true;
        }
    }

    const SelectMenu = new ActionRowBuilder()
        .addComponents(
            new SelectMenuBuilder()
                .setCustomId(customId)
                .setPlaceholder('The interaction has ended')
                .setDisabled(disabled)
                .addOptions(options),
        );

    return SelectMenu;
};

const categoriesSelectMenu = (defaultLabel, disabled = false) => {
    let options = [
        { label: 'Tools', value: 'tools' },
        { label: 'Crops', value: 'crops' },
        { label: 'Rare Items', value: 'rare_items' },
        { label: 'Other', value: 'other' },
        { label: 'All Items', value: 'all' }
    ]

    return createSelectMenu(options, 'selectCategory', defaultLabel, disabled);
};

const investingSelectMenu = (defaultLabel, disabled = false) => {
    let options = [
        { label: 'Stocks', value: 'Stock' },
        { label: 'Crypto', value: 'Crypto' }
    ]

    return createSelectMenu(options, 'selectInvestment', defaultLabel, disabled);
};

const randomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const commandPassed = (chance) => {
    return chance >= randomNumber(1, 100);
};

const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Utils for companies
const hasCompany = async (userId, data) => {
    data.isEmployee = false;
    data.employee = {
        userId: userId,
        role: "ceo",
        wage: CompanyPositions.ceo.defaultWage
    };

    if (data.user.job === "business") {
        data.company = await CompanyModel.findOne({ id: userId });
    } else if (data.user.job.startsWith("business-")) {
        const companyOwner = data.user.job.split("-")[1];
        data.company = await CompanyModel.findOne({ id: companyOwner });

        // double check if employee is part of the company
        for (let i = 0; i < data.company.employees.length; i++) {
            if (data.company.employees[i].userId === userId) {
                data.isEmployee = true;
                data.employee = data.company.employees[i];
                break;
            }
        }

        if (!data.isEmployee) data.company = null;
    }

    if (data.company === undefined || data.company === null) data.company = false;
    return data;
};

const getProduct = (productId) => {
    for (let i = 0; i < CompanyProducts.length; i++) {
        if (CompanyProducts[i].itemId === productId) return CompanyProducts[i];
    }
    return undefined;
};

const createMessageComponentCollector = (message, interaction, options = {}) => {
    const filter = (i) => i.user.id === interaction.member.id;
    return message.createMessageComponentCollector({ filter, ...options });
};

const msToTime = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor((ms / (1000 * 60 * 60 * 24)));

    let str = "";
    str += days > 0 ? days + "d " : "";
    str += hours > 0 ? hours + "h " : "";
    str += minutes > 0 ? minutes + "m " : "";
    str += seconds > 0 ? seconds + "s" : "";

    return str || "0s";
};

// Investing
const calculateChange = (buyPrice, currentPrice) => {
    let changePercentage = roundNumber(((currentPrice - buyPrice) / buyPrice * 100), 2);
    if (isNaN(changePercentage)) changePercentage = 0;
    return { icon: changePercentage < 0 ? ":chart_with_downwards_trend:" : ":chart_with_upwards_trend:", changePercentage: changePercentage };
};

const roundNumber = (n, places = 2) => {
    const x = Math.pow(10, places);
    return Math.round(n * x) / x;
};

const getRandomLoot = (lootTable, min, max = 0) => {
    const quantity = max === 0 || max <= min ? min : randomNumber(min, max);

    let loot = [];
    for (let i = 0; i < quantity; i++) loot.push(lootTable[randomNumber(0, lootTable.length - 1)]);
    return loot === [] ? [lootTable[0]] : loot;
};

const extractNumber = (number) => {
    if (/^[0-9]+$/.test(number)) return parseInt(number);

    multiplier = number.substr(-1).toLowerCase();
    if (multiplier == "k") {
        return parseInt(parseFloat(number) * 1000);
    } else if (multiplier == "m") {
        return parseInt(parseFloat(number) * 1000000);
    }
};

const checkBet = (betStr, user, minBet = 50, maxBet = 5000) => {
    let bet = 0;
    if (["all", "max"].includes(betStr.toLowerCase())) {
        if (user.wallet <= 0) return `You don't have any money in your wallet.`;
        bet = user.wallet > maxBet ? maxBet : data.user.wallet;
    } else {
        bet = extractNumber(betStr);
        if (bet < minBet) return `The minimum bet is :coin: ${minBet}.`;
        if (bet > maxBet) return `You can only bet a maximum of :coin: ${maxBet}.`;
        if (bet > user.wallet) return `You don't have :coin: ${bet} in your wallet.`;
    }

    return bet;
}

module.exports = {
    addMoney,
    takeMoney,
    addItem,
    takeItem,
    checkItem,
    pageButtons,
    createSelectMenu,
    categoriesSelectMenu,
    investingSelectMenu,
    randomNumber,
    commandPassed,
    timeout,
    hasCompany,
    getProduct,
    createMessageComponentCollector,
    msToTime,
    calculateChange,
    roundNumber,
    getRandomLoot,
    extractNumber,
    checkBet
};