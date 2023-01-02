import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    SelectMenuComponentOptionData,
} from "discord.js";

export default class Embed {
    static getPageButtons(page: number, maxPage: number, disableButtons = false): ActionRowBuilder<ButtonBuilder>[] {
        const disableBackButton = page <= 0 || disableButtons;
        const disableNextButton = page >= maxPage - 1 || disableButtons;

        const buttonRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("page_ToFirstPage")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("⏮")
                    .setDisabled(disableBackButton),
                new ButtonBuilder()
                    .setCustomId("page_ToPreviousPage")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("◀")
                    .setDisabled(disableBackButton),
                new ButtonBuilder()
                    .setCustomId("page_ToNextPage")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("▶")
                    .setDisabled(disableNextButton),
                new ButtonBuilder()
                    .setCustomId("page_ToLastPage")
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji("⏭")
                    .setDisabled(disableNextButton),
            );

        return [buttonRow];
    }

    static getSelectMenu(options: SelectMenuComponentOptionData[], customId: string, selected: string, disabled = false): ActionRowBuilder<StringSelectMenuBuilder>[] {
        for (let i = 0; i < options.length; i++) {
            options[i].default = options[i].value === selected;
        }

        const selectMenuRow = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(customId)
                    .setPlaceholder("Select an option")
                    .setDisabled(disabled)
                    .addOptions(options),
            );

        return [selectMenuRow];
    }
}