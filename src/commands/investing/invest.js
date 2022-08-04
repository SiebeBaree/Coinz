const Command = require('../../structures/Command.js');
const { EmbedBuilder, ApplicationCommandOptionType, Colors, ComponentType } = require('discord.js');
const StockModel = require('../../models/Stock');
const MemberModel = require('../../models/Member');
const moment = require('moment-timezone');
const market = require('../../assets/stockData.json');

const timezone = "America/New_York";
const dateFormat = "DD/MM/YYYY";
const timeFormat = "HH:mm";
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const maxOwnedStock = 50000000;
const maxPurchase = 1000000;
const itemsPerPage = 5;

class Invest extends Command {
    info = {
        name: "invest",
        description: "Buy, sell or get info about an investment.",
        options: [
            {
                name: 'info',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get info about an investment.',
                options: [
                    {
                        name: 'ticker',
                        type: ApplicationCommandOptionType.String,
                        description: 'The ticker of the investment you want to get info about.',
                        required: false
                    }
                ]
            },
            {
                name: 'buy',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Invest your money.',
                options: [
                    {
                        name: 'ticker',
                        type: ApplicationCommandOptionType.String,
                        description: 'The ticker of the investment you want to buy.',
                        required: true
                    },
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Integer,
                        description: 'How much you want to buy. Use 0 to buy fractional.',
                        required: false,
                        min_value: 0,
                        max_value: 5000
                    },
                    {
                        name: 'price',
                        type: ApplicationCommandOptionType.Integer,
                        description: 'How much money you want to spend on the investment.',
                        required: false,
                        min_value: 50,
                        max_value: 250000
                    }
                ]
            },
            {
                name: 'sell',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Sell an investment.',
                options: [
                    {
                        name: 'ticker',
                        type: ApplicationCommandOptionType.String,
                        description: 'The ticker of the investment you want to sell.',
                        required: true
                    },
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Number,
                        description: 'How much you want to sell.',
                        required: true,
                        min_value: 0,
                        max_value: maxOwnedStock
                    }
                ]
            }
        ],
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
        if (interaction.options.getSubcommand() === "info") return await this.execInfo(interaction, data);
        if (interaction.options.getSubcommand() === "buy") return await this.execBuy(interaction, data);
        if (interaction.options.getSubcommand() === "sell") return await this.execSell(interaction, data);
        return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${this.info.name}\`.`, ephemeral: true });
    }

    async execInfo(interaction, data) {
        const ticker = interaction.options.getString('ticker');

        if (ticker == null) {
            await interaction.deferReply();
            let category = "Stock";
            let stocks = await this.getInvestments(category);
            let maxPages = Math.ceil(stocks.length / itemsPerPage);
            let currentPage = 0;

            const createEmbed = (stocks, currentPage, maxPages) => {
                let stockStr = "";
                for (let i = 0; i < stocks.length; i++) {
                    if (i >= currentPage * itemsPerPage && i < currentPage * itemsPerPage + itemsPerPage) {
                        const change = bot.tools.calculateChange(stocks[i].price, stocks[i].previousClose);
                        stockStr += `• **${stocks[i].fullName}** (${stocks[i].ticker})\n> :coin: ${stocks[i].price} (${change.icon} ${change.changePercentage}%)\n\n`
                    }
                }

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `All Investments` })
                    .setColor(bot.config.embed.color)
                    .setDescription(`**More Info:** \`/${this.info.name} info <ticker>\`\n**Example:** \`/${this.info.name} info AAPL\`\n\n${stockStr}\nLast Updated: <t:${stocks[0].lastUpdated}:R>`)
                    .setFooter({ text: `Page ${currentPage + 1} of ${maxPages}.` })
                return embed;
            }

            const interactionMessage = await interaction.editReply({ embeds: [createEmbed(stocks, currentPage, maxPages)], components: [bot.tools.investingSelectMenu(category), bot.tools.pageButtons(currentPage, maxPages)], fetchReply: true });
            const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { max: 20, idle: 15000, time: 60000 });

            collector.on('collect', async (interactionCollector) => {
                await interactionCollector.deferUpdate();

                if (interactionCollector.componentType === ComponentType.Button) {
                    if (interactionCollector.customId === 'toLastPage') currentPage = maxPages - 1;
                    else if (interactionCollector.customId === 'toFirstPage') currentPage = 0;
                    else if (interactionCollector.customId === 'toNextPage') currentPage++;
                    else if (interactionCollector.customId === 'toPreviousPage') currentPage--;
                } else if (interactionCollector.componentType === ComponentType.SelectMenu) {
                    category = interactionCollector.values[0];
                    stocks = await this.getInvestments(category);
                    maxPages = Math.ceil(stocks.length / itemsPerPage);
                    currentPage = 0;
                }

                await interaction.editReply({ embeds: [createEmbed(stocks, currentPage, maxPages)], components: [bot.tools.investingSelectMenu(category), bot.tools.pageButtons(currentPage, maxPages)] });
            })

            collector.on('end', async (interactionCollector) => {
                await interaction.editReply({ components: [bot.tools.investingSelectMenu("", true), bot.tools.pageButtons(currentPage, maxPages, true)] });
            })
        } else {
            let stock = await bot.database.fetchStock(ticker.toUpperCase());
            if (stock == null) return await interaction.reply({ content: `Sorry we don't know any investment with ticker \`${ticker.toUpperCase()}\`.\nPlease use \`/${this.info.name} info\` to get all investments.`, ephemeral: true });

            const isMarketOpen = () => {
                try {
                    const now = moment.tz(Date.now(), timezone);
                    const date = now.format(dateFormat);
                    const openDateTime = moment.tz(`${date} ${market.openingTime}`, dateTimeFormat, timezone);
                    const closeDateTime = moment.tz(`${date} ${market.closeTime}`, dateTimeFormat, timezone);

                    // [0, 6] === [ Sunday, Saturday ]
                    if (now.isBetween(openDateTime, closeDateTime) && !market.marketCloseDays.includes(parseInt(now.format("ddd"))) && ![0, 6].includes(now.day())) {
                        return true;
                    } else {
                        return false;
                    }
                } catch (e) {
                    return false;
                }
            }

            let marketStr = "";
            if (stock.type === "Stock") marketStr = `\n:radio_button: **Market:** ${isMarketOpen() ? 'Open' : 'Closed'}`;
            const change = bot.tools.calculateChange(stock.price, stock.previousClose);

            const embed = new EmbedBuilder()
                .setAuthor({ name: `${stock.type}: ${stock.fullName}` })
                .setColor(bot.config.embed.color)
                .setThumbnail(`https://cdn.coinzbot.xyz/ticker/${stock.ticker.toUpperCase()}.png`)
                .addFields(
                    { name: `Info`, value: `:envelope: **Type:** ${stock.type}\n:tickets: **Ticker:** ${stock.ticker}\n:apple: **Full Name:** ${stock.fullName}\n:clock1: **Last Updated:** <t:${stock.lastUpdated}:R>`, inline: true },
                    { name: `Stats`, value: `:moneybag: **Price:** :coin: ${stock.price}\n${change.icon} **Change:** ${change.changePercentage}%${marketStr}`, inline: true },
                )
            await interaction.reply({ embeds: [embed] });
        }
    }

    async execBuy(interaction, data) {
        const ticker = interaction.options.getString('ticker');
        let amount = interaction.options.getInteger('amount');
        let price = interaction.options.getInteger('price');

        if (price === null && amount === null) return await interaction.reply({ content: `You have to give an amount that you want to buy or price to buy fractional.`, ephemeral: true });
        if (price !== null && amount !== null) return await interaction.reply({ content: `You cannot buy an amount and give a price at the same time.`, ephemeral: true })

        let stock = await bot.database.fetchStock(ticker.toUpperCase());
        if (stock == null) return await interaction.reply({ content: `Sorry we don't know any investment with ticker \`${ticker.toUpperCase()}\`.\nPlease use \`/${this.info.name} info\` to get all investments.`, ephemeral: true });

        if (amount !== null) {
            price = Math.round(stock.price * amount);
        } else {
            amount = bot.tools.roundNumber(price / stock.price, 3);
        }

        if (price < 10) return await interaction.reply({ content: `You have to buy at least :coin: 10 at once.`, ephemeral: true });
        if (amount > maxOwnedStock) return await interaction.reply({ content: `You can't buy more than ${maxOwnedStock} items at once.`, ephemeral: true });
        if (price > maxPurchase) return await interaction.reply({ content: `You can't buy more than :coin: ${maxPurchase} at once.`, ephemeral: true });

        if (data.user.wallet < price) {
            const embed = new EmbedBuilder()
                .setTitle(`Not enough money`)
                .setColor(Colors.Red)
                .setDescription(`Trying to scam me? You don't have enough money in your wallet.`)
                .addFields(
                    { name: 'Total Price', value: `:coin: ${price}`, inline: true },
                    { name: 'Money In Wallet', value: `:coin: ${data.user.wallet}`, inline: true },
                    { name: 'Money Needed', value: `:coin: ${(price - data.user.wallet) || 1}`, inline: true }
                )
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        await interaction.deferReply();

        let userAlreadyHasStock = false;
        for (let i = 0; i < data.user.stocks.length; i++) {
            if (data.user.stocks[i].ticker === stock.ticker) {
                userAlreadyHasStock = true;
                break;
            }
        }

        if (userAlreadyHasStock) {
            await MemberModel.updateOne({ id: interaction.member.id, 'stocks.ticker': stock.ticker }, {
                $inc: {
                    'stocks.$.quantity': amount,
                    'stocks.$.buyPrice': price
                }
            });
        } else {
            await MemberModel.updateOne({ id: interaction.member.id }, {
                $push: {
                    stocks: {
                        ticker: stock.ticker,
                        quantity: amount,
                        buyPrice: price
                    }
                }
            });
        }
        await bot.tools.takeMoney(interaction.member.id, price)

        const embed = new EmbedBuilder()
            .setTitle(`You just bought ${amount}x ${stock.fullName}`)
            .setColor(bot.config.embed.color)
            .setThumbnail(`https://cdn.coinzbot.xyz/ticker/${stock.ticker.toUpperCase()}.png`)
            .addFields(
                { name: 'Info', value: `:envelope: **Type:** ${stock.type}\n:tickets: **Ticker:** ${stock.ticker}\n:apple: **Full Name:** ${stock.fullName}`, inline: true },
                { name: 'Stats', value: `:moneybag: **Unit Price:** :coin: ${stock.price}\n:1234: **Amount:** ${amount}x\n:gem: **Buy Price:** :coin: ${price}`, inline: true }
            )
        await interaction.editReply({ embeds: [embed] });
    }

    async execSell(interaction, data) {
        const ticker = interaction.options.getString('ticker');
        const amount = interaction.options.getNumber('amount');

        let stock = await bot.database.fetchStock(ticker.toUpperCase());
        if (stock == null) return await interaction.reply({ content: `Sorry we don't know any investment with ticker \`${ticker.toUpperCase()}\`.\nPlease use \`/${this.info.name} info\` to get all investments.`, ephemeral: true });
        await interaction.deferReply();

        let userHasStock = false;
        let stockData;
        for (let i = 0; i < data.user.stocks.length; i++) {
            if (data.user.stocks[i].ticker === stock.ticker) {
                if (data.user.stocks[i].quantity < amount) return await interaction.editReply({ content: `You only have ${data.user.stocks[i].quantity}x of ${stock.fullName}.` });
                userHasStock = true;
                stockData = data.user.stocks[i];
                break;
            }
        }

        if (!userHasStock) return await interaction.editReply({ content: `You don't own that investment.` });
        const price = Math.round(stock.price * amount);

        await MemberModel.updateOne({ id: interaction.member.id, 'stocks.ticker': stock.ticker }, {
            $inc: {
                'stocks.$.quantity': -amount,
                'stocks.$.buyPrice': -parseInt(amount / stockData.quantity * stockData.buyPrice)
            }
        });

        await bot.tools.addMoney(interaction.member.id, price)

        const embed = new EmbedBuilder()
            .setTitle(`You sold ${amount}x ${stock.fullName}`)
            .setColor(bot.config.embed.color)
            .setThumbnail(`https://cdn.coinzbot.xyz/ticker/${stock.ticker.toUpperCase()}.png`)
            .addFields(
                { name: 'Info', value: `:envelope: **Type:** ${stock.type}\n:tickets: **Ticker:** ${stock.ticker}\n:apple: **Full Name:** ${stock.fullName}`, inline: true },
                { name: 'Stats', value: `:moneybag: **Unit Price:** :coin: ${stock.price}\n:1234: **Amount:** ${amount}x\n:gem: **Sell Price:** :coin: ${price}`, inline: true }
            )
        await interaction.editReply({ embeds: [embed] });
    }

    async getInvestments(category) {
        return await StockModel.find({ type: category });
    }
}

module.exports = Invest;