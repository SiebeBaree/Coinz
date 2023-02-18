import { ChatInputCommandInteraction } from "discord.js";
import Bot from "../../../structs/Bot";
import Command from "../../../structs/Command";
import { IMember } from "../../../models/Member";
import { Info } from "../../../interfaces/ICommand";
import { FactoryData } from ".";
import Helpers from "../../../utils/Helpers";
import Business from "../../../models/Business";

export default class extends Command {
    private readonly info: Info;

    constructor(bot: Bot, file: string, info: Info) {
        super(bot, file);
        this.info = info;
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember, data: FactoryData) {
        if (!data.business) {
            await interaction.reply({ content: "You don't own or work at a business. Create one using </business create:1048340073470513155>.", ephemeral: true });
            return;
        }

        const allowedRoles = ["ceo", "executive", "manager"];
        if (!allowedRoles.includes(data.employee.role)) {
            await interaction.reply({ content: "You don't have permission to use this command. You need to be at least a manager or higher." });
            return;
        }

        const factoryIds = interaction.options.getString("factory-id", true);
        const productId = interaction.options.getString("product-id", true).toLowerCase();
        const force = interaction.options.getString("force") === "yes" ? true : false;

        const factories = Helpers.parseNumbers(factoryIds);
        if (factories.length === 0) {
            await interaction.reply({ content: "You didn't provide any valid factory IDs", ephemeral: true });
            return;
        }

        if (Math.min(...factories) <= 0) {
            await interaction.reply({ content: "Factory IDs must be greater than 0.", ephemeral: true });
            return;
        }

        if (Math.max(...factories) > data.business.factories.length) {
            await interaction.reply({ content: "You don't have that many factories.", ephemeral: true });
            return;
        }

        const product = data.items.find((item) => item.itemId === productId) ?? data.items.find((item) => item.name.toLowerCase() === productId);
        if (!product) {
            await interaction.reply({ content: `That's not a valid product to produce... Please use </${this.info.name} list-products:1074380587508445277> to get a list of all products.`, ephemeral: true });
            return;
        }

        if (!force) {
            const alreadyProducing = factories.filter((factoryId) =>
                data.business?.factories[factoryId - 1].status !== "standby"
                && data.business?.factories[factoryId - 1].status !== "destroyed");

            if (alreadyProducing.length > 0) {
                await interaction.reply({ content: `You are already producing something on factor${alreadyProducing.length > 1 ? "ies" : "y"} with ID ${alreadyProducing.join(", ")}.\nUse \`/${this.info.name} set-production factory-id: ${factoryIds} product-id: ${productId} force: yes\` to reset production.`, ephemeral: true });
                return;
            }
        }

        for (const itemId in Object.keys(product.requiredItems)) {
            const requiredItem = product.requiredItems[itemId];
            const item = data.business.inventory.find((invItem) => invItem.itemId === itemId);

            if (!item || requiredItem.amount > item.amount) {
                const shopItem = this.client.items.getById(itemId);
                await interaction.reply({ content: `You don't have ${shopItem ? `enough <:${shopItem.itemId}:${shopItem.emoteId}> **${shopItem.name}**` : "required items"} to produce <:${product.itemId}:${product.emoteId}> **${product.name}**.`, ephemeral: true });
                return;
            }
        }

        await interaction.reply({ content: `You are now producing <:${product.itemId}:${product.emoteId}> **${product.name}** on factor${factories.length > 1 ? "ies" : "y"} with ID ${factories.join(", ")}.`, ephemeral: true });

        // removing the required items from the business inventory
        for (const itemId in Object.keys(product.requiredItems)) {
            const requiredItem = product.requiredItems[itemId];
            const item = data.business.inventory.find((invItem) => invItem.itemId === itemId);
            if (!item) continue;

            if (item.amount <= requiredItem.amount) {
                await Business.updateOne(
                    { name: data.business.name },
                    { $pull: { inventory: { itemId: itemId } } },
                );
            } else {
                await Business.updateOne(
                    { name: data.business.name, "inventory.itemId": itemId },
                    { $inc: { "inventory.$.amount": -requiredItem.amount } },
                );
            }
        }

        // updating factory status
        for (let i = 0; i < factories.length; i++) {
            await Business.updateOne({ name: data.business.name, "factories.factoryId": factories[i] - 1 }, {
                $set: {
                    "factories.$.production": productId,
                    "factories.$.status": "producing",
                    "factories.$.produceOn": Math.floor(Date.now() / 1000) + product.produceTime,
                },
            });
        }
    }
}