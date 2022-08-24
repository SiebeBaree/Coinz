const Command = require('../../structures/Command.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } = require('discord.js');
const lootTable = require('../../assets/lootTables/fish.json').loot;
const StatsModel = require('../../models/Stats');

class Fish extends Command {
    info = {
        name: "fish",
        description: "Try and catch some fish that you can sell for money.",
        options: [],
        category: "economy",
        extraFields: [],
        cooldown: 900,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        if (!await bot.tools.checkItem(data.user.inventory, "fishing_rod")) {
            await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            return await interaction.reply({ content: "You need a fishing rod to use this command. Use `/shop buy item-id:fishing_rod` to buy a fishing rod.", ephemeral: true });
        }

        if (bot.tools.randomNumber(1, 100) <= 5) {
            await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            await bot.tools.takeItem(interaction.member.id, "fishing_rod", data.user.inventory, 1);
            return await interaction.reply({ content: "Oh No! Your Fishing Rod broke... You have to buy a new fishing rod. Use `/shop buy item-id:fishing_rod` to buy a fishing rod.", ephemeral: true });
        }
        await interaction.deferReply();

        let status = "too soon";
        let finishedCommand = false;

        let embed = new EmbedBuilder()
            .setAuthor({ name: `Fishing with ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
            .setColor(bot.config.embed.color)
            .setDescription(`Press the button below to fish. **ONLY PRESS IT WHEN THE BUTTON IS GREEN!**`)

        const interactionMessage = await interaction.editReply({ embeds: [embed], components: [this.getRow(status)], fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { time: 15000 });

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();

            if (!finishedCommand) {
                finishedCommand = true;

                if (interactionCollector.customId.startsWith('fish_')) {
                    if (status === "too soon") {
                        embed.setColor(Colors.Red);
                        embed.setDescription("You were too soon to catch some fish. Don't press the button until it's green!");
                    } else if (status === "ready") {
                        const loot = bot.tools.getRandomLoot(lootTable, 1, 5);

                        await StatsModel.updateOne(
                            { id: interaction.member.id },
                            { $inc: { catchedFish: loot.length } },
                            { upsert: true }
                        );

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

                        let lootText = "";
                        let totalPrice = 0;
                        for (let i = 0; i < mappedLoot.length; i++) {
                            lootText += `${mappedLoot[i].quantity}x ${mappedLoot[i].name} <:${mappedLoot[i].itemId}:${mappedLoot[i].emoteId}> ― :coin: ${parseInt(mappedLoot[i].sellPrice * mappedLoot[i].quantity)}\n`;
                            totalPrice += parseInt(mappedLoot[i].sellPrice * mappedLoot[i].quantity);
                        }

                        if (lootText.length > 0 && totalPrice > 0) {
                            embed.addFields({ name: "Loot", value: lootText, inline: false });
                            embed.setColor(Colors.Green);
                            embed.setDescription(`You caught some fish and sold it for :coin: ${totalPrice}.`);
                            await bot.tools.addMoney(interaction.member.id, totalPrice);
                        }
                    } else {
                        embed.setColor(Colors.Red);
                        embed.setDescription("You were too late to catch some fish. Be quicker next time!");
                    }

                    await interaction.editReply({ embeds: [embed], components: [this.getRow(status, true)] });
                }
            }
        });

        collector.on('end', async (interactionCollector) => {
            if (!finishedCommand) {
                finishedCommand = true;

                embed.setColor(Colors.Red);
                embed.setDescription("You were too late to catch some fish. Be quicker next time!");
                await interaction.editReply({ embeds: [embed], components: [this.getRow("too late", true)] });
            }
        });

        const seconds = bot.tools.randomNumber(5, 10);
        for (let i = 0; i < seconds; i++) await bot.tools.timeout(1000);

        if (!finishedCommand) {
            status = "ready";
            await interaction.editReply({ components: [this.getRow(status)] });
        } else {
            await bot.tools.timeout(1500);
            if (!finishedCommand) {
                finishedCommand = true;

                status = "too late";
                embed.setColor(Colors.Red);
                embed.setDescription("You were too late to catch some fish. Be quicker next time!");
                await interaction.editReply({ embeds: [embed], components: [this.getRow("too late", true)] });
            }
        }
    }

    getRow(status, disabled = false) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("fish_end")
                .setLabel("Reel in Fishing Rod")
                .setStyle(status === "too soon" ? ButtonStyle.Secondary : ((status === "ready") ? ButtonStyle.Success : ButtonStyle.Danger))
                .setDisabled(disabled || status === "too late")
        );
        return row;
    }
}

module.exports = Fish;