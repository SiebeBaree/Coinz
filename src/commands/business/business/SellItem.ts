import { ChatInputCommandInteraction } from "discord.js";
import Bot from "../../../structs/Bot";
import Command from "../../../structs/Command";
import { IMember } from "../../../models/Member";
import { BusinessData } from "../../../utils/User";
import { Info } from "../../../interfaces/ICommand";
import Business from "../../../models/Business";

export default class extends Command {
    private readonly info: Info;

    constructor(bot: Bot, file: string, info: Info) {
        super(bot, file);
        this.info = info;
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember, data: BusinessData) {
        if (!data.business) {
            await interaction.reply({ content: `You don't own or work at a business. Create one using </${this.info.name} create:1048340073470513155>.`, ephemeral: true });
            return;
        }

        const allowedRoles = ["ceo", "executive", "manager"];
        if (!allowedRoles.includes(data.employee.role)) {
            await interaction.reply({ content: "You don't have permission to use this command. You need to be at least a manager or higher." });
            return;
        }

        const itemId = interaction.options.getString("item-id", true);
        const amount = interaction.options.getInteger("amount") ?? 1;

        const item = this.client.items.getById(itemId) ?? this.client.items.getByName(itemId);
        if (!item) {
            await interaction.reply({ content: "That item doesn't exist.", ephemeral: true });
            return;
        }

        if (!item.sellPrice) {
            await interaction.reply({ content: "That item can't be sold.", ephemeral: true });
            return;
        }

        const itemIndex = data.business.inventory.findIndex(i => i.itemId === item.itemId);
        if (itemIndex === -1) {
            await interaction.reply({ content: "You don't have that item in the inventory of your business.", ephemeral: true });
            return;
        }

        const invItem = data.business.inventory[itemIndex];
        if (invItem.amount < amount) {
            await interaction.reply({ content: "You don't have that many items in the inventory of your business.", ephemeral: true });
            return;
        }

        await interaction.deferReply();
        const price = item.sellPrice * amount;

        if (invItem.amount <= amount) {
            await Business.updateOne(
                { name: data.business.name },
                { $pull: { inventory: { itemId: item.itemId } } },
                { $inc: { balance: price } },
            );
        } else {
            await Business.updateOne(
                { name: data.business.name },
                { $inc: { [`inventory.${itemIndex}.amount`]: -amount, balance: price } },
            );
        }

        await interaction.editReply({ content: `You've sold ${amount}x <:${item.itemId}:${item.emoteId}> ${item.name} for :coin: ${price}.` });
    }
}