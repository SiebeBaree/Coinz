const GuildModel = require("../models/Guild");
const ItemModel = require("../models/Item");
const StockModel = require("../models/Stock");
const MemberModel = require("../models/Member");
const CooldownModel = require("../models/Cooldown");
const CompanyModel = require("../models/Company");
const StatsModel = require("../models/Stats");
const GuildBanModel = require("../models/BannedGuild");
const UserBanModel = require("../models/BannedUser");

const fetchGuild = async function (guildId) {
    let obj = await GuildModel.findOne({ id: guildId });
    if (obj) {
        return obj;
    } else {
        obj = new GuildModel({ id: guildId });
        await obj.save().catch(err => bot.logger.error(err));
        return obj;
    }
}

const fetchMember = async function (userId) {
    let obj = await MemberModel.findOne({ id: userId });
    if (obj) {
        return obj;
    } else {
        obj = new MemberModel({ id: userId });
        await obj.save().catch(err => bot.logger.error(err));
        return obj;
    }
}

const fetchStock = async function (ticker) {
    return await StockModel.findOne({ ticker: ticker });
}

const fetchItem = async function (itemId) {
    return await ItemModel.findOne({ itemId: itemId });
}

const fetchCooldown = async function (userId, cmdName) {
    let obj = await CooldownModel.findOne({ id: userId, command: cmdName });
    if (obj) {
        return obj;
    } else {
        obj = new CooldownModel({ id: userId, command: cmdName });
        await obj.save().catch(err => bot.logger.error(err));
        return obj;
    }
}

const fetchCompany = async function (ownerId, name) {
    let obj = await CompanyModel.findOne({ id: ownerId });
    if (obj) {
        return obj;
    } else {
        obj = new CompanyModel({
            id: ownerId,
            name: (name === undefined || name === null) ? "An Unnamed Company" : name,
            balance: 0,
            taxRate: 10
        });
        await obj.save().catch(err => bot.logger.error(err));
        return obj;
    }
}

const fetchStats = async function (id) {
    let obj = await StatsModel.findOne({ id: id });
    if (obj) {
        return obj;
    } else {
        obj = new StatsModel({ id: id });
        await obj.save().catch(err => bot.logger.error(err));
        return obj;
    }
}

const fetchBan = async function (guildId, userId) {
    let guildObj = await GuildBanModel.findOne({ id: guildId });
    if (guildObj) {
        return {
            guild: {
                isBanned: true,
                reason: guildObj.reason || "No reason was given."
            }
        };
    }

    let userObj = await UserBanModel.findOne({ id: userId });
    if (userObj) {
        return {
            guild: { isBanned: false },
            user: {
                isBanned: true,
                reason: userObj.reason || "No reason was given."
            }
        };
    }

    return { guild: { isBanned: false }, user: { isBanned: false } };
}

module.exports = {
    fetchGuild,
    fetchMember,
    fetchItem,
    fetchStock,
    fetchCooldown,
    fetchCompany,
    fetchStats,
    fetchBan
};