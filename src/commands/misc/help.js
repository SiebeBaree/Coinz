import Command from '../../structures/Command.js'
import { EmbedBuilder, ApplicationCommandOptionType, StringSelectMenuBuilder, ActionRowBuilder, ComponentType } from "discord.js"
import { createMessageComponentCollector } from '../../lib/embed.js'
import { msToTime } from '../../lib/helpers.js'
import { readFileSync } from 'fs';

export default class extends Command {
    info = {
        name: "help",
        description: "Get a list of all commands. To get more info about a specific command use `/help command <command>`.",
        options: [
            {
                name: 'command',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get more information about a specific command.',
                options: [
                    {
                        name: 'command',
                        type: ApplicationCommandOptionType.String,
                        description: 'The command you want to get more information about.',
                        required: true
                    }
                ]
            },
            {
                name: 'categories',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get all possible commands in a specific category.',
                options: []
            },
            {
                name: 'guide',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get a guide on how to use the bot.',
                options: [
                    {
                        name: 'topic',
                        type: ApplicationCommandOptionType.String,
                        description: 'The topic you want to get more information from.',
                        required: false,
                        choices: [
                            {
                                name: 'Getting Started',
                                value: 'general'
                            },
                            {
                                name: 'Business',
                                value: 'business'
                            },
                            {
                                name: 'Farming / Plots',
                                value: 'farming'
                            },
                            {
                                name: 'Investing',
                                value: 'investing'
                            }
                        ]
                    }
                ]
            },
            {
                name: 'loot',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get a list of all possible loot from a command.',
                options: [
                    {
                        name: 'command',
                        type: ApplicationCommandOptionType.String,
                        description: 'The command you want to get all possible loot from.',
                        required: true,
                        choices: [
                            {
                                name: 'Fish',
                                value: 'fish'
                            },
                            {
                                name: 'Hunt',
                                value: 'hunt'
                            }
                        ]
                    }
                ]
            },
        ],
        category: "misc",
        extraFields: [],
        cooldown: 0,
        enabled: true,
        memberRequired: false,
        deferReply: false
    };

    categories = [
        { name: "Miscellaneous", category: "misc", icon: ":wrench: " },
        { name: "Economy", category: "economy", icon: ":coin: " },
        { name: "Games", category: "games", icon: ":video_game: " },
        { name: "Business", category: "business", icon: ":office: " },
        { name: "Crop Farming", category: "farming", icon: ":seedling: " },
        { name: "Investing", category: "investing", icon: ":chart_with_upwards_trend: " },
    ];

    guides = {
        "general": [
            { name: "About Coinz", value: `Coinz is a global economy bot with a lot of unique features. You can use this bot to help your server get more active again or just to have fun. You can play a lot of different minigames in the bot to keep you busy for hours.`, inline: false },
            { name: "First Time in Coinz", value: `The goal of Coinz is to have a fun time. But you also want to get rich. To do that you will have to hustle your way to the top. Try the \`economy\` or \`games\` category in the </help categories:983096143439335467> command to start. These categories offer some commands to give you the initial boost you need to become the next Elon Musk.`, inline: false },
            { name: "Get more information about specific commands", value: `If you don't know how a commands works just use </help command:983096143439335467> and you will get a list of all possible arguments. Then try it out if you like. If you still don't know how to use it, please join our [support server](https://discord.gg/asnZQwc6kW).`, inline: false },
            { name: "Voting", value: `Coinz supports the voting on 2 websites. [Top.gg](https://top.gg/bot/938771676433362955) and [Discordbotlist.com](https://discordbotlist.com/bots/coinz). You can vote once every 12 hours on each website. By doing so you help Coinz grow even bigger without spending a single penny. In return we will give you a free spin on the lucky wheel per vote. (You can get 4x spins each day)`, inline: false }
        ],
        "investing": [
            { name: "What is a stock or crypto?", value: `A stock or crypto is an investment that can give or lose you a lot of money. Please be careful about what you buy.\n\nThe difference between a stock and a crypto currency is that a stock is older and more stable than a crypto currency like Bitcoin for example. Crypto currency is a digital asset with no physical form. This is a very new investment and is very volatile.`, inline: false },
            { name: "Does this feature use real money?", value: `No, you can't spend real money on Coinz at the moment. We plan to release a Premium subscription in the near future. Join our [support server](https://discord.gg/asnZQwc6kW) to stay tuned.`, inline: false },
            { name: "Are these real-time prices?", value: `Yes, we update the stocks twice each hour and we update the crypto prices every 3 minutes. Stocks are not updated when the market is not open. To check if the market is open please [check here](https://www.tradinghours.com/markets/nasdaq/hours).`, inline: false },
            { name: "Can you add X stock/crypto?", value: `To ask for a stock/crypto to be added, please join our [support server](https://discord.gg/asnZQwc6kW) and send a DM to our support bot. Please explain which stock/crypto you want us to add and why this is a good reason.`, inline: false }
        ],
        "farming": [
            { name: "How does this feature work?", value: `Farming is very simple, you can't forget to harvest the crops before they go rotten.\n\n(optional) **1.** Buy plots using </plot list:983096143284174865>> and press the "Buy New Plot" button.\n**2.** Plant some seeds using </plot plant:983096143284174865> (You have to buy your seeds first in the shop. </shop list:983096143284174861>)\n(optional) **3.** Water your crops using </plot list:983096143284174865> and press the "Water" button.\n**4.** Harvest your crops before they go rotten using </plot list:983096143284174865> and press the "Harvest" button.\n**5.** Go back to step 1 and repeat the process.`, inline: false },
            { name: "Why can't I buy plots?", value: `You might not have enough money in your wallet to buy a new plot or you might be at the limit of buying new plots. You can only own up to 9 plots, [premium members](https://coinzbot.xyz/store) can buy up to 15 plots.`, inline: false },
            { name: "Future Plans", value: `We plan to expand this feature with tractors, fertilizer and so much more. If you want to speed up the development of this feature, please join our [support server](https://discord.gg/asnZQwc6kW) and send in more suggestions for this feature.`, inline: false }
        ],
        "business": [
            { name: "How to start a company?", value: `You can create a company with </business create:1048340073470513155>.\nYour company name needs to be unique in the entire bot.\nYou need :coin: 2000 in your wallet to create your own company`, inline: false },
            { name: "How do I get rich from my company?", value: `You can buy factories for your company and start producing items that you can sell for money. To witdraw the money from the company you will have to work using </work:983096143284174864>.`, inline: false },
            { name: "What do employees do?", value: `Employees give you more slots to buy factories. For each employee you will get 2 extra factory slots. You can also promote them and than they can start to produce items in your factory and manage the other employees.`, inline: false },
            { name: "I collected my products but didn't get money...", value: `This is correct. All collected products go into the inventory of your company. Check the inventory using </business info:1048340073470513155> and go to the inventory page. To sell the inventory use </business sell-item:1048340073470513155>`, inline: false },
            { name: "Future Plans", value: `There is a lot planned for this feature in the future. We can't say everything we plan to implement. If you have some suggestion please let us know by joining our [support server](https://discord.gg/asnZQwc6kW).`, inline: false }
        ]
    };

    complexLootTables = ["hunt"];

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        if (interaction.options.getSubcommand() === "categories") return await this.execCategories(interaction, data);
        if (interaction.options.getSubcommand() === "command") return await this.execCommands(interaction, data);
        if (interaction.options.getSubcommand() === "guide") return await this.execGuide(interaction, data);
        if (interaction.options.getSubcommand() === "loot") return await this.execLoot(interaction, data);
        return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help command ${this.info.name}\`.`, ephemeral: true });
    }

    async execCategories(interaction, data) {
        let options = [
            { label: 'Miscellaneous', value: 'misc', emoji: '🔧' },
            { label: 'Economy', value: 'economy', emoji: '🪙' },
            { label: 'Games', value: 'games', emoji: '🎮' },
            { label: 'Business', value: 'business', emoji: '🏢' },
            { label: 'Crop Farming', value: 'farming', emoji: '🌱' },
            { label: 'Investing', value: 'investing', emoji: '📈' }
        ]

        // Populate the map with the key-value pairs from the array
        const map = new Map();
        options.forEach(obj => { map.set(obj.value, `${obj.emoji} ${obj.label}`); });

        const getSelectMenu = (defaultLabel, disabled = false) => {
            for (let i = 0; i < options.length; i++) {
                options[i].default = options[i].value === defaultLabel;
            }

            return new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("help-categories")
                        .setPlaceholder('The interaction has ended')
                        .setDisabled(disabled)
                        .addOptions(options),
                );
        }

        const getEmbed = (category) => {
            const embed = new EmbedBuilder()
                .setColor(bot.config.embed.color)
                .setFooter({ text: bot.config.embed.footer })
                .setAuthor({ name: `Commands for ${map.get(category, "🔧 Miscellaneous")}`, iconURL: `${bot.user.avatarURL() || bot.config.embed.defaultIcon}` })
                .setDescription(`:question: **Don't know where to begin? Use** </help guide:983096143439335467>\n:gear: **Visit our** [**support server**](https://discord.gg/asnZQwc6kW)**!**\n:bulb: **More info about a command: ** \`/help command [command]\``)

            this.categories.forEach(categoryObj => {
                if (categoryObj.category == category) {
                    let allCommands = [];
                    for (const num of bot.commands) {
                        if ((num[1].info.category).toLowerCase() == categoryObj.category && num[1].info.enabled) allCommands.push(`\`${num[1].info.name}\``);
                    }

                    embed.addFields([{ name: "Commands", value: allCommands.length ? allCommands.join(", ") : "No commmands found in this category.", inline: false }]);
                }
            });

            return embed;
        }

        let category = "misc";
        const message = await interaction.reply({ embeds: [getEmbed(category)], components: [getSelectMenu(category)], fetchReply: true });
        const collector = createMessageComponentCollector(message, interaction, { time: 60000, componentType: ComponentType.StringSelect });

        collector.on("collect", async (interaction) => {
            if (interaction.customId === "help-categories") {
                category = interaction.values[0];
                await interaction.update({ embeds: [getEmbed(category)], components: [getSelectMenu(category)] });
            }
        });

        collector.on("end", async (collected) => {
            await interaction.editReply({ components: [getSelectMenu(category, true)] });
        });
    }

    async execCommands(interaction, data) {
        const commandName = interaction.options.getString('command')?.toLowerCase();
        const command = bot.commands.get(commandName);
        if (!command) return await interaction.reply({ content: `Sorry, we couldn't find any category or command with the name \`${commandName}\`.`, ephemeral: true });
        await interaction.deferReply();

        const addNewUsage = (usage, commandName, type, optionsName, parameter, i) => {
            if (type === ApplicationCommandOptionType.Subcommand) {
                parameter = parameter.options;
                usage += `\`/${commandName} ${optionsName}`;
                for (let j = 0; j < parameter.length; j++) {
                    usage += `${parameter[j].required ? " <" : " ["}${parameter[j].name}${parameter[j].required ? ">" : "]"}`
                }
                usage += "`\n";
            } else {
                if (i === 0) usage += `\`/${commandName}`;
                usage += `${parameter.required ? " <" : " ["}${optionsName}${parameter.required ? ">" : "]"}`
            }

            return usage;
        };

        let options = command.info.options;
        let usage = "";
        for (let i = 0; i < options.length; i++) {
            if (options[i].type === ApplicationCommandOptionType.SubcommandGroup) {
                for (let j = 0; j < options[i].options.length; j++) {
                    usage = addNewUsage(usage, `${command.info.name} ${options[i].name}`, options[i].options[j].type, options[i].options[j].name, options[i].options[j], i);
                }
            } else {
                usage = addNewUsage(usage, command.info.name, options[i].type, options[i].name, options[i], i);
            }
        }

        usage = usage.trim();
        if (!usage.endsWith('`')) usage += "`";

        let embed = new EmbedBuilder()
            .setAuthor({ name: `Help: ${command.info.name}`, iconURL: `${bot.user.avatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(bot.config.embed.color)
            .setFooter({ text: bot.config.embed.footer })
            .setDescription(":question: **Don't know where to begin? Use** </help guide:983096143439335467>\n:gear: **Visit our** [**support server**](https://discord.gg/asnZQwc6kW)**!**")
            .addFields(
                { name: 'Description', value: command.info.description || "No Description.", inline: false },
                { name: 'Command Usage', value: `${usage === "`" ? `\`/${command.info.name}\`` : usage}`, inline: false },
                {
                    name: 'Cooldown',
                    value: command.info.cooldown > 0 ?
                        msToTime(command.info.cooldown * 1000) :
                        `**Default:** \`${bot.config.defaultTimeout}s\`\n**Premium:** \`1s\``,
                    inline: false
                }
            )

        if (command.info.extraFields !== undefined && command.info.extraFields.length > 0) {
            command.info.extraFields.forEach(field => {
                embed.addFields({ name: field.name, value: field.value, inline: field.inline });
            });
        }

        if (command.info.image !== undefined && command.info.image != "") {
            embed.setImage(command.info.image);
        }

        await interaction.editReply({ embeds: [embed] });
    }

    async execGuide(interaction, data) {
        const topic = interaction.options.getString('topic')?.toLowerCase() ?? "general";

        const embed = new EmbedBuilder()
            .setTitle(`${topic.charAt(0).toUpperCase() + topic.slice(1)} Guide`)
            .setColor(bot.config.embed.color)
            .setFooter({ text: bot.config.embed.footer })
            .setDescription(`:question: **If you still have a question please visit our** [**support server**](https://discord.gg/asnZQwc6kW)**!**\n:globe_with_meridians: **Don't forget to check out our** [**website**](${bot.config.website})**!**`)
            .addFields(this.guides[topic])
        await interaction.reply({ embeds: [embed] });
    }

    async execLoot(interaction, data) {
        await interaction.deferReply();
        const command = interaction.options.getString("command")?.toLowerCase();

        let embed = new EmbedBuilder()
            .setAuthor({ name: `Loot Table for ${command} command`, iconURL: `${bot.user.avatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(bot.config.embed.color)
            .setFooter({ text: bot.config.embed.footer })

        try {
            const lootTable = JSON.parse(readFileSync(`src/assets/loot/${command}.json`));

            if (this.complexLootTables.includes(command)) {
                const lootTableKeys = Object.keys(lootTable);

                for (let i = 0; i < lootTableKeys.length; i++) {
                    const lootCategory = lootTable[lootTableKeys[i]];

                    if (lootTableKeys[i] === "fail") {
                        embed.addFields({ name: `Fail (${lootCategory.chance}% Chance)`, value: "No Loot", inline: true });
                        continue;
                    }

                    let lootStr = "";
                    for (let j = 0; j < lootCategory.loot.length; j++) {
                        if (typeof lootCategory.loot[j] === "object") {
                            const item = lootCategory.loot[j];
                            lootStr += `<:${item.itemId}:${item.emoteId}> ${item.name} - :coin: ${item.sellPrice}\n`;
                        } else {
                            lootStr += `${lootCategory.loot[j]}\n`;
                        }
                    }

                    if (lootStr.length <= 0) lootStr = "No Loot";
                    embed.addFields({ name: `${lootTableKeys[i].toUpperCase()}${lootCategory.chance !== undefined ? ` (${lootCategory.chance}% Chance)` : ""}`, value: lootStr, inline: true });
                }
            } else {
                const lootArr = lootTable.loot;

                let lootStr = "";
                for (let i = 0; i < lootArr.length; i++) {
                    const item = lootArr[i];
                    lootStr += `<:${item.itemId}:${item.emoteId}> ${item.name} - :coin: ${item.sellPrice}\n`;
                }

                embed.addFields({ name: "Possible Loot", value: lootStr, inline: false });
            }

            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply({ content: "Sorry, we couldn't find a loot table for that command." });
        }
    }
}