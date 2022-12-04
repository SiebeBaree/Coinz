import Command from '../../structures/Command.js'
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import { checkItem, takeItem, addMoney, takeMoney } from '../../lib/user.js'
import { randomNumber, getRandomLoot } from '../../lib/helpers.js'
import { createMessageComponentCollector } from '../../lib/embed.js'
import huntData from '../../assets/loot/hunt.json' assert { type: "json" }

export default class extends Command {
    info = {
        name: "hunt",
        description: "Hunt for animals and get money selling their meat and skin.",
        options: [],
        category: "economy",
        extraFields: [],
        cooldown: 900,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    lootQuantity = {
        "easy": [2, 5],
        "medium": [2, 3],
        "hard": [1, 2]
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        if (!await checkItem(data.user.inventory, "hunting_rifle")) {
            await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            return await interaction.reply({ content: "You need a hunting rifle to use this command. Use `/shop buy item-id:hunting_rifle` to buy a hunting rifle.", ephemeral: true });
        }
        await interaction.deferReply();

        let finishedCommand = false;

        const preEmbed = new EmbedBuilder()
            .setAuthor({ name: `Hunt of ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
            .setColor(bot.config.embed.color)
            .setDescription(`You can choose where you want to hunt on animals. Be careful what you choose because it might cost you money!`)
            .addFields(
                { name: `Public Hunting Area (easy)`, value: `A safe place to hunt for animals. You won't find any large animals here...`, inline: false },
                { name: `The Forest (medium)`, value: `You can find expensive animals here but it's very dangerous to walk in the forest. You might lose your gun or die!`, inline: false },
                { name: `The Zoo (hard)`, value: `You can find the most exotic animals here but there is a big chance you will be fined for this illegal activity.`, inline: false }
            )

        const interactionMessage = await interaction.editReply({ embeds: [preEmbed], components: [this.getRow()], fetchReply: true });
        const collector = createMessageComponentCollector(interactionMessage, interaction, { time: 30000 });

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();

            if (!finishedCommand) {
                finishedCommand = true;

                if (interactionCollector.customId.startsWith('hunt_')) {
                    if (randomNumber(1, 100) <= 4) {
                        await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
                        await takeItem(interaction.member.id, "hunting_rifle", data.user.inventory, 1);
                        return await interaction.editReply({ content: "Oh No! Your Hunting Rifle broke... You have to buy a new hunting rifle. Use `/shop buy item-id:hunting_rifle` to buy a hunting rifle.", embeds: [], components: [] });
                    }

                    const location = interactionCollector.customId.replace('hunt_', '');
                    const huntCategory = huntData[location];

                    if (randomNumber(1, 100) <= huntCategory.risk) {
                        let failReward = 0;
                        if (huntCategory.failReward[0] > 0) {
                            failReward = randomNumber(...huntCategory.failReward);
                            await takeMoney(interaction.member.id, failReward, true);
                        }

                        if (location !== "easy") await takeItem(interaction.member.id, "hunting_rifle", data.user.inventory, 1);

                        let embed = new EmbedBuilder()
                            .setAuthor({ name: `Hunt of ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
                            .setColor(bot.config.embed.color)
                            .setDescription(huntCategory.failMessage.replace("%AMOUNT%", `${failReward}`))
                        return await interaction.editReply({ embeds: [embed], components: [] });
                    }

                    const lootTable = huntCategory.loot;
                    const loot = getRandomLoot(lootTable, this.lootQuantity[location][0], this.lootQuantity[location][1]);

                    let mappedLoot = [];
                    for (let obj of loot) {
                        const index = mappedLoot.findIndex(item => item.itemId === obj.itemId);
                        if (index === -1) {
                            obj.quantity = 1;
                            mappedLoot.push(obj);
                        } else {
                            mappedLoot[index].quantity++;
                        }
                    }

                    let embed = new EmbedBuilder()
                        .setAuthor({ name: `Hunt of ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
                        .setColor(bot.config.embed.color)

                    let lootText = "";
                    let totalPrice = 0;
                    for (let i = 0; i < mappedLoot.length; i++) {
                        lootText += `${mappedLoot[i].quantity}x ${mappedLoot[i].name} <:${mappedLoot[i].itemId}:${mappedLoot[i].emoteId}> ― :coin: ${parseInt(mappedLoot[i].sellPrice * mappedLoot[i].quantity)}\n`;
                        totalPrice += parseInt(mappedLoot[i].sellPrice * mappedLoot[i].quantity);
                    }

                    if (lootText.length > 0 && totalPrice > 0) {
                        embed.addFields({ name: "Animals Hunted", value: lootText, inline: false });
                        embed.setDescription(huntCategory.successMessage.replace("%AMOUNT%", `${totalPrice}`));
                        await addMoney(interaction.member.id, totalPrice);
                    }

                    await interaction.editReply({ embeds: [embed], components: [] });
                }
            }
        });

        collector.on('end', async (interactionCollector) => {
            if (!finishedCommand) {
                finishedCommand = true;
                await interaction.editReply({ components: [this.getRow(true)] });
            }
        });
    }

    getRow(disabled = false) {
        const row = new ActionRowBuilder().addComponents(
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
                .setDisabled(disabled)
        );
        return row;
    }
}