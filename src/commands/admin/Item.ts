import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Database from "../../utils/Database";
import Member from "../../models/Member";

export default class extends Command implements ICommand {
    readonly info = {
        name: "item",
        description: "Add/Remove an item from a user",
        options: [
            {
                name: "option",
                description: "Add/Remove an item from a user",
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    {
                        name: "add",
                        value: "add",
                    },
                    {
                        name: "remove",
                        value: "remove",
                    },
                ],
            },
            {
                name: "user",
                description: "The user to add/remove an item of",
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: "item-id",
                description: "The id of the item to add/remove",
                type: ApplicationCommandOptionType.String,
                required: true,
                min_length: 1,
                max_length: 32,
            },
            {
                name: "amount",
                description: "The amount of the item",
                type: ApplicationCommandOptionType.Integer,
                required: false,
                min: -1,
            },
        ],
        category: "admin",
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.guildId !== this.client.config.adminServerId) return;

        const user = interaction.options.getUser("user", true);
        const itemId = interaction.options.getString("item-id", true).toLowerCase();
        const option = interaction.options.getString("option", true);
        let amount = interaction.options.getInteger("amount", false) ?? 1;

        await interaction.deferReply({ ephemeral: true });

        const item = this.client.items.getById(itemId) ?? this.client.items.getByName(itemId);
        if (!item) {
            await interaction.editReply("That item doesn't exist!");
            return;
        }

        const member = await Database.getMember(user.id, true);

        if (option === "add") {
            const invItem = this.client.items.getInventoryItem(item.itemId, member);

            if (amount === -1) {
                amount = 1;
            }

            if (invItem) {
                await Member.updateOne({ id: user.id, "inventory.itemId": item.itemId }, { $inc: { "inventory.$.amount": amount } });
            } else {
                await Member.updateOne({ id: user.id }, { $push: { inventory: { itemId: item.itemId, amount } } });
            }

            await interaction.editReply(`Added ${amount}x <:${item.itemId}:${item.emoteId}> **${item.name}** to ${user.tag}!`);
        } else if (option === "remove") {
            const invItem = this.client.items.getInventoryItem(item.itemId, member);

            if (!invItem) {
                await interaction.editReply("That user doesn't have that item!");
                return;
            }

            if (amount === -1) {
                amount = invItem.amount;
            }

            if (invItem.amount - amount <= 0) {
                await Member.updateOne({ id: user.id }, { $pull: { inventory: { itemId: item.itemId } } });
            } else {
                await Member.updateOne({ id: user.id, "inventory.itemId": item.itemId }, { $inc: { "inventory.$.amount": -amount } });
            }

            await interaction.editReply(`Removed ${amount}x <:${item.itemId}:${item.emoteId}> **${item.name}** from ${user.tag}!`);
        }
    }
}