import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Colors, ComponentType, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import rooms from "../../assets/rooms.json";
import InventoryItem from "../../interfaces/InventoryItem";
import Helpers from "../../utils/Helpers";
import Cooldown from "../../utils/Cooldown";
import User from "../../utils/User";

interface IRoom {
    items: InventoryItem[];
    money: number;
    totalPrice: number;
}

interface GameData {
    enteredRooms: (keyof typeof rooms)[];
    loot: IRoom;
    finishedCommand: boolean;
    lastDoors: (keyof typeof rooms)[];
}

export default class extends Command implements ICommand {
    readonly info = {
        name: "loot",
        description: "Go and loot a building and steal items.",
        options: [],
        extraFields: [
            { name: "How does this command work?", value: "You enter a building, and you can always select 1-3 doors to go into. In each room you can find items or money BUT there is also a 20% chance you get caught and have to pay a fine.", inline: false },
        ],
        category: "general",
        cooldown: 14400,
    };

    private readonly doors = 3;
    private readonly maxPrice = 200;
    private readonly maxRooms = 7;

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        if (User.getLevel(member.experience) < 3) {
            await interaction.reply({ content: "You need to be level 3 to use this command.", ephemeral: true });
            await Cooldown.removeCooldown(interaction.user.id, this.info.name);
            return;
        }

        if (member.wallet < 0) {
            await interaction.reply({ content: "You need a positive wallet balance to use this command.", ephemeral: true });
            await Cooldown.removeCooldown(interaction.user.id, this.info.name);
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

        const message = await interaction.reply({ embeds: [this.getEmbed(gameData)], components: this.getRows(gameData), fetchReply: true });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, time: 30_000, max: this.maxRooms + 1, componentType: ComponentType.Button });

        collector.on("collect", async (i) => {
            if (gameData.finishedCommand) return;

            if (i.customId === "loot_end") {
                gameData.finishedCommand = true;
                collector.stop();
                await i.update({ embeds: [this.getEmbed(gameData)], components: this.getRows(gameData) });

                if (gameData.loot.items.length > 0) {
                    for (const item of gameData.loot.items) {
                        await this.client.items.addItem(item.itemId, member, item.amount);
                    }
                }

                if (gameData.loot.money > 0) {
                    await User.addMoney(member.id, gameData.loot.money);
                }

                await this.client.items.checkForDuplicates(member);
            } else if (i.customId.startsWith("loot_")) {
                if (Helpers.getRandomNumber(1, 100) <= 20) {
                    gameData.finishedCommand = true;
                    collector.stop();

                    const fine = this.getFine();
                    gameData.loot.money = -fine;
                    gameData.loot.items = [];
                    gameData.loot.totalPrice = 0;

                    await i.update({ embeds: [this.getEmbed(gameData)], components: this.getRows(gameData) });
                    await interaction.followUp({ content: `You got caught and had to pay a fine of :coin: ${fine}.` });
                    await User.removeMoney(member.id, fine);
                    return;
                }

                const room = i.customId.split("_")[1] as keyof typeof rooms;
                const loot = this.getRoomLoot(room);
                gameData.enteredRooms.push(room);

                if (gameData.enteredRooms.length === this.maxRooms) {
                    gameData.finishedCommand = true;
                    collector.stop();

                    const fine = this.getFine();
                    gameData.loot.money = -fine;
                    gameData.loot.totalPrice = 0;
                    gameData.loot.items = [];

                    await i.update({ embeds: [this.getEmbed(gameData)], components: this.getRows(gameData) });
                    await interaction.followUp({ content: `You got caught and had to pay a fine of :coin: ${fine}.` });
                    await User.removeMoney(member.id, fine);
                } else {
                    // add loot to gameData but check if the item is already in the loot
                    for (const item of loot.items) {
                        const itemInLoot = gameData.loot.items.find((invItem) => invItem.itemId === item.itemId);

                        if (itemInLoot !== undefined) {
                            itemInLoot.amount += item.amount;
                        } else {
                            gameData.loot.items.push(item);
                        }
                    }

                    gameData.loot.money += loot.money;
                    gameData.loot.totalPrice += loot.totalPrice;
                    await i.update({ embeds: [this.getEmbed(gameData)], components: this.getRows(gameData) });
                }
            }
        });

        collector.on("end", async () => {
            if (!gameData.finishedCommand) {
                gameData.finishedCommand = true;

                const fine = this.getFine();
                gameData.loot.money = -fine;
                gameData.loot.totalPrice = 0;
                gameData.loot.items = [];

                await interaction.editReply({ embeds: [this.getEmbed(gameData)], components: this.getRows(gameData) });
                await interaction.followUp({ content: `You took too long and got caught. You had to pay a fine of :coin: ${fine}.` });
                await User.removeMoney(member.id, fine);
            }
        });
    }

    private getRows(gameData: GameData): ActionRowBuilder<ButtonBuilder>[] {
        const rows: ActionRowBuilder<ButtonBuilder>[] = [];
        const doors = new ActionRowBuilder<ButtonBuilder>();

        const newRooms = gameData.finishedCommand ? gameData.lastDoors : this.getNewRooms(gameData);
        for (let i = 0; i < newRooms.length; i++) {
            doors.addComponents(
                new ButtonBuilder()
                    .setCustomId(`loot_${newRooms[i]}_${Helpers.getRandomNumber(0, 1000)}}`)
                    .setLabel(newRooms[i])
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(gameData.finishedCommand),
            );
        }
        rows.push(doors);

        if (!gameData.finishedCommand) {
            gameData.lastDoors = newRooms;
        }

        const endRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("loot_end")
                    .setLabel("Leave Building")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(gameData.finishedCommand),
            );
        rows.push(endRow);
        return rows;
    }

    private getRoomLoot(room: keyof typeof rooms, upperBound = this.maxPrice): IRoom {
        let index = 0;
        const loot: IRoom = {
            items: [],
            money: 0,
            totalPrice: 0,
        };

        const items = rooms[room];
        const maxPrice = Helpers.getRandomNumber(40, upperBound);
        while (loot.totalPrice < maxPrice && index < 12) {
            index++;

            if (Math.random() < 0.3) {
                const money = Math.floor(Math.random() * (upperBound / 2));
                loot.money += money;
                loot.totalPrice += money;
                continue;
            }

            const randomItemId = items[Math.floor(Math.random() * items.length)];
            const itemInLoot = loot.items.find((i) => i.itemId === randomItemId);

            if (itemInLoot !== undefined) {
                itemInLoot.amount++;
            } else {
                loot.items.push({ itemId: randomItemId, amount: 1 });
            }

            const item = this.client.items.getById(randomItemId);
            loot.totalPrice += item?.sellPrice ?? item?.buyPrice ?? 0;
        }

        return loot;
    }

    private getNewRooms(gameData: GameData, amount = this.doors): (keyof typeof rooms)[] {
        const roomNames = Object.keys(rooms) as (keyof typeof rooms)[];
        const newRooms: (keyof typeof rooms)[] = [];

        let index = 0;
        do {
            const randomRoom = roomNames[Math.floor(Math.random() * roomNames.length)];

            if (gameData.enteredRooms.length === roomNames.length
                || index > 7
                || !gameData.enteredRooms.includes(randomRoom)) {
                newRooms.push(randomRoom);
            }
            index++;
        } while (newRooms.length < amount);

        return newRooms;
    }

    private getEmbed(gameData: GameData): EmbedBuilder {
        const loot = gameData.loot.items.map((i) => {
            const item = this.client.items.getById(i.itemId);
            if (item === null) return;
            return `${i.amount}x <:${item.itemId}:${item.emoteId}> **${item.name}** - :coin: ${i.amount * (item.sellPrice ?? 0)}`;
        });

        return new EmbedBuilder()
            .setTitle("Loot")
            .setDescription(gameData.finishedCommand ? "You've left the building." : "Which door do you want to go through or do you just want to leave the building?")
            .setColor(gameData.loot.money < 0 ? Colors.Red : (gameData.finishedCommand ? Colors.Green : Colors.Orange))
            .addFields(
                { name: "Loot", value: `${loot.length === 0 ? "No loot found" : loot.join("\n")}`, inline: true },
                { name: "Money", value: `:money_with_wings: **Money:** :coin: ${gameData.loot.money}\n:moneybag: **Loot Worth:** :coin: ${gameData.loot.totalPrice}`, inline: true },
            );
    }

    private getFine(): number {
        return Helpers.getRandomNumber(100, 450);
    }
}