import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    type SelectMenuComponentOptionData,
} from 'discord.js';

export function getPageButtons(
    page: number,
    maxPage: number,
    disableButtons = false,
): ActionRowBuilder<ButtonBuilder>[] {
    const disableBackButton = page <= 0 || disableButtons;
    const disableNextButton = page >= maxPage - 1 || disableButtons;

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('page_ToFirstPage')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⏮')
            .setDisabled(disableBackButton),
        new ButtonBuilder()
            .setCustomId('page_ToPreviousPage')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('◀')
            .setDisabled(disableBackButton),
        new ButtonBuilder()
            .setCustomId('page_ToNextPage')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('▶')
            .setDisabled(disableNextButton),
        new ButtonBuilder()
            .setCustomId('page_ToLastPage')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⏭')
            .setDisabled(disableNextButton),
    );

    return [buttonRow];
}

export function calculatePageNumber(customId: string, page: number, maxPage: number): number {
    switch (customId) {
        case 'page_ToFirstPage':
            return 0;
        case 'page_ToPreviousPage':
            return Math.max(page - 1, 0);
        case 'page_ToNextPage':
            return Math.min(page + 1, maxPage - 1);
        case 'page_ToLastPage':
            return maxPage - 1;
        default:
            return page;
    }
}

export function getSelectMenu(
    options: SelectMenuComponentOptionData[],
    customId: string,
    selected: string,
    disabled = false,
): ActionRowBuilder<StringSelectMenuBuilder>[] {
    for (const option of options) {
        option.default = option.value === selected;
    }

    const selectMenuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder('Select an option')
            .setDisabled(disabled)
            .addOptions(options),
    );

    return [selectMenuRow];
}
