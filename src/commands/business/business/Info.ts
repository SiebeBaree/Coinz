import { ActionRowBuilder, ChatInputCommandInteraction, ColorResolvable, ComponentType, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import Bot from "../../../structs/Bot";
import Command from "../../../structs/Command";
import { IMember } from "../../../models/Member";
import { BusinessData } from "../../../utils/User";
import { Info } from "../../../interfaces/ICommand";
import positions from "../../../assets/positions.json";
import Database from "../../../utils/Database";
import { IBusiness } from "../../../models/Business";

export default class extends Command {
    private readonly info: Info;

    constructor(bot: Bot, file: string, info: Info) {
        super(bot, file);
        this.info = info;
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember, data: BusinessData) {
        const name = interaction.options.getString("name");

        if (name) {
            const business = await Database.getBusiness(name);

            if (business.employees.length === 0) {
                await interaction.reply({
                    content: `No legal business with the name \`${name}\` exists.`,
                    ephemeral: true,
                });
                return;
            }

            data.business = business;
        } else if (!data.business) {
            await interaction.reply({
                content: "You don't own or are not working for a business.",
                ephemeral: true,
            });
            return;
        }

        let category = "overview";
        const message = await interaction.reply({ embeds: [this.getEmbed(data, category, name === null)], components: [this.getSelectMenu(category, false, name !== null)], fetchReply: true });
        const collector = message.createMessageComponentCollector({ max: 8, time: 90_000, componentType: ComponentType.StringSelect });

        collector.on("collect", async (i) => {
            category = i.values[0];
            await i.update({ embeds: [this.getEmbed(data, category, name === null)], components: [this.getSelectMenu(category, false, name !== null)] });
        });

        collector.on("end", async () => {
            await interaction.editReply({ components: [this.getSelectMenu(category, true, name !== null)] });
        });
    }

    private getEmbed(data: BusinessData, category: string, ownBusiness = false): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setFooter({ text: `${data.business?.name ?? "Business"} in Coinz`, iconURL: this.client.user?.avatarURL() ?? undefined });

        if (!data.business) {
            embed.setDescription("You don't own or are not working for a business.");
            return embed;
        }

        if (category === "inventory" && ownBusiness) {
            const items = [];
            let worth = 0;
            for (let i = 0; i < data.business.inventory.length; i++) {
                const invItem = data.business.inventory[i];
                const item = this.client.items.getById(invItem.itemId);
                if (!item || !item.sellPrice) continue;

                worth += item.sellPrice * invItem.amount;
                items.push(`**${invItem.amount}x** <:${invItem.itemId}:${item.emoteId}> ${item.name}`);
            }

            embed.setTitle(`Inventory of ${data.business.name}`);
            embed.setDescription(`:credit_card: **Bank Balance:** :coin: ${data.business.balance}\n:moneybag: **Total Inventory Worth:** :coin: ${worth}`);
            embed.addFields({ name: "Inventory", value: items.length > 0 ? items.join("\n") : "Your business has no inventory..." });
        } else if (category === "employees") {
            const employees = [];
            for (let i = 0; i < data.business.employees.length; i++) {
                const employee = data.business.employees[i];
                employees.push(`**${i + 1}.** <@${employee.userId}> (**${positions[employee.role as keyof typeof positions]}**) <@${employee.userId}> - ${employee.payout}%\n> **Money Collected:** :coin: ${employee.moneyEarned} - **Times Worked:** ${employee.timesWorked}`);
            }

            embed.setTitle(`Employees of ${data.business.name}`);
            embed.addFields({ name: "Employees", value: employees.length > 0 ? employees.join("\n\n") : "Your business has no employees..." });
        } else {
            let worth = 400 * data.business.factories.length;
            for (let i = 0; i < data.business.inventory.length; i++) {
                const invItem = data.business.inventory[i];
                const item = this.client.items.getById(invItem.itemId);

                if (!item || !item.sellPrice) continue;
                worth += item.sellPrice * invItem.amount;
            }

            const fields = [
                {
                    name: "Business Information",
                    value: `:sunglasses: **CEO:** <@${this.getCEO(data.business) ?? "No CEO Found..."}>\n:credit_card: **Bank Balance:** :coin: ${data.business.balance}\n:moneybag: **Worth:** :coin: ${worth}\n:factory: **Factories:** \`${data.business.factories.length}\``,
                    inline: false,
                },
            ];

            if (!ownBusiness) {
                fields.push({
                    name: "Your Status",
                    value: `**Position:** ${positions[data.employee.role as keyof typeof positions]}\n**Payout:** ${data.employee.payout}%\n**Money Collected:** :coin: ${data.employee.moneyEarned}\n**Times Worked:** ${data.employee.timesWorked}x`,
                    inline: false,
                });
            }

            embed.setTitle(`Overview of ${data.business.name}`);
            embed.addFields(fields);
        }

        return embed;
    }

    private getSelectMenu(label = "overview", disabled = false, disableInventory = false): ActionRowBuilder<StringSelectMenuBuilder> {
        const options = [
            { label: "📜 Overview", value: "overview", default: false },
            { label: "👥 Employees", value: "employees", default: false },
        ];

        if (!disableInventory) options.push({ label: "📦 Inventory", value: "inventory", default: false });
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === label) {
                options[i].default = true;
            }
        }

        return new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("business_info")
                    .setPlaceholder("No category selected.")
                    .setDisabled(disabled)
                    .addOptions(options),
            );
    }

    private getCEO(business: IBusiness) {
        return business.employees.find((e) => e.role === "ceo");
    }
}