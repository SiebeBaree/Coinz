const Command = require('../../structures/Command.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandOptionType } = require('discord.js');
const MemberModel = require('../../models/Member');

class Plot extends Command {
    info = {
        name: "plot",
        description: "Plant or get a list of your plots.",
        options: [
            {
                name: 'list',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get a list with information about all your plots.',
                options: []
            },
            {
                name: 'plant',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Plant a new crop on your plots.',
                options: [
                    {
                        name: 'plot-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The plot ID of where you want to plant. Use , or - to plant on more than one plot.',
                        required: true
                    },
                    {
                        name: 'crop',
                        type: ApplicationCommandOptionType.String,
                        description: 'What crop you want to plant. Use "/shop list" to check all available crops.',
                        required: true
                    }
                ]
            }
        ],
        category: "farming",
        extraFields: [],
        cooldown: 0,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        if (interaction.options.getSubcommand() === "list") return await this.execList(interaction, data);
        if (interaction.options.getSubcommand() === "plant") return await this.execPlant(interaction, data);
        return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${this.info.name}\`.`, ephemeral: true });
    }

    async execList(interaction, data) {
        await interaction.deferReply();
        const interactionMessage = await interaction.editReply({ embeds: [await this.createEmbed(interaction, data)], components: [this.createRow(await this.calcBtns(data))], fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { max: 15, idle: 15000, time: 60000 });

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();
            if (interactionCollector.customId === 'plot_harvest') {
                for (let i = 0; i < data.user.plots.length; i++) {
                    if (data.user.plots[i].status === "harvest" || data.user.plots[i].status === "rotten") {
                        if (data.user.plots[i].status === "harvest") {
                            data.user = await bot.database.fetchMember(interaction.member.id);
                            await bot.tools.addItem(interaction.member.id, data.user.plots[i].crop, 6, data.user.inventory);
                        }

                        data.user.plots[i].status = "empty";
                        await MemberModel.updateOne({ id: interaction.member.id, 'plots.plotId': data.user.plots[i].plotId }, {
                            $set: { 'plots.$.status': "empty" }
                        });
                    }
                }
            } else if (interactionCollector.customId === 'plot_water') {
                await this.waterPlots(interaction, data);
                data.user = await bot.database.fetchMember(interaction.member.id);
            } else if (interactionCollector.customId === 'plot_buy') {
                await this.buyPlot(interaction, data);
                data.user = await bot.database.fetchMember(interaction.member.id);
            }

            await interaction.editReply({ embeds: [await this.createEmbed(interaction, data)], components: [this.createRow(await this.calcBtns(data))] });
        });

        collector.on('end', async (interactionCollector) => {
            await interaction.editReply({ components: [this.createRow([true, true, true])] });
        });
    }

    async execPlant(interaction, data) {
        const plotId = interaction.options.getString('plot-id');
        const cropType = interaction.options.getString('crop');

        const plots = this.getPlots(plotId);
        if (plots.length <= 0) return await interaction.reply({ content: `That are not valid plots.`, ephemeral: true });
        if (Math.max(...plots) > data.user.plots.length) return await interaction.reply({ content: `You don't own a plot with id \`${Math.max(...plots)}\`.`, ephemeral: true });
        const cropItem = await bot.database.fetchItem(cropType.toLowerCase());
        if (cropItem == null) return await interaction.reply({ content: `\`${cropType.toLowerCase()}\` is not a valid crop. Use </shop list:983096143284174861> to view all crops.`, ephemeral: true });
        await interaction.deferReply();

        for (let i = 0; i < plots.length; i++) {
            await MemberModel.updateOne({ id: interaction.member.id, 'plots.plotId': plots[i] - 1 }, {
                $set: {
                    'plots.$.status': "growing",
                    'plots.$.harvestOn': parseInt(Date.now() / 1000) + cropItem.duration,
                    'plots.$.crop': cropItem.itemId
                }
            });
        }
        if (!await bot.tools.takeItem(interaction.member.id, cropItem.itemId, data.user.inventory, plots.length)) return await interaction.editReply({ content: `You don't have that crop in your inventory. Please buy a crop with </shop buy:983096143284174861>.` });
        await interaction.editReply({ content: `You successfully planted \`${cropItem.name}\` on plot ${plotId}` });
    }

    createVisualRow(element) {
        return element.repeat(6);
    }

    calcPlotPrice(plots) {
        return plots * 2000 + 3000;
    }

    async createEmbed(interaction, data) {
        const userPlots = data.user.plots;
        let waterTxt = `You can water your plots.`;
        let buyPlot = ``;
        if (data.user.lastWater + 14400 > parseInt(Date.now() / 1000)) waterTxt = `You can water your plots again in ${bot.tools.msToTime(((data.user.lastWater + 14400) * 1000) - Date.now())}.`;
        if (data.user.plots.length < 15) buyPlot = `\n:moneybag: **To buy a new plot you will need :coin: ${this.calcPlotPrice(data.user.plots.length)} in your wallet.**`;

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.member.displayName || interaction.member.username}'s farm`)
            .setColor(bot.config.embed.color)
            .setDescription(`:seedling: **Use** </${this.info.name} plant:983096143284174865> **to plant a crop.**\n:droplet: **${waterTxt}**\n:wilted_rose: **You can clear rotten crops by harvesting all plots.**\n:basket: **All harvested crops are found in your inventory** </inventory:983096143179284519>**.**${buyPlot}`)

        if (userPlots.length == 0) {
            embed.addFields({ name: `Buy a Plot`, value: `Please press the button below to buy a plot.`, inline: false });
            return embed;
        }

        for (let i = 0; i < userPlots.length; i++) {
            let visualRow;
            let cropStatus;
            let plotstatusChanged = false;
            let item;

            if (userPlots[i].status !== "empty") {
                if (userPlots[i].harvestOn + 172800 <= parseInt(Date.now() / 1000)) {
                    userPlots[i].status = "rotten";
                    plotstatusChanged = true;
                } else if (userPlots[i].harvestOn <= parseInt(Date.now() / 1000)) {
                    userPlots[i].status = "harvest";
                    plotstatusChanged = true;
                }
            }

            switch (userPlots[i].status.toLowerCase()) {
                case 'growing':
                    item = await bot.database.fetchItem(userPlots[i].crop);
                    visualRow = this.createVisualRow(':seedling:');
                    cropStatus = `<:${item.itemId}:${item.emoteId}> in ${bot.tools.msToTime((userPlots[i].harvestOn * 1000) - Date.now())}`;
                    break;
                case 'rotten':
                    visualRow = this.createVisualRow(':wilted_rose:');
                    cropStatus = "Crops have rotten";
                    break;
                case 'harvest':
                    item = await bot.database.fetchItem(userPlots[i].crop);
                    visualRow = this.createVisualRow(`<:${item.itemId}:${item.emoteId}>`);
                    cropStatus = `<:${item.itemId}:${item.emoteId}> ready to harvest`;
                    break;
                default:
                    visualRow = this.createVisualRow(':brown_square:');
                    cropStatus = "No crops growing";
                    break;
            }

            embed.addFields({ name: `Plot ${i + 1}`, value: `${visualRow}\n${cropStatus}`, inline: true });

            if (plotstatusChanged) {
                await MemberModel.updateOne({ id: interaction.member.id, 'plots.plotId': userPlots[i].plotId }, {
                    $set: { 'plots.$.status': userPlots[i].status }
                });
            }
        }
        return embed;
    }

    createRow(disableBtns) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("plot_harvest")
                .setLabel("Harvest")
                .setStyle(ButtonStyle.Success)
                .setDisabled(disableBtns[0]),
            new ButtonBuilder()
                .setCustomId("plot_water")
                .setLabel("Water")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disableBtns[1]),
            new ButtonBuilder()
                .setCustomId("plot_buy")
                .setLabel("Buy New Plot")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disableBtns[2])
        );
        return row;
    }

    async waterPlots(interaction, data) {
        for (let i = 0; i < data.user.plots.length; i++) {
            if (data.user.plots[i].status === "growing") await MemberModel.updateOne({ id: interaction.member.id, 'plots.plotId': data.user.plots[i].plotId }, { $inc: { 'plots.$.harvestOn': -3600 } });
        }

        await MemberModel.updateOne({ id: interaction.member.id }, { $set: { lastWater: parseInt(Date.now() / 1000) } });
    }

    async buyPlot(interaction, data) {
        const newPlotPrice = this.calcPlotPrice(data.user.plots.length);
        let plotObj = {
            plotId: data.user.plots.length,
            status: "empty",
            harvestOn: 0,
            crop: "none"
        };

        await MemberModel.updateOne({ id: interaction.member.id }, {
            $push: { plots: plotObj },
            $inc: { wallet: -newPlotPrice }
        });

        await interaction.followUp({ content: `You successfully bought a new plot. Check your plot with </${this.info.name} list:983096143284174865>.`, ephemeral: true });
    }

    async calcBtns(data) {
        let btnsDisabled = [true, true, false];

        for (let i = 0; i < data.user.plots.length; i++) {
            if (data.user.plots[i].status === "harvest" || data.user.plots[i].status === "rotten") btnsDisabled[0] = false;
            if (data.user.plots[i].status === "growing" && data.user.lastWater + 14400 < parseInt(Date.now() / 1000)) btnsDisabled[1] = false;
        }
        if (data.user.plots.length >= 15 || data.user.wallet < this.calcPlotPrice(data.user.plots.length)) btnsDisabled[2] = true;
        return btnsDisabled;
    }

    getPlots(plotId) {
        let plots = [];

        // remove all bad characters
        plotId = plotId.replace(/[^0-9,-]/g, '');

        let commaPlots = plotId.split(',');
        for (let i = 0; i < commaPlots.length; i++) {
            try {
                if (commaPlots[i] === "") continue;

                let hyphenPlots = commaPlots[i].split('-');
                if (hyphenPlots.length === 2) {
                    for (let j = parseInt(hyphenPlots[0]); j <= parseInt(hyphenPlots[1]); j++) {
                        if (!plots.includes(j)) {
                            plots.push(j);
                        }
                    }
                } else {
                    if (!plots.includes(parseInt(hyphenPlots[0]))) {
                        plots.push(parseInt(hyphenPlots[0]));
                    }
                }
            } catch (e) { }
        }

        return plots;
    }
}

module.exports = Plot;