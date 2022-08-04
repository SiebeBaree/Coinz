const GuildModel = require("../models/Guild");
const ItemModel = require("../models/Item");
const StockModel = require("../models/Stock");
const MemberModel = require("../models/Member");
const CooldownModel = require("../models/Cooldown");
const CompanyModel = require("../models/Company");
const PremiumModel = require("../models/Premium");

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

const fetchPremium = async function (id) {
    let obj = await PremiumModel.findOne({ id: id });
    if (obj) {
        return obj;
    } else {
        return {
            id: id,
            maxServers: 0,
            servers: []
        };
    }
}

module.exports = {
    fetchGuild,
    fetchMember,
    fetchItem,
    fetchStock,
    fetchCooldown,
    fetchCompany,
    fetchPremium
};