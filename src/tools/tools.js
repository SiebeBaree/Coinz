const guildUserSchema = require('../database/schemas/guildUsers');
const database = require('../database/mongoose');
const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');

module.exports.addMoney = async (guildId, userId, amount) => {
    await guildUserSchema.updateOne({ guildId: guildId, userId: userId }, {
        $inc: {
            wallet: amount
        }
    });
}

module.exports.removeMoney = async (guildId, userId, amount, goNegative = false) => {
    let guildUserData = await database.fetchGuildUser(guildId, userId);
    if (guildUserData.wallet - amount < 0 && !goNegative) amount = guildUserData.wallet;
    await this.addMoney(guildId, userId, -amount);
}

module.exports.setListButtons = (currentPage, maxPages, disableAll = false) => {
    var disablePrevious = false;
    var disableNext = false;

    if (currentPage <= 0) disablePrevious = true;
    if (currentPage + 1 >= maxPages) disableNext = true;

    let row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("toFirstPage")
            .setStyle("PRIMARY")
            .setEmoji("⏮")
            .setDisabled(disablePrevious || disableAll),
        new MessageButton()
            .setCustomId("toPreviousPage")
            .setStyle("PRIMARY")
            .setEmoji("⬅️")
            .setDisabled(disablePrevious || disableAll),
        new MessageButton()
            .setCustomId("toNextPage")
            .setStyle("PRIMARY")
            .setEmoji("➡️")
            .setDisabled(disableNext || disableAll),
        new MessageButton()
            .setCustomId("toLastPage")
            .setStyle("PRIMARY")
            .setEmoji("⏭")
            .setDisabled(disableNext || disableAll)
    );
    return row;
}

module.exports.createSelectMenu = (defaultLabel, disabled = false) => {
    let options = [
        { label: 'Tools', value: 'tools' },
        // { label: 'Pets', value: 'pets' },
        { label: 'Fish', value: 'fish' },
        { label: 'Animals', value: 'animals' },
        // { label: 'Miners', value: 'miners' },
        { label: 'Crops', value: 'crops' },
        // { label: 'Boosters', value: 'boosters' },
        { label: 'Rare Items', value: 'rare_items' },
        { label: 'Other', value: 'other' },
        { label: 'All Items', value: 'all' }
    ]

    for (let i = 0; i < options.length; i++) {
        if (options[i].value === defaultLabel) {
            options[i].default = true;
        }
    }

    const selectMenu = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('selectCategoryShop')
                .setPlaceholder('The interaction has ended')
                .setDisabled(disabled)
                .addOptions(options),
        );
    return selectMenu;
}

module.exports.userHasItem = async (inv, itemId) => {
    for (let i = 0; i < inv.length; i++) if (inv[i].itemId === itemId) return true;
    return false;
}

module.exports.giveItem = async (interaction, data, itemId, quantity) => {
    if (await this.userHasItem(data.guildUser.inventory, itemId)) {
        await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id, 'inventory.itemId': itemId }, {
            $inc: { 'inventory.$.quantity': quantity }
        });
    } else {
        const invObj = {
            itemId: itemId,
            quantity: quantity
        };

        await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
            $push: { inventory: invObj },
        });
    }
}

module.exports.takeItem = async (interaction, data, itemId, quantity) => {
    let item;
    for (let i = 0; i < data.guildUser.inventory.length; i++) if (data.guildUser.inventory[i].itemId === itemId) item = data.guildUser.inventory[i];
    if (item === undefined) return false;

    if (item.quantity - quantity > 0) {
        await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id, 'inventory.itemId': item.itemId }, {
            $inc: { 'inventory.$.quantity': -quantity }
        });
    } else {
        await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
            $pull: { 'inventory': { itemId: item.itemId } }
        });
    }
    return true;
}

module.exports.randomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.commandPassed = (chance) => {
    return chance >= this.randomNumber(1, 100);
}

module.exports.timeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
