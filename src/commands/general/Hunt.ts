import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import Helpers from "../../utils/Helpers";
import Cooldown from "../../utils/Cooldown";
import Item from "../../interfaces/Item";
import huntData from "../../assets/loot/hunt.json";
import ILoot, { IRange } from "../../interfaces/ILoot";
import User from "../../utils/User";
import Database from "../../utils/Database";

export default class extends Command implements ICommand {
    private readonly requiredItem: Item;

    readonly info = {
        name: "hunt",
        description: "Hunt for animals and get money selling their meat and skin.",
        options: [],
        category: "general",
        cooldown: 1200,
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
        const item = this.client.items.getById("hunting_rifle");

        if (item === null) {
            throw new Error("The item 'hunting_rifle' does not exist.");
        } else {
            this.requiredItem = item;
        }
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        if (!this.client.items.hasInInventory(this.requiredItem.itemId, member)) {
            await Cooldown.removeCooldown(interaction.user.id, this.info.name);
            await interaction.reply({ content: `You need a <:${this.requiredItem.itemId}:${this.requiredItem.emoteId}> **${this.requiredItem.name}** to use this command. Use \`/shop buy item-id:${this.requiredItem.itemId}\` to buy a **${this.requiredItem.name}**.`, ephemeral: true });
            return;
        }

        let finishedCommand = false;
        const preEmbed = new EmbedBuilder()
            .setAuthor({ name: `Hunt of ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription("You can choose where you want to hunt on animals. Be careful what you choose because it might cost you money!")
            .addFields(
                { name: "Public Hunting Area (EASY)", value: "A safe place to hunt for animals. You won't find any large animals here...", inline: false },
                { name: "The Forest (MEDIUM)", value: "You can find expensive animals here but it's very dangerous to walk in the forest. You might lose your gun or die!", inline: false },
                { name: "The Zoo (HARD)", value: "You can find the most exotic animals here but there is a big chance you will be fined for this illegal activity.", inline: false },
            );

        const message = await interaction.reply({ embeds: [preEmbed], components: [this.getRow()], fetchReply: true });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, max: 1, time: 30_000 });

        collector.on("collect", async (interactionCollector) => {
            if (finishedCommand) return;
            finishedCommand = true;

            if (Helpers.getRandomNumber(1, 100) <= 4) {
                await Cooldown.removeCooldown(interaction.user.id, this.info.name);
                await this.client.items.removeItem(this.requiredItem.itemId, member);
                await interactionCollector.update({ content: `Oh No! Your <:${this.requiredItem.itemId}:${this.requiredItem.emoteId}> **${this.requiredItem.name}** broke... You have to buy a new **${this.requiredItem.name}**. Use \`/shop buy item-id:${this.requiredItem.itemId}\` to buy a **${this.requiredItem.name}**.`, embeds: [], components: [] });
                return;
            }

            await interactionCollector.deferUpdate();
            const difficulty = interactionCollector.customId.split("_")[1] as keyof ILoot;
            const category = huntData[difficulty];

            if (Helpers.getRandomNumber(1, 100) <= category.fail.risk) {
                let fine = 0;

                if (category.fail.fine.max > 0) {
                    fine = Helpers.getRandomNumber(category.fail.fine.min, category.fail.fine.max);
                    await User.removeMoney(interaction.user.id, fine, true);
                }

                if (category.fail.looseRequiredItem) {
                    await this.client.items.removeItem(this.requiredItem.itemId, member);
                }

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Hunt of ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setColor(<ColorResolvable>this.client.config.embed.color)
                    .setDescription(category.fail.message.replace("%AMOUNT%", fine.toString()));
                await interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            const reward = this.getRandomLoot(category.success.loot, category.success.amount);

            const mappedLoot: { itemId: string, amount: number }[] = [];
            for (const itemId of reward) {
                const index = mappedLoot.findIndex(item => item.itemId === itemId);
                if (index === -1) {
                    mappedLoot.push({
                        itemId: itemId,
                        amount: 1,
                    });
                } else {
                    mappedLoot[index].amount++;
                }
            }

            const embed = new EmbedBuilder()
                .setAuthor({ name: `Hunt of ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                .setColor(<ColorResolvable>this.client.config.embed.color);

            let lootText = "";
            let totalPrice = 0;
            for (let i = 0; i < mappedLoot.length; i++) {
                const item = this.client.items.getById(mappedLoot[i].itemId);
                if (item === null || !item.sellPrice) continue;

                await this.client.items.addItem(item.itemId, member, mappedLoot[i].amount);
                lootText += `${mappedLoot[i].amount}x ${item.name} <:${item.itemId}:${item.emoteId}> ― :coin: ${Math.floor(item.sellPrice * mappedLoot[i].amount)}\n`;
                totalPrice += Math.floor(item.sellPrice * mappedLoot[i].amount);
            }

            await this.client.items.checkForDuplicates(await Database.getMember(interaction.user.id));

            if (lootText.length > 0 && totalPrice > 0) {
                await User.addExperience(interaction.user.id);
                embed.addFields({ name: "Animals Hunted", value: lootText, inline: false });
                embed.setDescription(">>> " + category.success.message.replace("%AMOUNT%", `${totalPrice}`));
            } else {
                embed.setDescription(">>> You didn't find any animals...");
            }

            await interaction.editReply({ embeds: [embed], components: [] });
        });

        collector.on("end", async () => {
            if (!finishedCommand) {
                finishedCommand = true;
                await interaction.editReply({ components: [this.getRow(true)] });
            }
        });
    }

    getRow(disabled = false) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("hunt_easy")
                .setLabel("Public Hunting Area")
                .setStyle(ButtonStyle.Success)
                .setDisabled(disabled),
            new ButtonBuilder()
                .setCustomId("hunt_medium")
                .setLabel("The Forest")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabled),
            new ButtonBuilder()
                .setCustomId("hunt_hard")
                .setLabel("The Zoo")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(disabled),
        );
        return row;
    }

    private getRandomLoot(lootTable: string[], range: IRange) {
        const quantity = range.max === 0 || range.max <= range.min ? range.min : Helpers.getRandomNumber(range.min, range.max);

        const loot = [];
        for (let i = 0; i < quantity; i++) loot.push(lootTable[Helpers.getRandomNumber(0, lootTable.length - 1)]);
        return loot.length === 0 ? [lootTable[0]] : loot;
    }
}