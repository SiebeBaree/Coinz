const Command = require('../../structures/Command.js');
const { EmbedBuilder } = require('discord.js');

class Info extends Command {
    info = {
        name: "guide",
        description: "Get a guide to help you get started with Coinz.",
        options: [],
        category: "misc",
        extraFields: [],
        cooldown: 0,
        enabled: true,
        memberRequired: false,
        deferReply: true
    };

    guides = {
        "general": [
            { name: "About Coinz", value: `Coinz is a global economy bot with a lot of unique features. You can use this bot to help your server get more active again or just to have fun. You can play a lot of different minigames in the bot to keep you busy for hours. If you want to find out what Coinz offers, please use the \`/help\` command.`, inline: false },
            { name: "First Time in Coinz", value: `The goal of Coinz is to have a fun time. But you also want to get rich. To do that you will have to hustle your way to the top. Try the \`economy\` or \`games\` category in the \`/help <category>\` command to start. These categories offer some commands to give you the initial boost you need to become the next Elon Musk.`, inline: false },
            { name: "Get more information about specific commands", value: `If you don't know how a commands works just use \`/help <command>\` and you will get a list of all possible arguments. Then try it out if you like. If you still don't know how to use it, please join our [support server](https://discord.gg/asnZQwc6kW).`, inline: false },
            { name: "Voting", value: `Coinz supports the voting on 2 websites. [Top.gg](https://top.gg/bot/938771676433362955) and [Discordbotlist.com](https://discordbotlist.com/bots/coinz). You can vote once every 12 hours on each website. By doing so you help Coinz grow even bigger without spending a single penny. In return we will give you a free spin on the lucky wheel per vote. (You can get 4x spins each day)`, inline: false }
        ],
        "investing": [
            { name: "What is a stock or crypto?", value: `A stock or crypto is an investment that can give or lose you a lot of money. Please be careful about what you buy.\n\nThe difference between a stock and a crypto currency is that a stock is older and more stable than a crypto currency like Bitcoin for example. Crypto currency is a digital asset with no physical form. This is a very new investment and is very volatile.`, inline: false },
            { name: "Does this feature use real money?", value: `No, you can't spend real money on Coinz at the moment. We plan to release a Premium subscription in the near future. Join our [support server](https://discord.gg/asnZQwc6kW) to stay tuned.`, inline: false },
            { name: "Are these real-time prices?", value: `Yes, we update the stocks twice each hour and we update the crypto prices every 5 minutes. Stocks are not updated when the market is not open. To check if the market is open please [check here](https://www.tradinghours.com/markets/nasdaq/hours).`, inline: false },
            { name: "Can you add X stock/crypto?", value: `To ask for a stock/crypto to be added, please join our [support server](https://discord.gg/asnZQwc6kW) and send a DM to our support bot. Please explain which stock/crypto you want us to add and why this is a good reason.`, inline: false }
        ],
        "farming": [
            { name: "How does this feature work?", value: `Farming is very simple, you can't forget to harvest the crops before they go rotten.\n\n(optional) **1.** Buy plots using \`/plot info\` and press the "Buy New Plot" button.\n**2.** Plant some seeds using \`/plot plant <plot-id> <crop>\` (You have to buy your seeds first in the shop. \`/shop list\`)\n(optional) **3.** Water your crops using \`/plot list\` and press the "Water" button.\n**4.** Harvest your crops before they go rotten using \`/plot list\` and press the "Harvest" button.\n**5.** Go back to step 1 and repeat the process.`, inline: false },
            { name: "Why can't I buy plots?", value: `You might not have enough money in your wallet to buy a new plot or you might be at the limit of buying new plots. You can only own 15 plots.`, inline: false },
            { name: "Future Plans", value: `We plan to expand this feature with tractors, fertilizer and so much more. If you want to speed up the development of this feature, please join our [support server](https://discord.gg/asnZQwc6kW) and send in more suggestions for this feature.`, inline: false }
        ],
        "company": [
            { name: "How to start a company?", value: `You can create a company with \`/company create <name>\`.\nYour company name needs to be unique in the entire bot.\nYou need :coin: 3000 in your wallet to create your own company`, inline: false },
            { name: "How do I get rich from my company?", value: `You can buy factories for your company and start producing items that you can sell for money. To witdraw the money from the company you will have to work using \`/work\`.`, inline: false },
            { name: "What do employees do?", value: `Employees give you more slots to buy factories. For each employee you will get 2 extra factory slots. You can also promote them and than they can start to produce items in your factory and manage the other employees.`, inline: false },
            { name: "I collected my products but didn't get money...", value: `This is correct. All collected products go into the inventory of your company. Check the inventory using \`/company inventory\`. You will see a button that says "Sell Inventory". If you press the button, it will sell all items and you can witdraw it by working.`, inline: false },
            { name: "Future Plans", value: `There is a lot planned for this feature. We can't say everything we plan to implement. If you have some suggestion please let us know by joining our [support server](https://discord.gg/asnZQwc6kW).`, inline: false }
        ]
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        await interaction.deferReply();
        let defaultLabel = "general";
        const interactionMessage = await interaction.editReply({ embeds: [this.getEmbed(defaultLabel)], components: [bot.tools.createSelectMenu(this.getSelectMenuOptions(), "guide_selectMenu", defaultLabel, false)], fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { max: 10, idle: 40_000, time: 90_000 });

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();

            defaultLabel = interactionCollector.values[0];
            await interaction.editReply({ embeds: [this.getEmbed(defaultLabel)], components: [bot.tools.createSelectMenu(this.getSelectMenuOptions(), "guide_selectMenu", defaultLabel, false)] });
        });

        collector.on('end', async (interactionCollector) => {
            await interaction.editReply({ components: [bot.tools.createSelectMenu(this.getSelectMenuOptions(), "guide_selectMenu", defaultLabel, true)] });
        });
    }

    getEmbed(label) {
        const embed = new EmbedBuilder()
            .setTitle(`${label.charAt(0).toUpperCase() + label.slice(1)} Guide`)
            .setColor(bot.config.embed.color)
            .setFooter({ text: bot.config.embed.footer })
            .setDescription(`:question: **If you still have a question please visit our** [**support server**](https://discord.gg/asnZQwc6kW)**!**\n:globe_with_meridians: **Don't forget to check out our** [**website**](${bot.config.website})**!**`)
            .addFields(this.guides[label])
        return embed;
    }

    getSelectMenuOptions() {
        return [
            { label: 'General', value: 'general' },
            { label: 'Investing', value: 'investing' },
            { label: 'Farming / Plots', value: 'farming' },
            { label: 'Companies', value: 'company' }
        ];
    }
}

module.exports = Info;