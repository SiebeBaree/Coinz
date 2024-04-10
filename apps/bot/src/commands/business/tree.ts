import type { ColorResolvable, User } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } from 'discord.js';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import { getMember, getUserStats } from '../../lib/database';
import type { IMember } from '../../models/member';
import Member from '../../models/member';
import UserStats from '../../models/userStats';
import { feetToMeters, getRandomNumber } from '../../utils';

type Event = {
    name: string;
    description: string;
    isPositive: boolean;
    chance: number;

    action(member: IMember): Promise<IMember>;
};

const MAX_TREE_HEIGHT = 100;
const WATER_COOLDOWN = 28800; // 8 hours

const events: Event[] = [
    {
        name: 'Sunny Day',
        description: 'The sun shines brightly, providing your tree with abundant sunlight! Your tree has grown by 4ft!',
        action: async (member: IMember) => {
            member.tree.extraHeight += 4;
            return member;
        },
        isPositive: true,
        chance: 60,
    },
    {
        name: 'Stormy Weather',
        description: 'Stormy weather has caused your tree to lose 20% of its height.',
        action: async (member: IMember) => {
            member.tree.extraHeight -= Math.floor(member.tree.height * 0.2);
            return member;
        },
        isPositive: false,
        chance: 20,
    },
    {
        name: 'Mystical Rain',
        description:
            'A magical rain shower nourishes the tree, making it sparkle and shine. Your tree has grown by 8ft!',
        action: async (member: IMember) => {
            member.tree.extraHeight += 8;
            return member;
        },
        isPositive: true,
        chance: 20,
    },
    {
        name: 'Wild Winds',
        description: "Strong winds threaten to break the tree's branches! Your tree has lost 10% of its height.",
        action: async (member: IMember) => {
            member.tree.extraHeight -= Math.floor(member.tree.height * 0.1);
            return member;
        },
        isPositive: false,
        chance: 40,
    },
    {
        name: 'Fertile Soil',
        description:
            'The soil around your tree has become more fertile, causing it to grow faster. Your tree has grown by 12ft!',
        action: async (member: IMember) => {
            member.tree.extraHeight += 12;
            return member;
        },
        isPositive: true,
        chance: 30,
    },
    {
        name: 'Mischief Night',
        description: 'Someone has come and vandalised your tree, knocking it over. You have to replant it.',
        action: async (member: IMember) => {
            member.tree = getDefaultTree();
            await Member.updateOne({ id: member.id }, { $set: { tree: member.tree } });
            return member;
        },
        isPositive: false,
        chance: 10,
    },
    {
        name: 'Golden Leaves',
        description:
            "Some of the tree's leaves have turned a shimmering gold, drawing admiration. Your tree has instantly grown to full height!",
        action: async (member: IMember) => {
            member.tree.extraHeight = MAX_TREE_HEIGHT;
            member.tree.nextEventAt = 0;
            return member;
        },
        isPositive: true,
        chance: 10,
    },
];

function getEmbed(client: Bot, user: User, member: IMember): EmbedBuilder {
    const shovel = client.items.getById('shovel')!;
    const wood = client.items.getById('wood')!;
    const imageURL = `https://cdn.coinzbot.xyz/tree/new/${Math.floor(member.tree.height / 10)}.jpg`;
    const totalWood = Math.floor(member.tree.height / 2);

    const treeHeight = getTreeHeight(member);
    let description =
        member.tree.plantedAt === 0
            ? `:x: You haven't planted a tree yet.\n:seedling: To plant a tree you need a <:${shovel.itemId}:${shovel.emoteId}> **${shovel.name}**.`
            : `:straight_ruler: **Height:** ${treeHeight}ft (${feetToMeters(treeHeight)}m)\n<:${wood.itemId}:${
                  wood.emoteId
              }> **Total Wood:** ${totalWood}\n:droplet: ${
                  member.tree.wateredAt + WATER_COOLDOWN <= Math.floor(Date.now() / 1000)
                      ? '**You can water your tree now**'
                      : `**You can water your tree** <t:${member.tree.wateredAt + WATER_COOLDOWN}:R>`
              }`;

    if (
        member.tree.plantedAt !== 0 &&
        member.tree.isCuttingDown !== 0 &&
        member.tree.isCuttingDown > Math.floor(Date.now() / 1000)
    ) {
        description += `\n:axe: You are currently cutting down your tree. You can cut it down <t:${member.tree.isCuttingDown}:R>`;
    }

    return new EmbedBuilder()
        .setTitle(`${user.username}'s Tree`)
        .setColor(client.config.embed.color as ColorResolvable)
        .setImage(member.tree.plantedAt === 0 ? 'https://cdn.coinzbot.xyz/tree/new/unplanted.jpg' : imageURL)
        .setDescription(description)
        .setFooter({ text: 'All images are AI generated by Adobe Firefly' });
}

function getButtons(member: IMember, disabled = false): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('tree_plant')
            .setLabel('Plant a tree')
            .setStyle(ButtonStyle.Success)
            .setDisabled(disabled || member.tree.plantedAt !== 0 || member.tree.isCuttingDown !== 0),
        new ButtonBuilder()
            .setCustomId('tree_water')
            .setLabel('Water your tree')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(
                disabled ||
                    member.tree.plantedAt === 0 ||
                    member.tree.wateredAt + WATER_COOLDOWN > Math.floor(Date.now() / 1000) ||
                    member.tree.height >= MAX_TREE_HEIGHT ||
                    member.tree.isCuttingDown !== 0,
            ),
        new ButtonBuilder()
            .setCustomId('tree_cut')
            .setLabel('Cut your tree')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(
                disabled ||
                    member.tree.plantedAt === 0 ||
                    member.tree.height < 15 ||
                    (member.tree.isCuttingDown !== 0 && member.tree.isCuttingDown > Math.floor(Date.now() / 1000)),
            ),
    );
}

async function updateTreeStatus(member: IMember): Promise<IMember> {
    if (member.tree.plantedAt === 0) return member;

    member.tree.height = getTreeHeight(member);
    if (member.tree.height >= MAX_TREE_HEIGHT) {
        member.tree.nextEventAt = 0;
    }

    await Member.updateOne({ id: member.id }, { $set: { tree: member.tree } });
    return member;
}

function getTreeHeight(member: IMember): number {
    const now = Math.floor(Date.now() / 1000);
    const daysSincePlant = Math.floor((now - member.tree.plantedAt) / 86400);
    return Math.min(
        Math.floor(daysSincePlant * 0.75) + member.tree.timesWatered * 2 + member.tree.extraHeight,
        MAX_TREE_HEIGHT,
    );
}

function getNewEventTimestamp(): number {
    return Math.floor(Date.now() / 1000) + getRandomNumber(259200, 604800);
}

function getRandomEvent(): Event {
    let tries = 0;

    while (tries < 10) {
        const event = events[getRandomNumber(0, events.length - 1)]!;
        if (getRandomNumber(1, 100) <= event.chance) {
            return event;
        }

        tries++;
    }

    return events[getRandomNumber(0, events.length - 1)]!;
}

function getDefaultTree() {
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

export default {
    data: {
        name: 'tree',
        description: 'Plant a tree and watch it grow! Cut it down to get some wood.',
        category: 'business',
        extraFields: [
            {
                name: 'What do I need to do?',
                value: 'This command is to slowly grow a tree and cut it when you like to collect wood and sell the wood in the shop. The maximum height of a tree is 100ft. You can speed up the growing process by watering the tree once every 8 hours.',
                inline: false,
            },
        ],
        deferReply: true,
    },
    async execute(client, interaction, member) {
        const now = Math.floor(Date.now() / 1000);
        let event;
        if (member.tree.nextEventAt <= now && member.tree.nextEventAt !== 0 && member.tree.plantedAt !== 0) {
            const treeHeight = getTreeHeight(member);

            if (treeHeight > 10 && treeHeight < 90) {
                event = getRandomEvent();
                member = await event.action(member);
                member.tree.nextEventAt = getNewEventTimestamp();
            } else if (treeHeight <= 10) {
                await Member.updateOne({ id: member.id }, { $set: { 'tree.nextEventAt': getNewEventTimestamp() } });
            } else {
                await Member.updateOne({ id: member.id }, { $set: { 'tree.nextEventAt': 0 } });
            }
        }

        member = await updateTreeStatus(member);
        const chainsaw = client.items.getById('chainsaw')!;
        const axe = client.items.getById('axe')!;
        const wood = client.items.getById('wood')!;

        const message = await interaction.editReply({
            embeds: [getEmbed(client, interaction.user, member)],
            components: [getButtons(member)],
        });

        if (event) {
            const embed = new EmbedBuilder()
                .setTitle(event.name)
                .setColor(client.config.embed.color as ColorResolvable)
                .setDescription(event.description);
            await interaction.followUp({ embeds: [embed] });
        }

        const collector = message.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            max: 4,
            time: 60_000,
            componentType: ComponentType.Button,
        });
        await client.achievement.sendAchievementMessage(
            interaction,
            member.id,
            client.achievement.getById('large_tree'),
        );

        collector.on('collect', async (i) => {
            await i.deferUpdate();
            if (i.customId === 'tree_water') {
                member = await getMember(member.id);

                if (member.tree.wateredAt + WATER_COOLDOWN > now) {
                    await interaction.followUp({
                        content: `:x: You can water your tree again in <t:${member.tree.wateredAt + WATER_COOLDOWN}:R>`,
                        ephemeral: true,
                    });
                    return;
                }

                member.tree.timesWatered++;
                member.tree.wateredAt = now;
                member = await updateTreeStatus(member);

                await interaction.editReply({
                    embeds: [getEmbed(client, interaction.user, member)],
                    components: [getButtons(member)],
                });
            } else if (i.customId === 'tree_plant') {
                member = await getMember(member.id);
                const shovel = client.items.getById('shovel')!;

                if (member.tree.plantedAt !== 0) {
                    await interaction.followUp({ content: ':x: You already have a tree planted.', ephemeral: true });
                    return;
                } else if (!client.items.hasInInventory('shovel', member)) {
                    await interaction.followUp({
                        content: `:x: You need a <:${shovel.itemId}:${shovel.emoteId}> **${shovel.name}** to plant a tree.`,
                        ephemeral: true,
                    });
                    return;
                }

                if (getRandomNumber(1, 100) <= 30) {
                    await client.items.removeItem('shovel', member);
                    await interaction.followUp({
                        content: `:x: You broke your <:${shovel.itemId}:${shovel.emoteId}> **${shovel.name}** while planting the tree, you need to buy a new one!`,
                        ephemeral: true,
                    });
                    return;
                }

                member.tree.plantedAt = now;
                member.tree.wateredAt = now;
                member.tree.height = 0;
                member.tree.timesWatered = 0;
                member.tree.isCuttingDown = 0;
                member.tree.extraHeight = 0;
                member.tree.nextEventAt = getNewEventTimestamp();

                await interaction.editReply({
                    embeds: [getEmbed(client, interaction.user, member)],
                    components: [getButtons(member)],
                });
                await Member.updateOne({ id: member.id }, { $set: { tree: member.tree } });
            } else if (i.customId === 'tree_cut') {
                member = await getMember(member.id);

                if (member.tree.plantedAt === 0) {
                    await interaction.followUp({ content: ":x: You don't have a tree planted.", ephemeral: true });
                    return;
                } else if (member.tree.height < 15) {
                    await interaction.followUp({
                        content: ":x: Your tree isn't tall enough to be cut down.",
                        ephemeral: true,
                    });
                    return;
                } else if (member.tree.isCuttingDown !== 0 && member.tree.isCuttingDown > now) {
                    await interaction.followUp({
                        content: `:x: You are already cutting down your tree. You can cut it down in <t:${member.tree.isCuttingDown}:R>`,
                    });
                    return;
                }

                const hasAxe = client.items.hasInInventory('axe', member);
                const hasChainsaw = client.items.hasInInventory('chainsaw', member);

                if (!hasAxe && !hasChainsaw) {
                    await interaction.followUp({
                        content: `:x: You need a <:${axe.itemId}:${axe.emoteId}> **${axe.name}** or <:${chainsaw.itemId}:${chainsaw.emoteId}> **${chainsaw.name}** to cut down your tree.`,
                        ephemeral: true,
                    });
                    return;
                }

                if (hasAxe && !hasChainsaw) {
                    if (member.tree.isCuttingDown === 0) {
                        member.tree.isCuttingDown = Math.floor(Date.now() / 1000) + 3600;
                        await interaction.editReply({
                            embeds: [getEmbed(client, interaction.user, member)],
                            components: [getButtons(member)],
                        });
                        await interaction.followUp({
                            content: `You started cutting down your tree. You can cut it down <t:${member.tree.isCuttingDown}:R>`,
                            ephemeral: true,
                        });
                        await Member.updateOne(
                            { id: member.id },
                            { $set: { 'tree.isCuttingDown': member.tree.isCuttingDown } },
                        );
                        return;
                    } else {
                        member.tree.isCuttingDown = 0;
                    }
                }

                if (hasChainsaw && getRandomNumber(1, 100) <= 20) {
                    await client.items.removeItem('chainsaw', member);
                    await interaction.followUp({
                        content: `:x: You broke your <:${chainsaw.itemId}:${chainsaw.emoteId}> **${chainsaw.name}** while cutting down your tree.`,
                        ephemeral: true,
                    });
                }

                const totalWood = Math.floor(member.tree.height / 2);
                member.tree = getDefaultTree();

                await interaction.editReply({
                    embeds: [getEmbed(client, interaction.user, member)],
                    components: [getButtons(member)],
                });
                await interaction.followUp({
                    content: `You cut down your tree and got ${totalWood}x <:${wood.itemId}:${wood.emoteId}> **${wood.name}**.`,
                    ephemeral: true,
                });
                await Member.updateOne({ id: member.id }, { $set: { tree: member.tree } });
                await client.items.addItem('wood', member, totalWood);

                const userStats = await getUserStats(member.id);
                if (userStats.treesCutDown + 1 === 50) {
                    await client.achievement.sendAchievementMessage(
                        interaction,
                        member.id,
                        client.achievement.getById('lumberjack'),
                    );
                }

                await UserStats.updateOne(
                    { id: member.id },
                    {
                        $inc: {
                            treesCutDown: 1,
                            totalTreeHeight: member.tree.height,
                        },
                    },
                    { upsert: true },
                );
            }
        });

        collector.on('end', async () => {
            await interaction.editReply({ components: [getButtons(member, true)] });
        });
    },
} satisfies Command;
