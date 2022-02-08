const guildUserSchema = require('../database/schemas/guildUsers');
const database = require('../database/mongoose');

module.exports.addMoney = async (guildId, userId, amount) => {
    await guildUserSchema.updateOne({ guildId: guildId, userId: userId }, {
        $inc: {
            wallet: amount
        }
    });
}

module.exports.removeMoney = async (guildId, userId, amount) => {
    let guildUserData = await database.fetchGuildUser(guildId, userId);
    if (guildUserData.wallet - amount < 0) amount = guildUserData.wallet;

    await guildUserSchema.updateOne({ guildId: guildId, userId: userId }, {
        $inc: {
            wallet: -amount
        }
    });
}