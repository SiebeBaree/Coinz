import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, ComponentType, PermissionsBitField } from "discord.js"
import { fetchItem, fetchMember } from "./database.js"
import Guild from "../models/Guild.js"
import Member from "../models/Member.js"
import rewards from "../assets/loot/airdrop.json" assert { type: "json" }
const keys = Object.keys(rewards);

export const processAirdrop = async (guildData) => {
    const guild = await bot.guilds.fetch(guildData.id);
    if (!guild) return await resetAirdrop(guildData.id);
    const channel = await guild.channels.fetch(guildData.airdropChannel);

    if (!guild.members.me.permissions.has(PermissionsBitField.Flags.SendMessages) || !guild.members.me.permissionsIn(channel).has(PermissionsBitField.Flags.SendMessages)) {
        return await resetAirdrop(guildData.id);
    }

    await Guild.updateOne(
        { id: guildData.id },
        { $set: { airdropNext: parseInt(Date.now() / 1000) + randomNumber(3600, 7200) } },
        { upsert: true }
    );

    const loot = getRewards(randomNumber(1, 3));
    let mappedLoot = loot.reduce((cnt, cur) => (cnt[cur] = cnt[cur] + 1 || 1, cnt), {});
    let mappedKeys = Object.keys(mappedLoot);

    let rewardsText = "";
    let totalMoney = 0;
    for (let i = 0; i < mappedKeys.length; i++) {
        if (mappedKeys[i].startsWith("money")) {
            totalMoney += parseInt(rewards[mappedKeys[i]] * mappedLoot[mappedKeys[i]]);
            rewardsText += `Money: :coin: ${rewards[mappedKeys[i]] * mappedLoot[mappedKeys[i]]}\n`;
        } else {
            const item = await fetchItem(mappedKeys[i]);
            rewardsText += `${rewards[mappedKeys[i]] * mappedLoot[mappedKeys[i]]}x **${item.name}** <:${item.itemId}:${item.emoteId}>\n`;
        }
    }
    if (rewardsText === "") rewardsText = "Oh no! The loot was destroyed on impact.";

    const embed = new EmbedBuilder()
        .setTitle("A new Airdrop has landed!")
        .setColor(rewardsText === "" ? Colors.Red : Colors.Green)
        .setDescription(`Be the first to collect the airdrop.`)
        .addFields({ name: "Reward", value: rewardsText, inline: false })
        .setThumbnail("https://cdn.coinzbot.xyz/games/airdrop/airdrop.png")

    let message;
    try {
        message = await channel.send({ embeds: [embed], components: [getRow(rewardsText === "")] });
    } catch {
        return await resetAirdrop(guildData.id);
    }

    if (rewardsText === "") return;
    const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 180_000 });
    let buttonIsPressed = false;

    collector.on('collect', async (i) => {
        if (buttonIsPressed === false) {
            buttonIsPressed = true;
            const userId = i.member.id;

            let memberData = await fetchMember(userId);
            if (memberData.lastAirdrop === undefined) memberData.lastAirdrop = 0;
            if (parseInt(Date.now() / 1000) - memberData.lastAirdrop >= 3600) {
                const newEmbed = new EmbedBuilder()
                    .setTitle("The airdrop has been collected.")
                    .setColor(Colors.Red)
                    .setDescription(`:gift: <@${userId}> **collected this airdrop.**\n:airplane: **Next Airdrop:** 1-2 hours`)
                    .addFields({ name: "Rewards", value: rewardsText, inline: false })
                await message.edit({ embeds: [newEmbed], components: [getRow(true)] });

                await Member.updateOne({ id: userId }, { $set: { lastAirdrop: parseInt(Date.now() / 1000) } });
                if (totalMoney > 0) await Member.updateOne({ id: userId }, { $inc: { wallet: totalMoney } });

                for (let i = 0; i < mappedKeys.length; i++) {
                    if (mappedKeys[i].startsWith("money")) continue;
                    const userData = await fetchMember(userId);
                    await addItem(userId, mappedKeys[i], rewards[mappedKeys[i]] * mappedLoot[mappedKeys[i]], userData.inventory);
                }
            } else {
                buttonIsPressed = false;

                try {
                    const member = await bot.users.fetch(userId);
                    const dmChannel = await member.createDM();
                    await dmChannel.send({ content: `You already collected an airdrop in the last 60 minutes.` });
                    await member.deleteDM();
                } catch { }
            }
        }

        await i.deferUpdate();
    });

    collector.on('end', async (collected) => {
        if (buttonIsPressed === false) {
            buttonIsPressed = true;

            const newEmbed = new EmbedBuilder()
                .setTitle("The airdrop was not collected.")
                .setColor(Colors.Red)
                .setDescription(`:gift: **Nobody collected this airdrop**\n:airplane: **Next Airdrop:** 1-2 hours`)
                .addFields({ name: "Rewards", value: rewardsText, inline: false })
            await message.edit({ embeds: [newEmbed], components: [getRow(true)] });
        }
    });
};

const resetAirdrop = async (guildId) => {
    const guild = await Guild.findOne({ id: guildId });

    if (guild.airdropTries > 5) {
        await Guild.updateOne(
            { id: guildId },
            {
                $set: {
                    airdropNext: 0,
                    airdropChannel: "",
                    airdropStatus: false,
                    airdropTries: 0
                }
            },
            { upsert: true }
        );
    } else {
        await Guild.updateOne(
            { id: guildId },
            {
                $set: { airdropNext: parseInt(Date.now() / 1000) + randomNumber(1800, 3600) },
                $inc: { airdropTries: 1 }
            },
            { upsert: true }
        );
    }
};

const addItem = async (userId, itemId, quantity = 1, inventory = []) => {
    if (checkItem(inventory, itemId)) {
        await Member.updateOne({ id: userId, 'inventory.itemId': itemId }, {
            $inc: { 'inventory.$.quantity': quantity }
        });
    } else {
        await Member.updateOne({ id: userId }, {
            $push: {
                inventory:
                {
                    itemId: itemId,
                    quantity: quantity
                }
            },
        });
    }
};

const checkItem = (inventory, itemId, new_ = false) => {
    for (let i = 0; i < inventory.length; i++) {
        if (inventory[i].itemId === itemId) {
            return new_ === true ? inventory[i] : true;
        }
    }

    return false;
};

const getRewards = (amount) => {
    let rewards = [];
    for (let i = 0; i < amount; i++) rewards.push(keys[randomNumber(0, keys.length - 1)]);
    return rewards || ["tv"];
};

const randomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRow = (disable = false) => {
    const button = new ButtonBuilder()
        .setCustomId("airdrop_package")
        .setLabel("Collect the Airdrop")
        .setEmoji('<:airdrop:1012727932256518235>')

    if (disable) {
        button.setStyle(ButtonStyle.Danger);
        button.setDisabled(true);
    } else {
        button.setStyle(ButtonStyle.Success);
        button.setDisabled(false);
    }

    return new ActionRowBuilder().addComponents(button);
};

export default {
    processAirdrop
}