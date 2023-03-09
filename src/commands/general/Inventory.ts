import { ApplicationCommandOptionType, ChatInputCommandInteraction, ColorResolvable, ComponentType, EmbedBuilder, User } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Member, { IMember } from "../../models/Member";
import Database from "../../utils/Database";
import InventoryItem from "../../interfaces/InventoryItem";
import Embed from "../../utils/Embed";
import Achievement from "../../utils/Achievement";

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

    private readonly achievement;

    constructor(bot: Bot, file: string) {
        super(bot, file);
        this.achievement = Achievement.getById("collection");
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const user = interaction.options.getUser("user", false) ?? interaction.user;
        const userData = user.id === interaction.user.id ? member : await Database.getMember(user.id);

        if (userData.inventory.length === 0) {
            await interaction.reply({ content: `${user.id === interaction.user.id ? "You don't" : `${user.tag} doesn't`} have anything in ${user.id === interaction.user.id ? "your" : "their"} inventory.`, ephemeral: true });
            return;
        }

        await interaction.deferReply();
        if (user.id === interaction.user.id && this.achievement) {
            const totalItems = member.inventory.reduce((acc, item) => acc + item.amount, 0);

            if (totalItems >= 1000 && !member.badges.includes(this.achievement.id)) {
                await interaction.followUp({ content: `:tada: You've unlocked the <:${this.achievement.id}:${this.achievement.emoji}> **${this.achievement.name}** achievement!` });
                await Member.updateOne({ id: member.id }, { $push: { badges: this.achievement.id } });
            }
        }

        let page = 0;
        const ItemsPerPage = 7;

        const options = this.client.items.getCategories();
        let defaultLabel = options[options.length - 1].value;
        let items = this.getItemsByCategory(userData.inventory, defaultLabel);
        let maxPage = Math.ceil(items.length / ItemsPerPage);

        const message = await interaction.editReply({
            embeds: [this.getEmbed(user, items, page, maxPage, ItemsPerPage)],
            components: [...Embed.getPageButtons(page, maxPage), ...Embed.getSelectMenu(options, "inventory_selectMenu", defaultLabel)],
        });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, max: 20, idle: 20_000, time: 90_000 });

        collector.on("collect", async (i) => {
            if (i.componentType === ComponentType.Button) {
                page = Embed.calculatePageNumber(i.customId, page, maxPage);
            } else if (i.componentType === ComponentType.StringSelect) {
                defaultLabel = i.values[0];
                page = 0;
                items = this.getItemsByCategory(userData.inventory, defaultLabel);
                maxPage = Math.ceil(items.length / ItemsPerPage);
            }

            await i.update({
                embeds: [this.getEmbed(user, items, page, maxPage, ItemsPerPage)],
                components: [...Embed.getPageButtons(page, maxPage), ...Embed.getSelectMenu(options, "inventory_selectMenu", defaultLabel)],
            });
        });

        collector.on("end", async () => {
            await interaction.editReply({ components: [...Embed.getPageButtons(page, maxPage, true), ...Embed.getSelectMenu(options, "inventory_selectMenu", defaultLabel, true)] });
        });
    }

    getEmbed(user: User, items: InventoryItem[], page: number, maxPage: number, ItemsPerPage: number): EmbedBuilder {
        const itemsOnPage = items.slice(page * ItemsPerPage, (page + 1) * ItemsPerPage);
        const desc = itemsOnPage.map((invItem) => {
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

    getItemsByCategory(inventory: InventoryItem[], category: string) {
        if (category === "all") return inventory;
        return inventory.filter((item) => this.client.items.getById(item.itemId)?.category === category);
    }
}