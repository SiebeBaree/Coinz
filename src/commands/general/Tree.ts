import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, ComponentType, EmbedBuilder, User } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Member, { IMember } from "../../models/Member";
import Item from "../../interfaces/Item";
import Database from "../../utils/Database";
import Helpers from "../../utils/Helpers";

export default class extends Command implements ICommand {
    readonly info = {
        name: "tree",
        description: "Plant a tree and watch it grow! Cut it down to get some wood.",
        options: [
            {
                name: "view",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Get your tree's growth progress.",
                options: [],
            },
            {
                name: "cut",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Cut down your tree to get some wood.",
                options: [],
            },
        ],
        category: "general",
        extraFields: [
            { name: "What do I need to do?", value: "This command is to slowly grow a tree and cut it when you like to collect wood and sell the wood in the shop. The maximum height of a tree is 100ft. You can speed up the growing process by watering the tree once every 8 hours.", inline: false },
        ],
    };

    private readonly FT_TO_M = 3.28084;
    private readonly wood: Item;
    private readonly bag: Item;
    private readonly shovel: Item;
    private readonly MAX_TREE_HEIGHT = 100;
    private readonly WATER_COOLDOWN = 28800;

    constructor(bot: Bot, file: string) {
        super(bot, file);

        const wood = this.client.items.getById("wood");
        const bag = this.client.items.getById("bag");
        const shovel = this.client.items.getById("shovel");
        if (!wood || !bag || !shovel) {
            throw new Error("Wood item not found.");
        }

        this.wood = wood;
        this.bag = bag;
        this.shovel = shovel;
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        switch (interaction.options.getSubcommand()) {
            case "view":
                await this.view(interaction, member);
                break;
            case "cut":
                await this.cut(interaction, member);
                break;
            default:
                await interaction.reply({ content: this.client.config.invalidCommand, ephemeral: true });
        }
    }

    private async view(interaction: ChatInputCommandInteraction, member: IMember) {
        member = await this.getNewTreeStatus(member);

        const now = Math.floor(Date.now() / 1000);
        // if (member.tree.nextEvent > now && member.tree.nextEvent !== 0) {
        //     const event = this.getEvent();
        // }

        const message = await interaction.reply({ embeds: [this.getEmbed(interaction.user, member)], components: [this.getButtons(member)], fetchReply: true });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, max: 5, time: 60_000, componentType: ComponentType.Button });

        collector.on("collect", async (i) => {
            if (i.customId === "tree_water") {
                member = await Database.getMember(interaction.user.id);

                if (member.tree.lastWatered + this.WATER_COOLDOWN > now) {
                    await i.reply({ content: "You can only water your tree once every 8 hours!", ephemeral: true });
                    return;
                }

                member.tree.timesWatered++;
                member.tree.lastWatered = now;
                member = await this.getNewTreeStatus(member);

                await i.update({ embeds: [this.getEmbed(interaction.user, member)], components: [this.getButtons(member)] });
                await Member.updateOne(
                    { id: member.id },
                    { $inc: { "tree.timesWatered": 1 }, $set: { "tree.lastWatered": now } },
                );
            } else if (i.customId === "tree_plant") {
                member = await Database.getMember(interaction.user.id);

                if (member.tree.planted !== 0) {
                    await i.reply({ content: "You already planted a tree!", ephemeral: true });
                    return;
                }

                if (!this.client.items.hasInInventory("shovel", member)) {
                    await i.reply({ content: `You don't have a <:${this.shovel.itemId}:${this.shovel.emoteId}> **${this.shovel.name}** to plant a tree!`, ephemeral: true });
                    return;
                }

                member.tree.planted = now;
                member.tree.seedType = "oak_tree";
                member.tree.lastWatered = now;
                member.tree.height = 0;
                member.tree.nextEvent = this.getNewEventTimestamp();
                member.tree.timesWatered = 0;

                await i.update({ embeds: [this.getEmbed(interaction.user, member)], components: [this.getButtons(member)] });
                await Member.updateOne(
                    { id: member.id },
                    {
                        $set: {
                            "tree.planted": now,
                            "tree.seedType": "oak_tree",
                            "tree.lastWatered": now,
                            "tree.height": 0,
                            "tree.nextEvent": member.tree.nextEvent,
                            "tree.timesWatered": 0,
                        },
                    },
                );
                await this.client.items.removeItem("shovel", member);
            }
        });

        collector.on("end", async () => {
            await interaction.editReply({ components: [this.getButtons(member, true)] });
        });
    }

    private async cut(interaction: ChatInputCommandInteraction, member: IMember) {
        if (member.tree.seedType === "") {
            await interaction.reply({ content: "You don't have a tree to cut down.", ephemeral: true });
            return;
        }

        if (member.tree.height < 10) {
            await interaction.reply({ content: "Your tree isn't tall enough to be cut down.", ephemeral: true });
            return;
        }

        if (!this.client.items.hasInInventory("axe", member)) {
            await interaction.reply({ content: "You don't have an axe to cut down your tree.", ephemeral: true });
            return;
        }

        let wood = Math.floor(member.tree.height / 2);
        if (!this.client.items.hasInInventory("bag", member)) {
            wood = Math.round(wood * 0.9);
        } else {
            await this.client.items.removeItem("bag", member);
        }

        await interaction.reply({ content: `You cut down your tree and got ${wood}x <:${this.wood.itemId}:${this.wood.emoteId}> **${this.wood.name}** wood!`, ephemeral: true });

        await Member.updateOne(
            { id: member.id },
            {
                $set: {
                    "tree.height": 0,
                    "tree.seedType": "",
                    "tree.lastWatered": 0,
                    "tree.nextEvent": 0,
                    "tree.timesWatered": 0,
                    "tree.planted": 0,
                },
            },
        );
        await this.client.items.addItem(this.wood.itemId, member, wood);
        await this.client.items.removeItem("axe", member);
    }

    private getEmbed(user: User, member: IMember): EmbedBuilder {
        const imageURL = `https://cdn.coinzbot.xyz/tree/${member.tree.preference.toLowerCase()}/${Math.floor(member.tree.height / 10)}.png`;
        const wood = Math.floor(member.tree.height / 2);

        return new EmbedBuilder()
            .setTitle(`${user.username}'s Tree`)
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setImage(member.tree.seedType === "" ? `https://cdn.coinzbot.xyz/tree/${member.tree.preference.toLowerCase()}/unplanted.png` : imageURL)
            .setDescription(`${member.tree.planted === 0 ?
                `:x: You haven't planted a tree yet.\n:seedling: To plant a tree you need a <:${this.shovel.itemId}:${this.shovel.emoteId}> **${this.shovel.name}**.\n\n`
                : `:straight_ruler: **Height:** ${member.tree.height}ft (${Math.round(member.tree.height / this.FT_TO_M)}m)\n<:${this.wood.itemId}:${this.wood.emoteId}> **Total Wood:** ${Math.round(wood * 0.9)} (With <:${this.bag.itemId}:${this.bag.emoteId}> you get ${wood})`}`)
            .addFields(
                { name: "Disclaimer", value: "All tree images are AI generated by [Midjourney](https://midjourney.com/).\nMore different trees will follow soon!", inline: false },
            );
    }

    private getButtons(member: IMember, disabled = false): ActionRowBuilder<ButtonBuilder> {
        const row = new ActionRowBuilder<ButtonBuilder>();

        if (member.tree.seedType === "") {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId("tree_plant")
                    .setLabel("Plant a tree")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(disabled || member.tree.planted !== 0),
            );
        } else {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId("tree_water")
                    .setLabel("Water your tree")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(disabled || member.tree.lastWatered + this.WATER_COOLDOWN > Math.floor(Date.now() / 1000)),
            );
        }

        return row;
    }

    private async getNewTreeStatus(member: IMember): Promise<IMember> {
        if (member.tree.planted === 0 || member.tree.seedType === "") {
            return member;
        }

        const now = Math.floor(Date.now() / 1000);
        const daysSincePlanted = Math.floor((now - member.tree.planted) / 86400);
        member.tree.height = daysSincePlanted + member.tree.timesWatered * 2;

        if (member.tree.height >= this.MAX_TREE_HEIGHT) {
            member.tree.height = this.MAX_TREE_HEIGHT;
            member.tree.nextEvent = 0;
        }

        await Member.updateOne(
            { id: member.id },
            { $set: { "tree.height": member.tree.height, "tree.nextEvent": member.tree.nextEvent } },
        );

        return member;
    }

    private getNewEventTimestamp(): number {
        return Math.floor(Date.now() / 1000) + Helpers.getRandomNumber(43200, 432000);
    }
}