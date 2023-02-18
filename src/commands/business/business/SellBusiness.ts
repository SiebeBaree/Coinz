import { ChatInputCommandInteraction } from "discord.js";
import Bot from "../../../structs/Bot";
import Command from "../../../structs/Command";
import Member, { IMember } from "../../../models/Member";
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
        if (data.isOwner && data.business) {
            await interaction.deferReply({ ephemeral: true });
            let worth = data.business.factories.length * 400;
            for (const inventory of data.business.inventory) {
                const item = this.client.items.getById(inventory.itemId);
                if (!item || !item.sellPrice) continue;
                worth += item.sellPrice * inventory.amount;
            }

            for (const employee of data.business.employees) {
                await Member.updateOne(
                    { id: employee.userId, business: data.business.name },
                    { $set: { business: "" } },
                );
            }

            await Business.deleteOne({ ownerId: interaction.user.id });

            await interaction.editReply({ content: `You sold your business for :coin: ${worth}.` });
        } else {
            await interaction.reply({ content: "You need to own a business to use this command.", ephemeral: true });
            return;
        }
    }
}