const CooldownModel = require('../models/Cooldown');

const isOnCooldown = async (userId, cmdName) => {
    const cooldownData = await CooldownModel.findOne({ id: userId, command: cmdName });
    return !cooldownData ? false : cooldownData.expiresOn && (cooldownData.expiresOn > parseInt(Date.now() / 1000));
};

const removeCooldown = async (userId, cmdName) => {
    await CooldownModel.deleteOne({ id: userId, command: cmdName });
};

const setCooldown = async (userId, cmdName, cooldown = 0) => {
    if (cooldown === 0) cooldown = bot.config.defaultTimeout;

    await CooldownModel.findOneAndUpdate(
        { id: userId, command: cmdName },
        { $set: { expiresOn: parseInt(Date.now() / 1000) + cooldown } },
        { upsert: true }
    );
};

const getCooldown = async (userId, cmdName) => {
    const cooldownData = await CooldownModel.findOne({ id: userId, command: cmdName });
    return !cooldownData ? 0 : cooldownData.expiresOn - parseInt(Date.now() / 1000);
};

module.exports = {
    isOnCooldown,
    removeCooldown,
    setCooldown,
    getCooldown
}