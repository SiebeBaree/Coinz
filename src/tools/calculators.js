module.exports.msToTime = duration => {
    let seconds = Math.floor((duration / 1000) % 60);
    let minutes = Math.floor((duration / (1000 * 60)) % 60);
    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    let days = Math.floor((duration / (1000 * 60 * 60 * 24)));

    let str = "";
    str += days > 0 ? days + "d " : "";
    str += hours > 0 ? hours + "h " : "";
    str += minutes > 0 ? minutes + "m " : "";
    str += seconds > 0 ? seconds + "s" : "";

    return str || "0s";
}

// Not 100% accurate but it doesn't need to be very accurate.
module.exports.roundNumber = (n, places = 2) => {
    let x = Math.pow(10, places);
    return Math.round(n * x) / x;
}

module.exports.getLevel = (experience) => {
    return parseInt(experience / 100);
}

module.exports.getNetWorth = async (client, userData) => {
    let returnData = {};

    returnData.netWorth = 0;

    // GET wallet
    returnData.netWorth += userData.wallet;

    // GET bank
    returnData.netWorth += userData.bank;

    // GET inventoryValue
    returnData.invValue = 0;
    returnData.items = 0;
    if (userData.inventory !== undefined) {
        for (let i = 0; i < userData.inventory.length; i++) {
            const item = await client.database.fetchItem(userData.inventory[i].itemId);
            returnData.invValue += parseInt(item.sellPrice * userData.inventory[i].quantity);
            returnData.items += userData.inventory[i].quantity;
        }
    }
    returnData.netWorth += returnData.invValue;

    // GET stockPortfolio
    returnData.portfolioValue = 0;
    returnData.stockItems = 0;
    returnData.initialValue = 0;
    if (userData.stocks !== undefined) {
        for (let i = 0; i < userData.stocks.length; i++) {
            const item = await client.database.fetchStock(userData.stocks[i].ticker);
            returnData.portfolioValue += parseInt(item.price * userData.stocks[i].quantity);
            returnData.stockItems += userData.stocks[i].quantity;
            returnData.initialValue += userData.stocks[i].buyPrice;
        }
    }
    returnData.netWorth += returnData.portfolioValue;

    return returnData;
}