import { ChatInputCommandInteraction, ApplicationCommandOptionType, EmbedBuilder, ColorResolvable, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Member, { IMember } from "../../models/Member";
import Item from "../../interfaces/Item";
import Cooldown from "../../utils/Cooldown";
import Helpers from "../../utils/Helpers";
import { IRange } from "../../interfaces/ILoot";
import fishData from "../../assets/loot/fish.json";
import Database from "../../utils/Database";
import User from "../../utils/User";
import Achievement from "../../utils/Achievement";

export default class extends Command implements ICommand {
    private readonly requiredItems: Item[] = [];

    readonly info = {
        name: "fish",
        description: "Try and catch some fish that you can sell for money.",
        options: [
            {
                name: "rod",
                description: "The fishing rod you want to use.",
                type: ApplicationCommandOptionType.String,
                required: false,
                choices: [
                    {
                        name: "Fishing Rod",
                        value: "fishing_rod",
                        focused: true,
                    },
                    {
                        name: "Premium Fishing Rod",
                        value: "premium_fishing_rod",
                    },
                ],
            },
        ],
        category: "general",
        cooldown: 1200,
    };

    private readonly achievement;

    constructor(bot: Bot, file: string) {
        super(bot, file);

        this.achievement = Achievement.getById("touch_grass");
        for (const itemId of ["fishing_rod", "premium_fishing_rod"]) {
            const item = this.client.items.getById(itemId);

            if (item === null) {
                throw new Error("The item 'hunting_rifle' does not exist.");
            } else {
                this.requiredItems.push(item);
            }
        }
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const rod = interaction.options.getString("rod")?.toLowerCase() ?? "fishing_rod";

        let requiredItem: Item | undefined;
        for (const item of this.requiredItems) {
            if (item.itemId === rod) {
                requiredItem = item;
            }
        }

        if (requiredItem === undefined) {
            await Cooldown.removeCooldown(interaction.user.id, this.info.name);
            await interaction.reply({ content: "The fishing rod you specified does not exist.", ephemeral: true });
            return;
        }

        if (!this.client.items.hasInInventory(requiredItem.itemId, member)) {
            await Cooldown.removeCooldown(interaction.user.id, this.info.name);
            await interaction.reply({ content: `You need a <:${requiredItem.itemId}:${requiredItem.emoteId}> **${requiredItem.name}** to use this command. Use \`/shop buy item-id:${requiredItem.itemId}\` to buy a **${requiredItem.name}**.`, ephemeral: true });
            return;
        }

        if (Helpers.getRandomNumber(1, 100) <= 6) {
            await Cooldown.removeCooldown(interaction.user.id, this.info.name);
            await this.client.items.removeItem(requiredItem.itemId, member);
            await interaction.reply({ content: `Oh No! Your <:${requiredItem.itemId}:${requiredItem.emoteId}> **${requiredItem.name}** broke... You have to buy a new **${requiredItem.name}**. Use \`/shop buy item-id:${requiredItem.itemId}\` to buy a **${requiredItem.name}**.`, embeds: [], components: [] });
            return;
        }

        let status = "too soon";
        let finishedCommand = false;

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Fishing with ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription("Press the button below to reel in your fish. **ONLY PRESS THE BUTTON WHEN THE BUTTON IS GREEN**");

        const message = await interaction.reply({ embeds: [embed], components: [this.getRow(status)], fetchReply: true });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, time: 30_000 });

        collector.on("collect", async (interactionCollector) => {
            if (finishedCommand) return;
            finishedCommand = true;
            await interactionCollector.deferUpdate();

            if (requiredItem === undefined) return;
            if (interactionCollector.customId === "fish_end") {
                if (status === "too soon") {
                    embed.setColor(Colors.Red);
                    embed.setDescription("You were too soon to catch some fish. Don't press the button until it's green!");
                } else if (status === "ready") {
                    let reward: string[] = [];
                    let sellItems = false;
                    let msg = fishData.easy.success.message;

                    switch (requiredItem.itemId) {
                        case "fishing_rod":
                            reward = this.getRandomLoot(fishData.easy.success.loot, fishData.easy.success.amount);
                            sellItems = fishData.easy.success.sellItems;
                            break;
                        case "premium_fishing_rod":
                            reward = this.getRandomLoot(fishData.hard.success.loot, fishData.hard.success.amount);
                            sellItems = fishData.hard.success.sellItems;
                            msg = fishData.hard.success.message;
                            break;
                    }

                    if (reward.length === 0) {
                        embed.setColor(Colors.Red);
                        embed.setDescription("You caught nothing. Try again later.");
                        await interaction.editReply({ embeds: [embed], components: [this.getRow(status, true)] });
                        return;
                    }

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

                    let lootText = "";
                    let totalPrice = 0;
                    for (let i = 0; i < mappedLoot.length; i++) {
                        const item = this.client.items.getById(mappedLoot[i].itemId);
                        if (item === null || !item.sellPrice) continue;

                        if (!sellItems) await this.client.items.addItem(item.itemId, member, mappedLoot[i].amount);
                        lootText += `${mappedLoot[i].amount}x ${item.name} <:${item.itemId}:${item.emoteId}> ― :coin: ${Math.floor(item.sellPrice * mappedLoot[i].amount)}\n`;
                        totalPrice += Math.floor(item.sellPrice * mappedLoot[i].amount);
                    }

                    await this.client.items.checkForDuplicates(await Database.getMember(interaction.user.id));

                    const fishCaught = mappedLoot.reduce((a, b) => a + b.amount, 0);
                    await Member.updateOne({ id: interaction.user.id }, { $inc: { "stats.fishCaught": fishCaught } });

                    await User.sendAchievementMessage(interaction, interaction.user.id, this.achievement);

                    if (lootText.length > 0 && totalPrice > 0) {
                        await User.addExperience(interaction.user.id);
                        embed.addFields({ name: "Fish caught", value: lootText, inline: false });
                        embed.setDescription(">>> " + msg.replace("%AMOUNT%", `${totalPrice}`));
                        embed.setColor(Colors.Green);
                        if (sellItems) await User.addMoney(interaction.user.id, totalPrice);
                    } else {
                        embed.setDescription(">>> You didn't catch any fish...");
                        embed.setColor(Colors.Red);
                    }
                } else {
                    embed.setColor(Colors.Red);
                    embed.setDescription("You were too late to catch some fish. Be quicker next time!");
                }

                await interaction.editReply({ embeds: [embed], components: [this.getRow(status, true)] });
                collector.stop();
            }
        });

        collector.on("end", async () => {
            if (!finishedCommand) {
                finishedCommand = true;

                embed.setColor(Colors.Red);
                embed.setDescription("You were too late to catch some fish. Be quicker next time!");
                await interaction.editReply({ embeds: [embed], components: [this.getRow("too late", true)] });
            }
        });

        const seconds = Helpers.getRandomNumber(5, 10);
        for (let i = 0; i < seconds; i++) await Helpers.getTimeout(1000);

        if (!finishedCommand) {
            status = "ready";
            await interaction.editReply({ components: [this.getRow(status)] });
        } else {
            await Helpers.getTimeout(1500);
            if (!finishedCommand) {
                finishedCommand = true;

                status = "too late";
                embed.setColor(Colors.Red);
                embed.setDescription("You were too late to catch some fish. Be quicker next time!");
                await interaction.editReply({ embeds: [embed], components: [this.getRow("too late", true)] });
            }
        }
    }

    private getRow(status: string, disabled = false) {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("fish_end")
                .setLabel("Reel in Fishing Rod")
                .setStyle(status === "too soon" ? ButtonStyle.Secondary : ((status === "ready") ? ButtonStyle.Success : ButtonStyle.Danger))
                .setDisabled(disabled || status === "too late"),
        );
    }

    private getRandomLoot(lootTable: string[], range: IRange) {
        const quantity = range.max === 0 || range.max <= range.min ? range.min : Helpers.getRandomNumber(range.min, range.max);

        const loot = [];
        for (let i = 0; i < quantity; i++) loot.push(lootTable[Helpers.getRandomNumber(0, lootTable.length - 1)]);
        return loot.length === 0 ? [lootTable[0]] : loot;
    }
}