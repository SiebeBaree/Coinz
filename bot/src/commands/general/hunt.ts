import type { APISelectMenuOption, ColorResolvable } from 'discord.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    StringSelectMenuBuilder,
    EmbedBuilder,
} from 'discord.js';
import huntData from '../../data/hunt.json';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import type { Item } from '../../models/item';
import UserStats from '../../models/userStats';
import { filter, getRandomItems, getRandomNumber } from '../../utils';
import { addExperience, addMoney, removeMoney } from '../../utils/money';

type Weapons = 'bow' | 'hunting_rifle' | 'knife';
const REQUIRED_ITEMS = ['knife', 'bow', 'hunting_rifle'] as Weapons[];

type WeaponData = {
    [key in Weapons]: Item | null;
};

function getRow(disabled = false) {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('hunt_easy')
            .setLabel('Public Hunting Area')
            .setStyle(ButtonStyle.Success)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId('hunt_medium')
            .setLabel('The Forest')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId('hunt_hard')
            .setLabel('The Zoo')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled),
    );
}

function getWeapons(client: Bot): WeaponData {
    const weapons: WeaponData = {
        knife: null as Item | null,
        bow: null as Item | null,
        hunting_rifle: null as Item | null,
    };

    for (const itemId of REQUIRED_ITEMS) {
        const item = client.items.getById(itemId);
        if (item === null) continue;

        if (item.itemId === 'knife') {
            weapons.knife = item;
        } else if (item.itemId === 'bow') {
            weapons.bow = item;
        } else if (item.itemId === 'hunting_rifle') {
            weapons.hunting_rifle = item;
        }
    }

    return weapons;
}

function getWeaponSelect(weapons: WeaponData, disabled = false) {
    const options = [];
    for (const value of Object.values(weapons)) {
        if (value === null) continue;
        options.push({
            label: value.name,
            value: value.itemId,
            emoji: `<:${value.itemId}:${value.emoteId}>`,
        } as APISelectMenuOption);
    }

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('weapons_select')
            .setPlaceholder('Select a weapon')
            .addOptions(options)
            .setDisabled(disabled),
    );
}

export default {
    data: {
        name: 'hunt',
        description: 'Hunt for animals and get money selling their meat and skin.',
        category: 'general',
        cooldown: 900,
    },
    async execute(client, interaction, member) {
        const weapons = getWeapons(client);

        let description =
            'You can choose with what weapon you want to hunt. Some weapons are easier to use than others but will give you less money.';
        if (weapons.knife) {
            description += `\n\n<:${weapons.knife.itemId}:${weapons.knife.emoteId}> **${weapons.knife.name}**\n> Hunting becomes \`10%\` harder but you will gain an extra \`20%\` from the loot.`;
        }

        if (weapons.bow) {
            description += `\n\n<:${weapons.bow.itemId}:${weapons.bow.emoteId}> **${weapons.bow.name}**\n> Hunting with this weapon doesn't make it any easier or harder.`;
        }

        if (weapons.hunting_rifle) {
            description += `\n\n<:${weapons.hunting_rifle.itemId}:${weapons.hunting_rifle.emoteId}> **${weapons.hunting_rifle.name}**\n> Hunting becomes \`5%\` easier but you will lose \`15%\` from the loot.`;
        }

        let weaponsEmbedIsActive = true;
        const weaponEmbed = new EmbedBuilder()
            .setTitle('Choose your hunting weapon')
            .setColor(client.config.embed.color as ColorResolvable)
            .setDescription(description);

        const weaponMessage = await interaction.reply({
            embeds: [weaponEmbed],
            components: [getWeaponSelect(weapons)],
            fetchReply: true,
        });

        const weaponCollector = weaponMessage.createMessageComponentCollector({
            filter: async (i) => filter(interaction, i),
            max: 1,
            time: 60_000,
            componentType: ComponentType.StringSelect,
        });

        weaponCollector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();
            const weaponId = interactionCollector.values[0] as keyof typeof weapons;
            const weapon = client.items.getById(weaponId);

            if (weapon === null) {
                weaponsEmbedIsActive = false;
                await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
                await interaction.editReply({
                    content: 'Something went wrong while trying to find the weapon you selected.',
                    embeds: [],
                    components: [],
                });
                return;
            }

            if (!client.items.hasInInventory(weapon.itemId, member)) {
                weaponsEmbedIsActive = false;
                await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
                await interaction.editReply({
                    content: `You need a <:${weapon.itemId}:${weapon.emoteId}> **${weapon.name}** to use this command. Use \`/shop buy item-id:${weapon.itemId}\` to buy a **${weapon.name}**.`,
                    embeds: [],
                    components: [],
                });
                return;
            }

            const locationEmbed = new EmbedBuilder()
                .setTitle('Choose a hunting location')
                .setColor(client.config.embed.color as ColorResolvable)
                .setDescription(
                    'You can choose where you want to hunt on animals. Be careful what you choose because it might cost you money!',
                )
                .addFields([
                    {
                        name: 'Public Hunting Area (EASY)',
                        value: "A safe place to hunt for animals. You won't find any large animals here...",
                        inline: false,
                    },
                    {
                        name: 'The Forest (MEDIUM)',
                        value: "You can find expensive animals here but it's very dangerous to walk in the forest. You might lose your gun or die!",
                        inline: false,
                    },
                    {
                        name: 'The Zoo (HARD)',
                        value: 'You can find the most exotic animals here but there is a big chance you will be fined for this illegal activity.',
                        inline: false,
                    },
                ]);

            let locationEmbedIsActive = true;
            weaponsEmbedIsActive = false;
            const message = await interaction.editReply({
                embeds: [locationEmbed],
                components: [getRow()],
            });

            const collector = message.createMessageComponentCollector({
                filter: async (i) => filter(interaction, i),
                max: 1,
                time: 60_000,
                componentType: ComponentType.Button,
            });

            collector.on('collect', async (iCollector) => {
                locationEmbedIsActive = false;
                await iCollector.deferUpdate();
                if (getRandomNumber(1, 100) <= 4) {
                    await client.items.removeItem(weapon.itemId, member);
                    await interaction.editReply({
                        content: `Oh No! Your <:${weapon.itemId}:${weapon.emoteId}> **${weapon.name}** broke... You have to buy a new **${weapon.name}**. Use \`/shop buy item-id:${weapon.itemId}\` to buy a **${weapon.name}**.`,
                        embeds: [],
                        components: [],
                    });
                    return;
                }

                const difficulty = iCollector.customId.split('_')[1] as keyof typeof huntData;
                const category = huntData[difficulty];

                const extraFailChance = weapon.itemId === 'knife' ? 10 : weapon.itemId === 'hunting_rifle' ? -5 : 0;
                const extraMoney = weapon.itemId === 'knife' ? 1.2 : weapon.itemId === 'hunting_rifle' ? 0.85 : 1;

                if (getRandomNumber(1, 100) <= category.fail.risk + extraFailChance) {
                    let fine = 0;

                    if (category.fail.fine.max > 0) {
                        fine = getRandomNumber(category.fail.fine.min, category.fail.fine.max);
                        await removeMoney(interaction.user.id, fine);
                    }

                    if (category.fail.looseRequiredItem) {
                        await client.items.removeItem(weapon.itemId, member);
                    }

                    const embed = new EmbedBuilder()
                        .setAuthor({
                            name: `Hunt of ${interaction.user.username}`,
                            iconURL: interaction.user.displayAvatarURL(),
                        })
                        .setColor(client.config.embed.color as ColorResolvable)
                        .setDescription(category.fail.message.replace('%AMOUNT%', fine.toString()));
                    await interaction.editReply({ embeds: [embed], components: [] });
                    return;
                }

                const range = category.success.amount;
                const quantity =
                    range.max === 0 || range.max <= range.min ? range.min : getRandomNumber(range.min, range.max);
                const reward = getRandomItems(category.success.loot, quantity);

                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: `Hunt of ${interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL(),
                    })
                    .setColor(client.config.embed.color as ColorResolvable);

                let lootText = '';
                let totalPrice = 0;
                let totalAnimals = 0;

                for (const [itemId, amount] of Object.entries(reward)) {
                    const item = client.items.getById(itemId);
                    if (!item?.sellPrice) continue;

                    lootText += `${amount}x ${item.name} <:${item.itemId}:${item.emoteId}> ― :coin: ${Math.floor(
                        item.sellPrice * amount,
                    )}\n`;
                    totalPrice += Math.floor(item.sellPrice * amount);
                    totalAnimals += amount;
                }

                totalPrice = Math.floor(totalPrice * extraMoney);
                if (lootText.length > 0 && totalPrice > 0) {
                    embed.addFields({ name: 'Animals Hunted', value: lootText, inline: false });
                    embed.setDescription('>>> ' + category.success.message.replace('%AMOUNT%', `${totalPrice}`));
                } else {
                    embed.setDescription(">>> You didn't find any animals...");
                }

                await interaction.editReply({ embeds: [embed], components: [] });
                if (lootText.length > 0 && totalPrice > 0) {
                    await addExperience(member);
                    await addMoney(interaction.user.id, totalPrice);
                    await UserStats.updateOne(
                        { id: interaction.user.id },
                        { $inc: { animalsKilled: totalAnimals } },
                        { upsert: true },
                    );

                    await client.achievement.sendAchievementMessage(
                        interaction,
                        interaction.user.id,
                        client.achievement.getById('animal_hunter'),
                    );
                }
            });

            collector.on('end', async () => {
                if (locationEmbedIsActive) await interaction.editReply({ components: [getRow(true)] });
            });
        });

        weaponCollector.on('end', async () => {
            if (weaponsEmbedIsActive) await interaction.editReply({ components: [getWeaponSelect(weapons, true)] });
        });
    },
} satisfies Command;
