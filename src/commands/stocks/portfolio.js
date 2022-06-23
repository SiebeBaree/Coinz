const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js');
const stocksSchema = require('../../database/schemas/stocks');
const guildUserSchema = require('../../database/schemas/guildUsers');
const itemsPerPage = 3;

async function createEmbed(client, interaction, category, stocks, currentPage, maxPages) {
    let embed = new MessageEmbed()
        .setAuthor({ name: `Portfolio of ${interaction.member.nickname || interaction.member.user.username}`, iconURL: `${interaction.member.avatarURL() || client.config.embed.defaultIcon}` })
        .setColor(client.config.embed.color)
        .setFooter({ text: `Page ${currentPage + 1} of ${maxPages}.` })
    embed = await createPortfolioField(client, embed, stocks[category], currentPage);
    return embed;
}

async function createPortfolioField(client, embed, stocks, currentPage) {
    if (stocks === undefined) {
        embed.setDescription("You don't have any assets of this category.");
        return embed;
    }

    for (let i = 0; i < stocks.length; i++) {
        if (i >= currentPage * itemsPerPage && i < currentPage * itemsPerPage + itemsPerPage) {
            const currentlyWorth = parseInt(stocks[i].price * stocks[i].quantity);
            const change = calculateChange(client, stocks[i].buyPrice, currentlyWorth);
            embed.addField(`${stocks[i].fullName} (${stocks[i].ticker})`, `:1234: **Total Quantity:** ${stocks[i].quantity}x\n:money_with_wings: **Total Buy Price:** :coin: ${stocks[i].buyPrice}\n:moneybag: **Currently Worth:** :coin: ${currentlyWorth}\n${change.icon} **Total Change:** :coin: ${currentlyWorth - stocks[i].buyPrice} | ${change.changePercentage}%`, false);
        }
    }
    return embed;
}

function calculateChange(client, buyPrice, currentPrice) {
    let icon = ":chart_with_upwards_trend:"
    let changePercentage = client.calc.roundNumber(((currentPrice - buyPrice) / buyPrice * 100), 2);
    if (changePercentage < 0) icon = ":chart_with_downwards_trend:";
    return { icon: icon, changePercentage: changePercentage };
}

async function getStocks(interaction, category) {
    let allStocks = await guildUserSchema.findOne({ "stocks.type": category, guildId: interaction.guildId, userId: interaction.member.id }).select("stocks");
    let sortedStocks = {};

    for (let i = 0; i < allStocks.stocks.length; i++) {
        let stock = await stocksSchema.findOne({ ticker: allStocks.stocks[i].ticker });

        if (sortedStocks[stock.type] === undefined) {
            sortedStocks[stock.type] = [];
        }

        stock.buyPrice = allStocks.stocks[i].buyPrice;
        stock.quantity = allStocks.stocks[i].quantity;
        sortedStocks[stock.type].push(stock);
    }

    return sortedStocks;
}

function createSelectMenu(defaultLabel, disabled = false) {
    let options = [
        { label: 'Stocks', value: 'Stock' },
        { label: 'Crypto', value: 'Crypto' }
    ]

    for (let i = 0; i < options.length; i++) {
        if (options[i].value === defaultLabel) {
            options[i].default = true;
        }
    }

    const selectMenu = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId('selectCategoryPortfolio')
                .setPlaceholder('The interaction has ended')
                .setDisabled(disabled)
                .addOptions(options),
        );
    return selectMenu;
}

function calculateMaxPages(stocks) {
    if (stocks === undefined) {
        return 0;
    } else {
        return Math.ceil(stocks.length / itemsPerPage)
    }
}

module.exports.execute = async (client, interaction, data) => {
    await interaction.deferReply();
    let category = "Stock";
    const allStocks = await getStocks(interaction, category);
    let maxPages = calculateMaxPages(allStocks[category]);
    let currentPage = 0;

    await interaction.editReply({ embeds: [await createEmbed(client, interaction, category, allStocks, currentPage, maxPages)], components: [createSelectMenu(category), client.tools.setListButtons(currentPage, maxPages)] });
    const interactionMessage = await interaction.fetchReply();

    const filter = async (i) => {
        if (i.member.id === interaction.member.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, max: 25, idle: 15000, time: 90000 });

    collector.on('collect', async (interactionCollector) => {
        if (interactionCollector.componentType.toUpperCase() === "BUTTON") {
            if (interactionCollector.customId === 'toLastPage') currentPage = maxPages - 1;
            else if (interactionCollector.customId === 'toFirstPage') currentPage = 0;
            else if (interactionCollector.customId === 'toNextPage') currentPage++;
            else if (interactionCollector.customId === 'toPreviousPage') currentPage--;
        } else if (interactionCollector.componentType.toUpperCase() === "SELECT_MENU") {
            category = interactionCollector.values[0];
            maxPages = calculateMaxPages(allStocks[category]);
            currentPage = 0;
        }

        await interactionCollector.deferUpdate();
        await interaction.editReply({ embeds: [await createEmbed(client, interaction, category, allStocks, currentPage, maxPages)], components: [createSelectMenu(category), client.tools.setListButtons(currentPage, maxPages)] });
    })

    collector.on('end', async (interactionCollector) => {
        await interaction.editReply({ components: [createSelectMenu("", true), client.tools.setListButtons(currentPage, maxPages, true)] });
    })
}

module.exports.help = {
    name: "portfolio",
    description: "Check all your gains in your portfolio.",
    options: [],
    category: "stocks",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}