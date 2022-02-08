const guildsSchema = require("./schemas/guilds")
const guildUsersSchema = require("./schemas/guildUsers")
const shopSchema = require("./schemas/shop")
const stocksSchema = require("./schemas/stocks")
const usersSchema = require("./schemas/users")
const cooldownsSchema = require("./schemas/cooldowns")

module.exports.fetchGuild = async function (guildId) {
    let guildObj = await guildsSchema.findOne({ guildId: guildId });
    if (guildObj) {
        return guildObj;
    } else {
        guildObj = new guildsSchema({ guildId: guildId })
        await guildObj.save().catch(err => console.log(err));
        return guildObj;
    }
}

module.exports.fetchGuildUser = async function (guildId, userId) {
    let userObj = await guildUsersSchema.findOne({ guildId: guildId, userId: userId });
    if (userObj) {
        return userObj;
    } else {
        userObj = new guildUsersSchema({ userId: userId, guildId: guildId })
        await userObj.save().catch(err => console.log(err));
        return userObj;
    }
}

module.exports.fetchUser = async function (userId) {
    let userObj = await usersSchema.findOne({ userId: userId });
    if (userObj) {
        return userObj;
    } else {
        userObj = new usersSchema({ userId: userId })
        await userObj.save().catch(err => console.log(err));
        return userObj;
    }
}

module.exports.fetchStock = async function (ticker) {
    return await stocksSchema.findOne({ ticker: ticker });
}

module.exports.fetchItem = async function (itemId) {
    return await shopSchema.findOne({ itemId: itemId });
}

module.exports.fetchCooldown = async function (guildId, userId, cmdName) {
    let cooldownObj = await cooldownsSchema.findOne({ guildId: guildId, userId: userId, command: cmdName });
    if (cooldownObj) {
        return cooldownObj;
    } else {
        cooldownObj = new cooldownsSchema({ guildId: guildId, userId: userId, command: cmdName })
        await cooldownObj.save().catch(err => console.log(err));
        return cooldownObj;
    }
}