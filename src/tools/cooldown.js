const cooldownSchema = require('../database/schemas/cooldowns');


module.exports.isOnCooldown = async (client, userId, cmdName) => {
    let cooldownData = await client.database.fetchCooldown(userId, cmdName);
    if (cooldownData.expiresOn && (cooldownData.expiresOn > parseInt(Date.now() / 1000))) return true;
    else return false;
};

module.exports.removeCooldown = async (userId, cmdName) => {
    await cooldownSchema.deleteOne({ userId: userId, command: cmdName });
};

module.exports.setCooldown = async (userId, cmdName, cooldown = 3) => {
    await cooldownSchema.updateOne({ userId: userId, command: cmdName }, {
        expiresOn: parseInt(Date.now() / 1000) + cooldown
    });
};

module.exports.getCooldown = async (client, userId, cmdName) => {
    let cooldownData = await client.database.fetchCooldown(userId, cmdName);
    return cooldownData.expiresOn - parseInt(Date.now() / 1000);
};