const Command = require('../../structures/Command.js');
const { EmbedBuilder, ComponentType } = require('discord.js');
const StockModel = require('../../models/Stock');
const MemberModel = require('../../models/Member');
const itemsPerPage = 3;

class Portfolio extends Command {
    info = {
        name: "portfolio",
        description: "Check all your progress in your portfolio.",
        options: [],
        category: "investing",
        extraFields: [],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 0,
        enabled: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        await interaction.deferReply();
        let category = "Stock";
        const allStocks = await this.getInvestments(interaction, category);
        let maxPages = this.calculateMaxPages(allStocks[category]);
        let currentPage = 0;

        const interactionMessage = await interaction.editReply({ embeds: [this.createEmbed(interaction, category, allStocks, currentPage, maxPages)], components: [bot.tools.investingSelectMenu(category), bot.tools.pageButtons(currentPage, maxPages)], fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { max: 25, idle: 15000, time: 90000 });

        collector.on('collect', async (interactionCollector) => {
            if (interactionCollector.componentType === ComponentType.Button) {
                if (interactionCollector.customId === 'toLastPage') currentPage = maxPages - 1;
                else if (interactionCollector.customId === 'toFirstPage') currentPage = 0;
                else if (interactionCollector.customId === 'toNextPage') currentPage++;
                else if (interactionCollector.customId === 'toPreviousPage') currentPage--;
            } else if (interactionCollector.componentType === ComponentType.SelectMenu) {
                category = interactionCollector.values[0];
                maxPages = this.calculateMaxPages(allStocks[category]);
                currentPage = 0;
            }

            await interactionCollector.deferUpdate();
            await interaction.editReply({ embeds: [this.createEmbed(interaction, category, allStocks, currentPage, maxPages)], components: [bot.tools.investingSelectMenu(category), bot.tools.pageButtons(currentPage, maxPages)] });
        })

        collector.on('end', async (interactionCollector) => {
            await interaction.editReply({ components: [bot.tools.investingSelectMenu("", true), bot.tools.pageButtons(currentPage, maxPages, true)] });
        })
    }

    async getInvestments(interaction, category) {
        let allStocks = await MemberModel.findOne({ "stocks.type": category, id: interaction.member.id }).select("stocks");
        let sortedStocks = {};

        for (let i = 0; i < allStocks.stocks.length; i++) {
            let stock = await StockModel.findOne({ ticker: allStocks.stocks[i].ticker });

            if (sortedStocks[stock.type] === undefined) {
                sortedStocks[stock.type] = [];
            }

            stock.buyPrice = allStocks.stocks[i].buyPrice;
            stock.quantity = allStocks.stocks[i].quantity;
            sortedStocks[stock.type].push(stock);
        }

        return sortedStocks;
    }

    createEmbed(interaction, category, stocks, currentPage, maxPages) {
        let embed = new EmbedBuilder()
            .setAuthor({ name: `Portfolio of ${interaction.member.nickname || interaction.member.user.username}`, iconURL: `${interaction.member.displayAvatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(bot.config.embed.color)
            .setFooter({ text: `Page ${currentPage + 1} of ${maxPages}.` })

        if (stocks[category] === undefined) {
            embed.setDescription("You don't have any assets of this category.");
            return embed;
        }

        for (let i = 0; i < stocks[category].length; i++) {
            if (i >= currentPage * itemsPerPage && i < currentPage * itemsPerPage + itemsPerPage) {
                const currentlyWorth = parseInt(stocks[category][i].price * stocks[category][i].quantity);
                const change = bot.tools.calculateChange(stocks[category][i].buyPrice, currentlyWorth);
                embed.addFields([
                    {
                        name: `${stocks[category][i].fullName} (${stocks[category][i].ticker})`,
                        value: `:1234: **Total Quantity:** ${stocks[category][i].quantity}x\n:money_with_wings: **Total Buy Price:** :coin: ${stocks[category][i].buyPrice}\n:moneybag: **Currently Worth:** :coin: ${currentlyWorth}\n${change.icon} **Total Change:** :coin: ${currentlyWorth - stocks[category][i].buyPrice} | ${change.changePercentage}%`,
                        inline: false
                    }
                ]);
            }
        }

        return embed;
    }

    calculateMaxPages(stocks) {
        return stocks === undefined ? 0 : Math.ceil(stocks.length / itemsPerPage);
    }
}

module.exports = Portfolio;