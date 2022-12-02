import GuildModel from "../models/Guild.js"
import ItemModel from "../models/Item.js"
import StockModel from "../models/Investment.js"
import MemberModel from "../models/Member.js"
import CooldownModel from "../models/Cooldown.js"
import BusinessModel from "../models/Business.js"
import StatsModel from "../models/Stats.js"
import PremiumModel from "../models/Premium.js"
import Log from "../models/Log.js"

export const fetchGuild = async function (guildId) {
    let obj = await GuildModel.findOne({ id: guildId });
    if (obj) {
        return obj;
    } else {
        obj = new GuildModel({ id: guildId });
        await obj.save().catch(err => bot.logger.error(err));
        return obj;
    }
}

export const fetchMember = async function (userId) {
    let obj = await MemberModel.findOne({ id: userId });
    if (obj) {
        return obj;
    } else {
        obj = new MemberModel({ id: userId });
        await obj.save().catch(err => bot.logger.error(err));
        return obj;
    }
}

export const fetchStock = async function (ticker) {
    return await StockModel.findOne({ ticker: ticker });
}

export const fetchItem = async function (itemId) {
    return await ItemModel.findOne({ itemId: itemId });
}

export const fetchCooldown = async function (userId, cmdName) {
    let obj = await CooldownModel.findOne({ id: userId, command: cmdName });
    if (obj) {
        return obj;
    } else {
        obj = new CooldownModel({ id: userId, command: cmdName });
        await obj.save().catch(err => bot.logger.error(err));
        return obj;
    }
}

export const fetchBusiness = async function (ownerId, name = "Unknown") {
    let obj = await BusinessModel.findOne({ ownerId: ownerId });
    if (obj) {
        return obj;
    } else {
        obj = new BusinessModel({
            ownerId: ownerId,
            name: name
        });
        await obj.save().catch(err => bot.logger.error(err));
        return obj;
    }
}

export const fetchStats = async function (id) {
    let obj = await StatsModel.findOne({ id: id });
    if (obj) {
        return obj;
    } else {
        obj = new StatsModel({ id: id });
        await obj.save().catch(err => bot.logger.error(err));
        return obj;
    }
}

export const fetchPremium = async function (id, createIfNotExists = true) {
    let obj = await PremiumModel.findOne({ id: id });
    if (obj) {
        return obj;
    } else {
        obj = new PremiumModel({ id: id });
        if (createIfNotExists) await obj.save().catch(err => bot.logger.error(err));
        return obj;
    }
}

export const createLog = async (message, type, userId = "", level = 'info') => {
    const obj = new Log({
        level: level,
        type: type,
        message: message,
        userId: userId
    });
    await obj.save().catch(err => bot.logger.error(err));
    return obj;
}

export default {
    fetchGuild,
    fetchMember,
    fetchItem,
    fetchStock,
    fetchCooldown,
    fetchBusiness,
    fetchStats,
    createLog
}