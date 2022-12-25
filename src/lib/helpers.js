export const randomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const commandPassed = (chance) => {
    return chance >= randomNumber(1, 100);
}

export const timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const msToTime = (ms) => {
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
}

export const roundNumber = (n, places = 2) => {
    const x = Math.pow(10, places);
    return Math.round(n * x) / x;
}

export const getRandomLoot = (lootTable, min, max = 0) => {
    const quantity = max === 0 || max <= min ? min : randomNumber(min, max);

    let loot = [];
    for (let i = 0; i < quantity; i++) loot.push(lootTable[randomNumber(0, lootTable.length - 1)]);
    return loot === [] ? [lootTable[0]] : loot;
}

export const extractNumber = (number) => {
    if (/^[0-9]+$/.test(number)) return parseInt(number);

    let multiplier = number.substr(-1).toLowerCase();
    if (multiplier == "k") {
        return parseInt(parseFloat(number) * 1000);
    } else if (multiplier == "m") {
        return parseInt(parseFloat(number) * 1000000);
    }
}

export const checkBet = (betStr, user, premiumStatus = false, minBet = 50, maxBet = -1) => {
    maxBet = maxBet === -1 ? (premiumStatus ? 10000 : 5000) : maxBet;

    let bet = 0;
    if (["all", "max"].includes(betStr.toLowerCase())) {
        if (user.wallet <= 0) return `You don't have any money in your wallet.`;
        bet = user.wallet > maxBet ? maxBet : user.wallet;
    } else {
        bet = extractNumber(betStr);
        if (bet === undefined || Number.isNaN(bet)) return "That's not a correct bet. Please use numbers or `1k` for example.";
        if (bet < minBet) return `The minimum bet is :coin: ${minBet}.`;
        if (bet > maxBet) return `You can only bet a maximum of :coin: ${maxBet}.`;
        if (bet > user.wallet) return `You don't have :coin: ${bet} in your wallet.`;
    }

    return bet;
}

export default {
    randomNumber,
    commandPassed,
    timeout,
    msToTime,
    roundNumber,
    getRandomLoot,
    extractNumber,
    checkBet
}