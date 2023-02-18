import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, ComponentType, EmbedBuilder } from "discord.js";
import Bot from "../../../structs/Bot";
import Command from "../../../structs/Command";
import { IMember } from "../../../models/Member";
import { Info } from "../../../interfaces/ICommand";
import { FactoryData } from ".";
import Business, { IBusiness, IFactory } from "../../../models/Business";
import Database from "../../../utils/Database";
import User from "../../../utils/User";

export default class extends Command {
    private readonly info: Info;
    private readonly destroyedDelay = 172_800;

    constructor(bot: Bot, file: string, info: Info) {
        super(bot, file);
        this.info = info;
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember, data: FactoryData) {
        if (!data.business) {
            await interaction.reply({ content: "You don't own or work at a business. Create one using </business create:1048340073470513155>.", ephemeral: true });
            return;
        }

        let finishedCommand = false;
        let business = data.business;
        const message = await interaction.reply({ embeds: [await this.getEmbed(business)], components: [this.getButtons(business, member)], fetchReply: true });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, max: 8, idle: 20_000, time: 90_000, componentType: ComponentType.Button });

        collector.on("collect", async (i) => {
            if (finishedCommand) return;
            if (i.customId.startsWith("factory_")) {
                // update business to counter abuse
                business = await Database.getBusiness(business.name);

                switch (i.customId) {
                    case "factory_collectProducts":
                        await this.pressCollectButton(business);
                        await interaction.followUp({ content: "Collected all products.", ephemeral: true });
                        break;
                    case "factory_buy":
                        if (await this.buyNewFactory(member, business)) {
                            await interaction.followUp({ content: "You successfully bought a new factory.", ephemeral: true });
                        }
                        break;
                    default:
                        return;
                }

                // get updated business to update embed
                business = await Database.getBusiness(business.name);
                await i.update({ embeds: [await this.getEmbed(business)], components: [this.getButtons(business, member, finishedCommand)] });
            }
        });

        collector.on("end", async () => {
            if (!finishedCommand) {
                finishedCommand = true;
                await interaction.editReply({ components: [this.getButtons(business, member, true)] });
            }
        });
    }

    private async getEmbed(business: IBusiness): Promise<EmbedBuilder> {
        const factoryLimit = this.getMaximumFactoryCount(business.employees);
        const now = Math.floor(Date.now() / 1000);

        const buyFactoryDescription = business.factories.length < factoryLimit ? `\n:moneybag: **You can buy a new factory for :coin: ${this.getFactoryPrice(business.factories.length)}.**` : "";

        const embed = new EmbedBuilder()
            .setTitle(`${business.name}'s Factory`)
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription(`:gear: **Use** </${this.info.name} set-production:1074380587508445277> **to start producing products.**\n:package: **You can clear destoryed products by collecting all products.**\n:wrench: **All collected products can be found in your business inventory** </business info:1048340073470513155>**.**${buyFactoryDescription}`);

        if (business.factories.length == 0) {
            embed.addFields({ name: "Buy a Factory", value: "Please press the button below to buy a factory.", inline: false });
            return embed;
        }

        for (let i = 0; i < business.factories.length; i++) {
            const factory = business.factories[i];
            let factoryHasChanged = false;
            let icon = ":black_large_square:";
            let factoryStatus = "Shutdown";

            if (factory.status !== "standby" && factory.status !== "destroyed") {
                if (factory.produceOn + this.destroyedDelay < now) {
                    factory.status = "destroyed";
                    factoryHasChanged = true;
                } else if (factory.produceOn < now && factory.status !== "ready") {
                    factory.status = "ready";
                    factoryHasChanged = true;
                }
            }

            if (factory.status === "producing") {
                const item = this.client.items.getById(factory.production);
                if (!item) continue;

                icon = ":gear:";
                factoryStatus = `<:${item.itemId}:${item.emoteId}> <t:${factory.produceOn}:R>`;
            } else if (factory.status === "destroyed") {
                icon = ":package:";
                factoryStatus = "Product is destroyed";
            } else if (factory.status === "ready") {
                const item = this.client.items.getById(factory.production);
                if (!item) continue;

                icon = `<:${item.itemId}:${item.emoteId}>`;
                factoryStatus = `<:${item.itemId}:${item.emoteId}> ready to collect`;
            }

            embed.addFields({ name: `Factory Level ${factory.level} (ID: ${factory.factoryId + 1})`, value: `${this.getVisualRow(icon)}\n${factoryStatus}`, inline: true });
            if (factoryHasChanged) {
                await Business.updateOne({ name: business.name, "factories.factoryId": factory.factoryId },
                    { $set: { "factories.$.status": factory.status } },
                );
            }
        }

        return embed;
    }

    private getButtons(business?: IBusiness, member?: IMember, disabled = false): ActionRowBuilder<ButtonBuilder> {
        const [collectStatus, buyFactoryStatus] = this.getButtonStatus(business, member);
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("factory_collectProducts")
                .setLabel("Collect Products")
                .setStyle(ButtonStyle.Success)
                .setDisabled(collectStatus || disabled),
            new ButtonBuilder()
                .setCustomId("factory_buy")
                .setLabel("Buy New Factory")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(buyFactoryStatus || disabled),
        );
    }

    private getButtonStatus(business?: IBusiness, member?: IMember): boolean[] {
        if (!business || !member) return [true, true];
        return [
            business?.factories.filter((factory) => factory.status === "ready" || factory.status === "destroyed").length === 0,
            business.factories.length >= this.getMaximumFactoryCount(business.employees) || member.wallet < this.getFactoryPrice(business.factories.length),
        ];
    }

    private getMaximumFactoryCount(employees: IBusiness["employees"]): number {
        return Math.min(employees.length * 2, 15);
    }

    private getFactoryPrice(factories: number): number {
        return factories * 3500 + 5000;
    }

    private getVisualRow(icon: string): string {
        return icon.repeat(6);
    }

    private async pressCollectButton(business: IBusiness): Promise<void> {
        const readyFactories = business.factories.filter((factory) => factory.status === "ready");
        const destoryedProducts = business.factories.filter((factory) => factory.status === "destroyed");
        const newLevels = readyFactories
            .filter(() => Math.random() < 0.03)
            .map((factory) => factory.factoryId);

        // reduce the harvested plots to an object with the crop as key and the amount as value
        const items = readyFactories.reduce((acc, cur) => {
            const crop = cur.production.trim().toLowerCase();
            acc[crop] = (acc[crop] || 0) + this.getQuantityOfItem(crop, cur.level + (newLevels.includes(cur.factoryId) ? 1 : 0));
            return acc;
        }, {} as { [key: string]: number });

        // add items to the inventory of the member
        for (const [itemId, amount] of Object.entries(items)) {
            const hasInInventory = business.inventory.find((item) => item.itemId === itemId);

            if (hasInInventory) {
                await Business.updateOne(
                    { name: business.name, "inventory.itemId": itemId },
                    { $inc: { "inventory.$.amount": amount } },
                );
            } else {
                await Business.updateOne(
                    { name: business.name },
                    { $push: { inventory: { itemId, amount } } },
                );
            }
        }

        // set the status of all harvested and rottenplots to "standby"
        for (const factory of readyFactories.concat(destoryedProducts)) {
            await Business.updateOne(
                { name: business.name, "factories.factoryId": factory.factoryId },
                {
                    $set: { "factories.$.status": "standby", "factories.$.production": "none" },
                    $inc: { "factories.$.level": newLevels.includes(factory.factoryId) ? 1 : 0 },
                },
            );
        }
    }

    private async buyNewFactory(member: IMember, business: IBusiness): Promise<boolean> {
        if (member.wallet < this.getFactoryPrice(business.factories.length)) return false;

        const factoryObj: IFactory = {
            factoryId: business.factories.length,
            level: 0,
            production: "none",
            status: "standby",
            produceOn: 0,
        };

        await Business.updateOne(
            { name: business.name },
            { $push: { factories: factoryObj } },
        );
        await User.removeMoney(member.id, this.getFactoryPrice(business.factories.length));

        return true;
    }

    private getQuantityOfItem(itemId: string, factoryLevel: number): number {
        const item = this.client.items.getById(itemId);
        if (!item) return 0;

        if (item.category === "factory") {
            const multiplier = Math.floor(item.multiplier || 1);
            const quantity = Math.floor(multiplier * (factoryLevel / 3));
            return Math.min(Math.max(quantity, 1), multiplier + 1);
        } else {
            return 0;
        }
    }
}