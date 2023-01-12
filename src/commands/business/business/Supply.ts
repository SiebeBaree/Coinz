import { ChatInputCommandInteraction } from "discord.js";
import Bot from "../../../structs/Bot";
import Command from "../../../structs/Command";
import { IMember } from "../../../models/Member";
import { BusinessData } from "../../../utils/User";
import { Info } from "../../../interfaces/ICommand";
import Cooldown from "../../../utils/Cooldown";
import Helpers from "../../../utils/Helpers";
import Business from "../../../models/Business";

export default class extends Command {
    private readonly info: Info;

    constructor(bot: Bot, file: string, info: Info) {
        super(bot, file);
        this.info = info;
    }

    private readonly validItems = [
        "plastic",
        "cloth",
        "silicon",
        "soccer_ball",
        "shirt",
        "earbuds",
        "processor",
        "graphics_card",
        "desktop",
        "server",
    ];

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

        const option = interaction.options.getString("option", true);
        const itemId = interaction.options.getString("item-id", true);

        if (!this.validItems.includes(itemId)) {
            await interaction.reply({ content: "The item ID you have entered is invalid. Please try </factory list-products:1040552927288377345>.", ephemeral: true });
            return;
        }

        const item = this.client.items.getById(itemId) ?? this.client.items.getByName(itemId);
        if (!item) {
            await interaction.reply({ content: "That item doesn't exist.", ephemeral: true });
            return;
        }

        if (!item.buyPrice) {
            await interaction.reply({ content: "That item can't be bought.", ephemeral: true });
            return;
        }

        if (option === "steal") {
            if (data.business.balance < 500) {
                await interaction.reply({ content: "Your business needs a balance of at least :coin: 500 to steal supplies.", ephemeral: true });
                return;
            }

            if (member.passiveMode) {
                await interaction.reply({ content: "You can't steal supplies while in passive mode.", ephemeral: true });
                return;
            }

            await interaction.deferReply();
            const cooldown = await Cooldown.getRemainingCooldown(interaction.user.id, "business.supply.steal");
            if (cooldown > 0) {
                await interaction.reply({ content: `:x: You have to wait ${Helpers.msToTime(cooldown * 1000)} to steal supplies again.`, ephemeral: true });
                return;
            }
            await Cooldown.setCooldown(interaction.user.id, "business.supply.steal", 86400 * 2);

            if (Math.round(Math.random() * 100) < data.business.risk) {
                const amount = Helpers.getRandomNumber(item.buyPrice, item.buyPrice * 4);
                const newRisk = this.getNewRisk(data.business.risk, 3);

                await Business.updateOne(
                    { name: data.business.name },
                    { $inc: { balance: -amount } },
                    { $set: { risk: newRisk } },
                );

                await interaction.editReply({ content: `:x: You failed to steal supplies from your business and as a result lost :coin: ${amount} and the risk increased by 3%.` });
                return;
            }

            const amount = Helpers.getRandomNumber(1, 4);
            const increasedRisk = Helpers.getRandomNumber(6, 12);
            const newRisk = this.getNewRisk(data.business.risk, increasedRisk);

            const itemIndex = data.business.inventory.findIndex((i) => i.itemId === itemId);
            if (itemIndex === -1) {
                await Business.updateOne(
                    { name: data.business.name },
                    { $push: { inventory: { itemId, amount } } },
                    { $set: { risk: newRisk } },
                );
            } else {
                await Business.updateOne(
                    { name: data.business.name },
                    { $inc: { [`inventory.${itemIndex}.amount`]: amount } },
                    { $set: { risk: newRisk } },
                );
            }

            await interaction.editReply({ content: `:white_check_mark: You stole ${amount}x <:${item.itemId}:${item.emoteId}> **${item.name}** from another business and the risk increased by ${increasedRisk}%.` });
        } else {
            const amount = interaction.options.getInteger("amount") ?? 1;
            const price = item.buyPrice * amount;

            if (data.business.balance < price) {
                await interaction.reply({ content: `Your business doesn't have enough money to buy ${amount}x <:${item.itemId}:${item.emoteId}> **${item.name}**.`, ephemeral: true });
                return;
            }

            const decreasedRisk = Helpers.getRandomNumber(3, 8);
            const newRisk = this.getNewRisk(data.business.risk, -decreasedRisk);
            await interaction.deferReply();

            const itemIndex = data.business.inventory.findIndex((i) => i.itemId === itemId);
            if (itemIndex === -1) {
                await Business.updateOne(
                    { name: data.business.name },
                    {
                        $push: { inventory: { itemId, amount } },
                        $inc: { balance: -price },
                        $set: { risk: newRisk },
                    },
                );
            } else {
                await Business.updateOne(
                    { name: data.business.name },
                    {
                        $inc: { [`inventory.${itemIndex}.amount`]: amount, balance: -price },
                        $set: { risk: newRisk },
                    },
                );
            }

            await interaction.editReply({ content: `:white_check_mark: You bought ${amount}x <:${item.itemId}:${item.emoteId}> **${item.name}** for :coin: ${price} and the risk decreased by ${decreasedRisk}%.` });
        }
    }

    private getNewRisk(oldRisk: number, newRisk: number): number {
        return oldRisk + newRisk > 85 ? 85 : (oldRisk + newRisk < 5 ? 5 : oldRisk + newRisk);
    }
}