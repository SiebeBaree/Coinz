import { ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const pageButtons = (currentPage, maxPages, disableAll = false) => {
    let disablePrevious = false;
    let disableNext = false;

    if (currentPage <= 0) disablePrevious = true;
    if (currentPage + 1 >= maxPages) disableNext = true;

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("toFirstPage")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("⏮")
            .setDisabled(disablePrevious || disableAll),
        new ButtonBuilder()
            .setCustomId("toPreviousPage")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("⬅️")
            .setDisabled(disablePrevious || disableAll),
        new ButtonBuilder()
            .setCustomId("toNextPage")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("➡️")
            .setDisabled(disableNext || disableAll),
        new ButtonBuilder()
            .setCustomId("toLastPage")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("⏭")
            .setDisabled(disableNext || disableAll)
    );
    return row;
}

export const createSelectMenu = (options, customId, defaultLabel, disabled = false) => {
    for (let i = 0; i < options.length; i++) {
        if (options[i].value === defaultLabel) {
            options[i].default = true;
        }
    }

    const SelectMenu = new ActionRowBuilder()
        .addComponents(
            new SelectMenuBuilder()
                .setCustomId(customId)
                .setPlaceholder('The interaction has ended')
                .setDisabled(disabled)
                .addOptions(options),
        );

    return SelectMenu;
}

export const categoriesSelectMenu = (defaultLabel, disabled = false) => {
    let options = [
        { label: 'Tools', value: 'tools' },
        { label: 'Crops', value: 'crops' },
        { label: 'Rare Items', value: 'rare_items' },
        { label: 'Other', value: 'other' },
        { label: 'All Items', value: 'all' }
    ]

    return createSelectMenu(options, 'selectCategory', defaultLabel, disabled);
}

export const investingSelectMenu = (defaultLabel, disabled = false) => {
    let options = [
        { label: 'Stocks', value: 'Stock' },
        { label: 'Crypto', value: 'Crypto' }
    ]

    return createSelectMenu(options, 'selectInvestment', defaultLabel, disabled);
}

export const createMessageComponentCollector = (message, interaction, options = {}) => {
    const filter = (i) => i.user.id === interaction.member.id;
    return message.createMessageComponentCollector({ filter, ...options });
}

export default {
    pageButtons,
    createSelectMenu,
    categoriesSelectMenu,
    investingSelectMenu,
    createMessageComponentCollector
}