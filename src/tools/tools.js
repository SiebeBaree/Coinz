const guildUserSchema = require('../database/schemas/guildUsers');
const database = require('../database/mongoose');
const { MessageActionRow, MessageButton } = require('discord.js');

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

module.exports.setListButtons = (currentPage, maxPages, disableAll = false) => {
    var disablePrevious = false;
    var disableNext = false;

    if (currentPage <= 0) disablePrevious = true;
    if (currentPage + 1 >= maxPages) disableNext = true;
    if (disableAll) disablePrevious, disableNext = true;

    let row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("toFirstPage")
            .setStyle("PRIMARY")
            .setEmoji("⏮")
            .setDisabled(disablePrevious),
        new MessageButton()
            .setCustomId("toPreviousPage")
            .setStyle("PRIMARY")
            .setEmoji("⬅️")
            .setDisabled(disablePrevious),
        new MessageButton()
            .setCustomId("toNextPage")
            .setStyle("PRIMARY")
            .setEmoji("➡️")
            .setDisabled(disableNext),
        new MessageButton()
            .setCustomId("toLastPage")
            .setStyle("PRIMARY")
            .setEmoji("⏭")
            .setDisabled(disableNext)
    );
    return row;
};