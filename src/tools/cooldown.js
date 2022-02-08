const cooldownSchema = require('../database/schemas/cooldowns');


module.exports.isOnCooldown = async (client, guildId, userId, cmdName) => {
    let cooldownData = await client.database.fetchCooldown(guildId, userId, cmdName);
    if (cooldownData.expiresOn && (cooldownData.expiresOn > parseInt(Date.now() / 1000))) return true;
    else return false;
};

module.exports.removeCooldown = async (guildId, userId, cmdName) => {
    await cooldownSchema.remove({ guildId: guildId, userId: userId, command: cmdName });
};

module.exports.setCooldown = async (guildId, userId, cmdName, cooldown = 3) => {
    await cooldownSchema.updateOne({ guildId: guildId, userId: userId, command: cmdName }, {
        expiresOn: parseInt(Date.now() / 1000) + cooldown
    });
};

module.exports.getCooldown = async (client, guildId, userId, cmdName) => {
    let cooldownData = await client.database.fetchCooldown(guildId, userId, cmdName);
    return cooldownData.expiresOn - parseInt(Date.now() / 1000);
};