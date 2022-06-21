const guildsSchema = require("./schemas/guilds");
const guildUsersSchema = require("./schemas/guildUsers");
const shopSchema = require("./schemas/items");
const stocksSchema = require("./schemas/stocks");
const usersSchema = require("./schemas/users");
const cooldownsSchema = require("./schemas/cooldowns");
const companiesSchema = require("./schemas/companies");

module.exports.fetchGuild = async function (guildId) {
    let guildObj = await guildsSchema.findOne({ guildId: guildId });
    if (guildObj) {
        return guildObj;
    } else {
        guildObj = new guildsSchema({ guildId: guildId });
        await guildObj.save().catch(err => console.log(err));
        return guildObj;
    }
}

module.exports.fetchGuildUser = async function (guildId, userId) {
    let userObj = await guildUsersSchema.findOne({ guildId: guildId, userId: userId });
    if (userObj) {
        return userObj;
    } else {
        userObj = new guildUsersSchema({ userId: userId, guildId: guildId });
        await userObj.save().catch(err => console.log(err));
        return userObj;
    }
}

module.exports.fetchUser = async function (userId) {
    let userObj = await usersSchema.findOne({ userId: userId });
    if (userObj) {
        return userObj;
    } else {
        userObj = new usersSchema({ userId: userId });
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
        cooldownObj = new cooldownsSchema({ guildId: guildId, userId: userId, command: cmdName });
        await cooldownObj.save().catch(err => console.log(err));
        return cooldownObj;
    }
}

module.exports.fetchCompany = async function (guildId, ownerId, name) {
    let obj = await companiesSchema.findOne({ guildId: guildId, ownerId: ownerId });
    if (obj) {
        return obj;
    } else {
        obj = new companiesSchema({
            guildId: guildId,
            ownerId: ownerId,
            name: (name === undefined || name === null) ? "An Unnamed Company" : name,
            balance: 0,
            taxRate: 10
        });
        await obj.save().catch(err => console.log(err));
        return obj;
    }
}