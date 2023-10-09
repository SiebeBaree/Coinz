import {
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    ColorResolvable,
    ComponentType,
    EmbedBuilder,
    User,
} from "discord.js";
import Bot from "../../domain/Bot";
import ICommand from "../../domain/ICommand";
import Command from "../../domain/Command";
import { IMember } from "../../models/Member";
import Database from "../../lib/Database";
import InventoryItem from "../../domain/IInventoryItem";
import Embed from "../../lib/Embed";

export default class extends Command implements ICommand {
    readonly info = {
        name: "inventory",
        description: "View your or someone else's inventory",
        options: [
            {
                name: "user",
                type: ApplicationCommandOptionType.User,
                description: "Get the inventory of another user.",
                required: false,
            },
        ],
        category: "general",
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const user = interaction.options.getUser("user") ?? interaction.user;
        const memberData = user.id === interaction.user.id ? member : await Database.getMember(user.id);

        if (memberData.inventory.length === 0) {
            await interaction.reply({
                content: `${user.id === interaction.user.id ? "You don't" : `${user.username} doesn't`} have any items in ${user.id === interaction.user.id ? "your" : "their"} inventory.`,
            });
            return;
        }

        const options = this.client.items.getCategories();
        const ItemsPerPage = 7;
        let defaultLabel = options[options.length - 1].value;
        let items = this.getItemsByCategory(memberData.inventory, defaultLabel);
        let page = 0;
        let maxPage = Math.ceil(items.length / ItemsPerPage);

        const message = await interaction.reply({
            embeds: [this.getEmbed(user, items, page, maxPage, ItemsPerPage)],
            components: [
                ...Embed.getPageButtons(page, maxPage),
                ...Embed.getSelectMenu(options, "inventory_selectCategory", defaultLabel),
            ],
        });

        const collector = message.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            max: 20,
            idle: 20_000,
            time: 90_000,
        });

        collector.on("collect", async (i) => {
            if (i.componentType === ComponentType.Button) {
                page = Embed.calculatePageNumber(i.customId, page, maxPage);
            } else if (i.componentType === ComponentType.StringSelect) {
                defaultLabel = i.values[0];
                items = this.getItemsByCategory(memberData.inventory, defaultLabel);
                page = 0;
                maxPage = Math.ceil(items.length / ItemsPerPage);
            }

            await i.update({
                embeds: [this.getEmbed(user, items, page, maxPage, ItemsPerPage)],
                components: [
                    ...Embed.getPageButtons(page, maxPage),
                    ...Embed.getSelectMenu(options, "inventory_selectCategory", defaultLabel),
                ],
            });
        });

        collector.on("end", async () => {
            await interaction.editReply({
                components: [
                    ...Embed.getPageButtons(page, maxPage),
                    ...Embed.getSelectMenu(options, "inventory_selectCategory", defaultLabel),
                ],
            });
        });
    }

    private getEmbed(user: User, items: InventoryItem[], page: number, maxPage: number, ItemsPerPage: number): EmbedBuilder {
        const itemsOnPage = items.slice(page * ItemsPerPage, (page + 1) * ItemsPerPage);
        const desc = itemsOnPage.map((invItem: InventoryItem) => {
            const item = this.client.items.getById(invItem.itemId);
            if (!item) return;
            return `<:${invItem.itemId}:${item.emoteId}> **${item.name}** ― ${invItem.amount}\n**ID:** \`${invItem.itemId}\``;
        }).join("\n\n");

        return new EmbedBuilder()
            .setAuthor({ name: `${user.username}'s inventory`, iconURL: user.displayAvatarURL() })
            .setDescription(itemsOnPage.length > 0 ? desc : "No items were found.")
            .setFooter({ text: `Use /shop info [item-id] to view more info about an item. ─ Page ${page + 1}/${maxPage}` })
            .setColor(<ColorResolvable>this.client.config.embed.color);
    }

    private getItemsByCategory(inventory: InventoryItem[], category: string) {
        if (category === "all") return inventory;
        return inventory.filter((item) => this.client.items.getById(item.itemId)?.category === category);
    }
}