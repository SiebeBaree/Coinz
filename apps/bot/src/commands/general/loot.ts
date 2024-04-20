import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Colors, ComponentType } from 'discord.js';
import rooms from '../../data/rooms.json';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import type { InventoryItem } from '../../lib/types';
import { getLevel, getRandomNumber } from '../../utils';
import { addMoney, removeMoney } from '../../utils/money';

type IRoom = {
    items: InventoryItem[];
    money: number;
    totalPrice: number;
};

type GameData = {
    enteredRooms: (keyof typeof rooms)[];
    loot: IRoom;
    finishedCommand: boolean;
    lastDoors: (keyof typeof rooms)[];
};

const DOORS = 3;
const MAX_PRICE = 200;
const MAX_ROOMS = 7;

function getRows(gameData: GameData): ActionRowBuilder<ButtonBuilder>[] {
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const doors = new ActionRowBuilder<ButtonBuilder>();

    const newRooms = gameData.finishedCommand ? gameData.lastDoors : getNewRooms(gameData);
    for (const newRoom of newRooms) {
        doors.addComponents(
            new ButtonBuilder()
                .setCustomId(`loot_${newRoom}_${getRandomNumber(0, 1000)}}`)
                .setLabel(newRoom)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(gameData.finishedCommand),
        );
    }

    rows.push(doors);

    if (!gameData.finishedCommand) {
        gameData.lastDoors = newRooms;
    }

    const endRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('loot_end')
            .setLabel('Leave Building')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(gameData.finishedCommand),
    );
    rows.push(endRow);
    return rows;
}

function getRoomLoot(client: Bot, room: keyof typeof rooms, upperBound = MAX_PRICE): IRoom {
    let index = 0;
    const loot: IRoom = {
        items: [],
        money: 0,
        totalPrice: 0,
    };

    const items = rooms[room];
    const maxPrice = getRandomNumber(40, upperBound);
    while (loot.totalPrice < maxPrice && index < 12) {
        index++;

        if (Math.random() < 0.3) {
            const money = Math.floor(Math.random() * (upperBound / 2));
            loot.money += money;
            loot.totalPrice += money;
            continue;
        }

        const randomItemId = items[Math.floor(Math.random() * items.length)]!;
        const itemInLoot = loot.items.find((i) => i.itemId === randomItemId);

        if (itemInLoot === undefined) {
            loot.items.push({ itemId: randomItemId, amount: 1 });
        } else {
            itemInLoot.amount++;
        }

        const item = client.items.getById(randomItemId);
        loot.totalPrice += item?.sellPrice ?? item?.buyPrice ?? 0;
    }

    return loot;
}

function getNewRooms(gameData: GameData, amount = DOORS): (keyof typeof rooms)[] {
    const roomNames = Object.keys(rooms) as (keyof typeof rooms)[];
    const newRooms: (keyof typeof rooms)[] = [];

    let index = 0;
    do {
        const randomRoom = roomNames[Math.floor(Math.random() * roomNames.length)]!;

        if (
            gameData.enteredRooms.length === roomNames.length ||
            index > 7 ||
            !gameData.enteredRooms.includes(randomRoom)
        ) {
            newRooms.push(randomRoom);
        }

        index++;
    } while (newRooms.length < amount);

    return newRooms;
}

function getEmbed(client: Bot, gameData: GameData): EmbedBuilder {
    const loot: string[] = [];
    for (const lootItem of gameData.loot.items) {
        const item = client.items.getById(lootItem.itemId);
        if (item === null) continue;
        loot.push(
            `${lootItem.amount}x <:${item.itemId}:${item.emoteId}> **${item.name}** - :coin: ${
                lootItem.amount * (item.sellPrice ?? 0)
            }`,
        );
    }

    return new EmbedBuilder()
        .setTitle('Loot')
        .setDescription(
            gameData.finishedCommand
                ? "You've left the building."
                : 'Which door do you want to go through or do you just want to leave the building?',
        )
        .setColor(gameData.loot.money < 0 ? Colors.Red : gameData.finishedCommand ? Colors.Green : Colors.Orange)
        .addFields(
            { name: 'Loot', value: `${loot.length === 0 ? 'No loot found' : loot.join('\n')}`, inline: true },
            {
                name: 'Money',
                value: `:money_with_wings: **Money:** :coin: ${gameData.loot.money}\n:moneybag: **Loot Worth:** :coin: ${gameData.loot.totalPrice}`,
                inline: true,
            },
        );
}

function getFine(): number {
    return getRandomNumber(100, 450);
}

export default {
    data: {
        name: 'loot',
        description: 'Go and loot a building and steal items.',
        category: 'general',
        cooldown: 28800,
        extraFields: [
            {
                name: 'How does this command work?',
                value: 'You enter a building, and you can always select 1-3 doors to go into. In each room you can find items or money BUT there is also a 20% chance you get caught and have to pay a fine.',
                inline: false,
            },
        ],
    },
    async execute(client, interaction, member) {
        if (getLevel(member.experience) < 8) {
            await interaction.reply({ content: 'You need to be level 8 to use this command.', ephemeral: true });
            await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
            return;
        }

        if (member.wallet < 0) {
            await interaction.reply({
                content: 'You need a positive wallet balance to use this command.',
                ephemeral: true,
            });
            await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
            return;
        }

        const gameData: GameData = {
            enteredRooms: [],
            loot: {
                items: [],
                money: 0,
                totalPrice: 0,
            },
            finishedCommand: false,
            lastDoors: [],
        };

        const message = await interaction.reply({
            embeds: [getEmbed(client, gameData)],
            components: getRows(gameData),
            fetchReply: true,
        });
        const collector = message.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 45_000,
            max: MAX_ROOMS + 1,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (i) => {
            if (gameData.finishedCommand) return;

            if (i.customId === 'loot_end') {
                gameData.finishedCommand = true;
                collector.stop();
                await i.update({ embeds: [getEmbed(client, gameData)], components: getRows(gameData) });

                if (gameData.loot.items.length > 0) {
                    for (const item of gameData.loot.items) {
                        await client.items.addItem(item.itemId, member, item.amount);
                    }
                }

                if (gameData.loot.money > 0) {
                    await addMoney(member.id, gameData.loot.money);
                }

                await client.items.checkForDuplicates(member);
            } else if (i.customId.startsWith('loot_')) {
                if (getRandomNumber(1, 100) <= 20) {
                    gameData.finishedCommand = true;
                    collector.stop();

                    const fine = getFine();
                    gameData.loot.money = -fine;
                    gameData.loot.items = [];
                    gameData.loot.totalPrice = 0;

                    await i.update({ embeds: [getEmbed(client, gameData)], components: getRows(gameData) });
                    await interaction.followUp({ content: `You got caught and had to pay a fine of :coin: ${fine}.` });
                    await removeMoney(member.id, fine);
                    return;
                }

                const room = i.customId.split('_')[1] as keyof typeof rooms;
                const loot = getRoomLoot(client, room);
                gameData.enteredRooms.push(room);

                if (gameData.enteredRooms.length === MAX_ROOMS) {
                    gameData.finishedCommand = true;
                    collector.stop();

                    const fine = getFine();
                    gameData.loot.money = -fine;
                    gameData.loot.totalPrice = 0;
                    gameData.loot.items = [];

                    await i.update({ embeds: [getEmbed(client, gameData)], components: getRows(gameData) });
                    await interaction.followUp({ content: `You got caught and had to pay a fine of :coin: ${fine}.` });
                    await removeMoney(member.id, fine);
                } else {
                    // add loot to gameData but check if the item is already in the loot
                    for (const item of loot.items) {
                        const itemInLoot = gameData.loot.items.find((invItem) => invItem.itemId === item.itemId);

                        if (itemInLoot === undefined) {
                            gameData.loot.items.push(item);
                        } else {
                            itemInLoot.amount += item.amount;
                        }
                    }

                    gameData.loot.money += loot.money;
                    gameData.loot.totalPrice += loot.totalPrice;
                    await i.update({ embeds: [getEmbed(client, gameData)], components: getRows(gameData) });
                }
            }
        });

        collector.on('end', async () => {
            if (!gameData.finishedCommand) {
                gameData.finishedCommand = true;

                const fine = getFine();
                gameData.loot.money = -fine;
                gameData.loot.totalPrice = 0;
                gameData.loot.items = [];

                await interaction.editReply({ embeds: [getEmbed(client, gameData)], components: getRows(gameData) });
                await interaction.followUp({
                    content: `You took too long and got caught. You had to pay a fine of :coin: ${fine}.`,
                });
                await removeMoney(member.id, fine);
            }
        });
    },
} satisfies Command;
