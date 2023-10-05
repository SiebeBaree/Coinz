import {
    ActionRowBuilder,
    ButtonBuilder, ButtonStyle,
    ChatInputCommandInteraction,
    ColorResolvable, ComponentType,
    EmbedBuilder,
    User,
} from "discord.js";
import Bot from "../../domain/Bot";
import ICommand from "../../domain/ICommand";
import Command from "../../domain/Command";
import Member, { IMember } from "../../models/Member";
import Item from "../../domain/Item";
import Database from "../../lib/Database";
import Utils from "../../lib/Utils";

interface Event {
    name: string;
    description: string;
    action: (member: IMember) => Promise<IMember>;
    isPositive: boolean;
    chance: number;
}

export default class extends Command implements ICommand {
    readonly info = {
        name: "tree",
        description: "Plant a tree and watch it grow! Cut it down to get some wood.",
        options: [],
        category: "general",
        extraFields: [
            {
                name: "What do I need to do?",
                value: "This command is to slowly grow a tree and cut it when you like to collect wood and sell the wood in the shop. The maximum height of a tree is 100ft. You can speed up the growing process by watering the tree once every 8 hours.",
                inline: false,
            },
        ],
        deferReply: true,
    };

    private readonly FT_TO_M = 3.28084;
    private readonly MAX_TREE_HEIGHT = 100;
    private readonly WATER_COOLDOWN = 28800;

    private readonly shovel: Item;
    private readonly wood: Item;
    private readonly axe: Item;
    private readonly chainsaw: Item;

    private readonly events: Event[] = [
        {
            name: "Sunny Day",
            description: "The sun shines brightly, providing your tree with abundant sunlight! Your tree has grown by 4ft!",
            action: async (member: IMember) => {
                member.tree.extraHeight += 4;
                return member;
            },
            isPositive: true,
            chance: 60,
        },
        {
            name: "Stormy Weather",
            description: "Stormy weather has caused your tree to lose 20% of its height.",
            action: async (member: IMember) => {
                member.tree.extraHeight -= Math.floor(member.tree.height * 0.2);
                return member;
            },
            isPositive: false,
            chance: 20,
        },
        {
            name: "Mystical Rain",
            description: "A magical rain shower nourishes the tree, making it sparkle and shine. Your tree has grown by 8ft!",
            action: async (member: IMember) => {
                member.tree.extraHeight += 8;
                return member;
            },
            isPositive: true,
            chance: 20,
        },
        {
            name: "Wild Winds",
            description: "Strong winds threaten to break the tree's branches! Your tree has lost 10% of its height.",
            action: async (member: IMember) => {
                member.tree.extraHeight -= Math.floor(member.tree.height * 0.1);
                return member;
            },
            isPositive: false,
            chance: 40,
        },
        {
            name: "Fertile Soil",
            description: "The soil around your tree has become more fertile, causing it to grow faster. Your tree has grown by 12ft!",
            action: async (member: IMember) => {
                member.tree.extraHeight += 12;
                return member;
            },
            isPositive: true,
            chance: 30,
        },
        {
            name: "Mischief Night",
            description: "Someone has come and vandalised your tree, knocking it over. You have to replant it.",
            action: async (member: IMember) => {
                member.tree = this.getDefaultTree();
                await Member.updateOne({ id: member.id }, { $set: { tree: member.tree } });
                return member;
            },
            isPositive: false,
            chance: 10,
        },
        {
            name: "Golden Leaves",
            description: "Some of the tree's leaves have turned a shimmering gold, drawing admiration. Your tree has instantly grown to full height!",
            action: async (member: IMember) => {
                member.tree.extraHeight = this.MAX_TREE_HEIGHT;
                member.tree.nextEventAt = 0;
                return member;
            },
            isPositive: true,
            chance: 10,
        },
    ];

    constructor(bot: Bot, file: string) {
        super(bot, file);

        this.shovel = this.client.items.getById("shovel")!;
        this.wood = this.client.items.getById("wood")!;
        this.axe = this.client.items.getById("axe")!;
        this.chainsaw = this.client.items.getById("chainsaw")!;
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const now = Math.floor(Date.now() / 1000);
        let event;
        if (member.tree.nextEventAt <= now && member.tree.nextEventAt !== 0 && member.tree.plantedAt !== 0) {
            const treeHeight = this.getTreeHeight(member);

            if (treeHeight > 10 && treeHeight < 90) {
                event = this.getRandomEvent();
                member = await event.action(member);
                member.tree.nextEventAt = this.getNewEventTimestamp();
            } else {
                if (treeHeight <= 10) {
                    await Member.updateOne({ id: member.id }, { $set: { "tree.nextEventAt": this.getNewEventTimestamp() } });
                } else {
                    await Member.updateOne({ id: member.id }, { $set: { "tree.nextEventAt": 0 } });
                }
            }
        }

        member = await this.updateTreeStatus(member);

        const message = await interaction.editReply({
            embeds: [this.getEmbed(interaction.user, member)],
            components: [this.getButtons(member)],
        });

        if (event) {
            const embed = new EmbedBuilder()
                .setTitle(event.name)
                .setColor(<ColorResolvable>this.client.config.embed.color)
                .setDescription(event.description);
            await interaction.followUp({ embeds: [embed] });
        }

        const collector = message.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            max: 4,
            time: 60_000,
            componentType: ComponentType.Button,
        });
        await this.client.achievement.sendAchievementMessage(interaction, member.id, this.client.achievement.getById("large_tree"));

        collector.on("collect", async (i) => {
            await i.deferUpdate();
            if (i.customId === "tree_water") {
                member = await Database.getMember(member.id);

                if (member.tree.wateredAt + this.WATER_COOLDOWN > now) {
                    await interaction.followUp({
                        content: `:x: You can water your tree again in <t:${member.tree.wateredAt + this.WATER_COOLDOWN}:R>`,
                        ephemeral: true,
                    });
                    return;
                }

                member.tree.timesWatered++;
                member.tree.wateredAt = now;
                member = await this.updateTreeStatus(member);

                await interaction.editReply({
                    embeds: [this.getEmbed(interaction.user, member)],
                    components: [this.getButtons(member)],
                });
            } else if (i.customId === "tree_plant") {
                member = await Database.getMember(member.id);

                if (member.tree.plantedAt !== 0) {
                    await interaction.followUp({ content: ":x: You already have a tree planted.", ephemeral: true });
                    return;
                } else if (!this.client.items.hasInInventory("shovel", member)) {
                    await interaction.followUp({
                        content: `:x: You need a **${this.client.items.getById("shovel")!.name}** to plant a tree.`,
                        ephemeral: true,
                    });
                    return;
                }

                if (Utils.getRandomNumber(1, 100) <= 30) {
                    await this.client.items.removeItem("shovel", member);
                    await interaction.followUp({ content: ":x: You broke your shovel while planting the tree.", ephemeral: true });
                }

                member.tree.plantedAt = now;
                member.tree.wateredAt = now;
                member.tree.height = 0;
                member.tree.timesWatered = 0;
                member.tree.isCuttingDown = 0;
                member.tree.extraHeight = 0;
                member.tree.nextEventAt = this.getNewEventTimestamp();

                await interaction.editReply({
                    embeds: [this.getEmbed(interaction.user, member)],
                    components: [this.getButtons(member)],
                });
                await Member.updateOne({ id: member.id }, { $set: { tree: member.tree } });
            } else if (i.customId === "tree_cut") {
                member = await Database.getMember(member.id);

                if (member.tree.plantedAt === 0) {
                    await interaction.followUp({ content: ":x: You don't have a tree planted.", ephemeral: true });
                    return;
                } else if (member.tree.height < 15) {
                    await interaction.followUp({ content: ":x: Your tree isn't tall enough to be cut down.", ephemeral: true });
                    return;
                } else if (member.tree.isCuttingDown !== 0 && member.tree.isCuttingDown > now) {
                    await interaction.followUp({ content: `:x: You are already cutting down your tree. You can cut it down in <t:${member.tree.isCuttingDown}:R>` });
                    return;
                }

                const hasAxe = this.client.items.hasInInventory("axe", member);
                const hasChainsaw = this.client.items.hasInInventory("chainsaw", member);

                if (!hasAxe && !hasChainsaw) {
                    await interaction.followUp({
                        content: `:x: You need a <:${this.axe.itemId}:${this.axe.emoteId}> **${this.axe.name}** or <:${this.chainsaw.itemId}:${this.chainsaw.emoteId}> **${this.chainsaw.name}** to cut down your tree.`,
                        ephemeral: true,
                    });
                    return;
                }

                if (hasAxe && !hasChainsaw) {
                    if (member.tree.isCuttingDown === 0) {
                        member.tree.isCuttingDown = Math.floor(Date.now() / 1000) + 3600;
                        await interaction.editReply({
                            embeds: [this.getEmbed(interaction.user, member)],
                            components: [this.getButtons(member)],
                        });
                        await interaction.followUp({ content: `You started cutting down your tree. You can cut it down <t:${member.tree.isCuttingDown}:R>`, ephemeral: true });
                        await Member.updateOne({ id: member.id }, { $set: { "tree.isCuttingDown": member.tree.isCuttingDown } });
                        return;
                    } else {
                        member.tree.isCuttingDown = 0;
                    }
                }

                if (hasChainsaw && Utils.getRandomNumber(1, 100) <= 20) {
                    await this.client.items.removeItem("chainsaw", member);
                    await interaction.followUp({
                        content: `:x: You broke your <:${this.chainsaw.itemId}:${this.chainsaw.emoteId}> **${this.chainsaw.name}** while cutting down your tree.`,
                        ephemeral: true,
                    });
                }

                const totalWood = Math.floor(member.tree.height / 2);
                member.tree = this.getDefaultTree();

                await interaction.editReply({
                    embeds: [this.getEmbed(interaction.user, member)],
                    components: [this.getButtons(member)],
                });
                await interaction.followUp({
                    content: `You cut down your tree and got ${totalWood}x <:${this.wood.itemId}:${this.wood.emoteId}> **${this.wood.name}**.`,
                    ephemeral: true,
                });
                await Member.updateOne({ id: member.id }, { $set: { tree: member.tree } });
                await this.client.items.addItem("wood", member, totalWood);
            }
        });

        collector.on("end", async () => {
            await interaction.editReply({ components: [this.getButtons(member, true)] });
        });
    }

    private getEmbed(user: User, member: IMember): EmbedBuilder {
        const imageURL = `https://cdn.coinzbot.xyz/tree/new/${Math.floor(member.tree.height / 10)}.png`;
        const totalWood = Math.floor(member.tree.height / 2);

        const treeHeight = this.getTreeHeight(member);
        let description = member.tree.plantedAt === 0 ? `:x: You haven't planted a tree yet.\n:seedling: To plant a tree you need a <:${this.shovel.itemId}:${this.shovel.emoteId}> **${this.shovel.name}**.`
            : `:straight_ruler: **Height:** ${treeHeight}ft (${Math.round(treeHeight / this.FT_TO_M)}m)\n<:${this.wood.itemId}:${this.wood.emoteId}> **Total Wood:** ${totalWood}\n:droplet: ${member.tree.wateredAt + this.WATER_COOLDOWN <= Math.floor(Date.now() / 1000) ? "**You can water your tree now**" : `**You can water your tree** <t:${member.tree.wateredAt + this.WATER_COOLDOWN}:R>`}`;

        if (member.tree.plantedAt !== 0 && member.tree.isCuttingDown !== 0 && member.tree.isCuttingDown > Math.floor(Date.now() / 1000)) {
            description += `\n:axe: You are currently cutting down your tree. You can cut it down <t:${member.tree.isCuttingDown}:R>`;
        }

        return new EmbedBuilder()
            .setTitle(`${user.username}'s Tree`)
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setImage(member.tree.plantedAt === 0 ? "https://cdn.coinzbot.xyz/tree/new/unplanted.png" : imageURL)
            .setDescription(description)
            .setFooter({ text: "All images are AI generated by Adobe Firefly" });
    }

    private getButtons(member: IMember, disabled = false): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("tree_plant")
                    .setLabel("Plant a tree")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(disabled || member.tree.plantedAt !== 0 || member.tree.isCuttingDown !== 0),
                new ButtonBuilder()
                    .setCustomId("tree_water")
                    .setLabel("Water your tree")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(disabled || member.tree.plantedAt === 0 || member.tree.wateredAt + this.WATER_COOLDOWN > Math.floor(Date.now() / 1000) || member.tree.height >= this.MAX_TREE_HEIGHT || member.tree.isCuttingDown !== 0),
                new ButtonBuilder()
                    .setCustomId("tree_cut")
                    .setLabel("Cut your tree")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(disabled || member.tree.plantedAt === 0 || member.tree.height < 15 || (member.tree.isCuttingDown !== 0 && member.tree.isCuttingDown > Math.floor(Date.now() / 1000))));
    }

    private async updateTreeStatus(member: IMember): Promise<IMember> {
        if (member.tree.plantedAt === 0) return member;

        member.tree.height = this.getTreeHeight(member);
        if (member.tree.height >= this.MAX_TREE_HEIGHT) {
            member.tree.nextEventAt = 0;
        }

        await Member.updateOne({ id: member.id }, { $set: { tree: member.tree } });
        return member;
    }

    private getTreeHeight(member: IMember): number {
        const now = Math.floor(Date.now() / 1000);
        const daysSincePlant = Math.floor((now - member.tree.plantedAt) / 86400);
        return Math.min(Math.floor(daysSincePlant * 0.75) + (member.tree.timesWatered * 2) + member.tree.extraHeight, this.MAX_TREE_HEIGHT);
    }

    // Get a new timestamp between 3 and 7 days from now
    private getNewEventTimestamp(): number {
        return Math.floor(Date.now() / 1000) + Utils.getRandomNumber(259200, 604800);
    }

    private getRandomEvent(): Event {
        let tries = 0;

        while (tries < 10) {
            const event = this.events[Utils.getRandomNumber(0, this.events.length - 1)];
            if (Utils.getRandomNumber(1, 100) <= event.chance) {
                return event;
            }

            tries++;
        }

        return this.events[Utils.getRandomNumber(0, this.events.length - 1)];
    }

    private getDefaultTree() {
        return {
            height: 0,
            plantedAt: 0,
            timesWatered: 0,
            wateredAt: 0,
            nextEventAt: 0,
            isCuttingDown: 0,
            extraHeight: 0,
        };
    }
}