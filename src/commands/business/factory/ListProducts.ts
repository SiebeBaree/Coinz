import { ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from "discord.js";
import Bot from "../../../structs/Bot";
import Command from "../../../structs/Command";
import { Info } from "../../../interfaces/ICommand";
import { FactoryData } from ".";
import Helpers from "../../../utils/Helpers";

export default class extends Command {
    private readonly info: Info;
    private readonly description: string = "";
    private readonly embed: EmbedBuilder;

    constructor(bot: Bot, file: string, info: Info, data: FactoryData) {
        super(bot, file);
        this.info = info;

        let listStr = "";
        for (const item of data.items) {
            listStr += `<:${item.itemId}:${item.emoteId}> **${item.name}** (\`${item.itemId}\`) ― :coin: ${item.sellPrice}/item\n`;
            listStr += `> **Production:** ${item.quantity}x every ${Helpers.msToTime(Math.floor(item.produceTime * 1000))}\n`;
            if (item.requiredItems.length > 0) {
                listStr += `> **Requirements:** ${item.requiredItems.map(r => {
                    const requiredItem = this.client.items.getById(r.itemId);
                    if (!requiredItem) return;

                    return `**${r.amount}x** <:${r.itemId}:${requiredItem.emoteId}>`;
                }).join(", ")}\n`;
            }

            listStr += "\n";
        }

        this.description = listStr ?? "No Products Found";
        this.embed = new EmbedBuilder()
            .setTitle("Factory Products")
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setFooter({ text: `Use /${this.info.name} set-production <factory-id> <product> to produce an item.` })
            .setDescription(this.description);
    }

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply({ embeds: [this.embed] });
    }
}