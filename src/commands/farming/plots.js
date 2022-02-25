const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const guildUserSchema = require('../../database/schemas/guildUsers');

function createVisualRow(element) {
    return element.repeat(6);
}

function calcPlotPrice(plots) {
    return plots * 3000 + 7500;
}

async function createEmbed(client, interaction, data) {
    const userPlots = data.guildUser.plots;
    let waterTxt = `You can water your plots.`;
    let buyPlot = ``;
    if (data.guildUser.lastWater + 14400 > parseInt(Date.now() / 1000)) waterTxt = `You can water your plots again in ${client.calc.msToTime(((data.guildUser.lastWater + 14400) * 1000) - Date.now())}.`;
    if (data.guildUser.plots.length < 15) buyPlot = `\n:moneybag: **To buy a new plot you will need :coin: ${calcPlotPrice(data.guildUser.plots.length)} in your wallet.**`;

    const embed = new MessageEmbed()
        .setTitle(`${interaction.member.displayName || interaction.member.username}'s farm`)
        .setColor(client.config.embed.color)
        .setDescription(`:seedling: **Use** \`/plot plant <plot-id> <crop>\` **to plant a crop.**\n:droplet: **${waterTxt}**\n:wilted_rose: **You can clear rotten crops by harvesting all plots.**\n:basket: **All harvested crops are found in your inventory** \`/inventory\`**.**${buyPlot}`)

    if (userPlots.length == 0) {
        embed.addField(`Buy a Plot`, `Please press the button below to buy a plot.`, false);
        return embed;
    }
    for (let i = 0; i < userPlots.length; i++) {
        let visualRow;
        let cropStatus;
        let plotstatusChanged = false;

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
                visualRow = createVisualRow(':seedling:');
                cropStatus = `:${userPlots[i].crop}: in ${client.calc.msToTime((userPlots[i].harvestOn * 1000) - Date.now())}`;
                break;
            case 'rotten':
                visualRow = createVisualRow(':wilted_rose:');
                cropStatus = "Crops have rotten";
                break;
            case 'harvest':
                visualRow = createVisualRow(`:${userPlots[i].crop}:`);
                cropStatus = `:${userPlots[i].crop}: ready to harvest`;
                break;
            default:
                visualRow = createVisualRow(':brown_square:');
                cropStatus = "No crops growing";
                break;
        }

        embed.addField(`Plot ${i + 1}`, `${visualRow}\n${cropStatus}`, true);

        if (plotstatusChanged) {
            await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id, 'plots.plotId': userPlots[i].plotId }, {
                $set: { 'plots.$.status': userPlots[i].status }
            });
        }
    }
    return embed;
}

function createRow(disableBtns) {
    let row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("plot_harvest")
            .setLabel("Harvest")
            .setStyle("SUCCESS")
            .setDisabled(disableBtns[0]),
        new MessageButton()
            .setCustomId("plot_water")
            .setLabel("Water")
            .setStyle("PRIMARY")
            .setDisabled(disableBtns[1]),
        new MessageButton()
            .setCustomId("plot_buy")
            .setLabel("Buy New Plot")
            .setStyle("SECONDARY")
            .setDisabled(disableBtns[2])
    );
    return row;
}

async function waterPlots(interaction, data) {
    for (let i = 0; i < data.guildUser.plots.length; i++) {
        if (data.guildUser.plots[i].status === "growing") {
            await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id, 'plots.plotId': data.guildUser.plots[i].plotId }, {
                $inc: { 'plots.$.harvestOn': -3600 }
            });
        }
    }

    await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
        $set: { lastWater: parseInt(Date.now() / 1000) }
    });
}

async function buyPlot(interaction, data) {
    const newPlotPrice = calcPlotPrice(data.guildUser.plots.length);
    let plotObj = {
        plotId: data.guildUser.plots.length,
        status: "empty",
        harvestOn: 0,
        crop: "none"
    };

    await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
        $push: { plots: plotObj },
        $inc: { wallet: -newPlotPrice }
    });

    await interaction.followUp({ content: `You successfully bought a new plot. Check your plot with \`/plot list\`.`, ephemeral: true });
}

async function calcBtns(data) {
    let btnsDisabled = [true, true, false];

    for (let i = 0; i < data.guildUser.plots.length; i++) {
        if (data.guildUser.plots[i].status === "harvest" || data.guildUser.plots[i].status === "rotten") btnsDisabled[0] = false;
        if (data.guildUser.plots[i].status === "growing" && data.guildUser.lastWater + 14400 < parseInt(Date.now() / 1000)) btnsDisabled[1] = false;
    }
    if (data.guildUser.plots.length >= 15 || data.guildUser.wallet < calcPlotPrice(data.guildUser.plots.length)) btnsDisabled[2] = true;
    return btnsDisabled;
}

async function execList(client, interaction, data) {
    await interaction.deferReply();
    await interaction.editReply({ embeds: [await createEmbed(client, interaction, data)], components: [createRow(await calcBtns(data))] });
    const interactionMessage = await interaction.fetchReply();

    const filter = async (i) => {
        if (i.member.id === interaction.member.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, max: 15, idle: 15000, time: 60000 });

    collector.on('collect', async (interactionCollector) => {
        if (interactionCollector.customId === 'plot_harvest') {
            for (let i = 0; i < data.guildUser.plots.length; i++) {
                if (data.guildUser.plots[i].status === "harvest" || data.guildUser.plots[i].status === "rotten") {
                    if (data.guildUser.plots[i].status === "harvest") await client.tools.giveItem(interaction, data, data.guildUser.plots[i].crop, 6);
                    data.guildUser.plots[i].status = "empty";
                    await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id, 'plots.plotId': data.guildUser.plots[i].plotId }, {
                        $set: { 'plots.$.status': "empty" }
                    });
                }
            }
        }
        else if (interactionCollector.customId === 'plot_water') {
            await waterPlots(interaction, data);
            data.guildUser = await client.database.fetchGuildUser(interaction.guildId, interaction.member.id);
        } else if (interactionCollector.customId === 'plot_buy') {
            await buyPlot(interaction, data);
            data.guildUser = await client.database.fetchGuildUser(interaction.guildId, interaction.member.id);
        }

        await interactionCollector.deferUpdate();
        await interaction.editReply({ embeds: [await createEmbed(client, interaction, data)], components: [createRow(await calcBtns(data))] });
    })

    collector.on('end', async (interactionCollector) => {
        await interaction.editReply({ components: [createRow([true, true, true])] });
    })
}

async function execPlant(client, interaction, data) {
    const plotId = interaction.options.getInteger('plot-id');
    const cropType = interaction.options.getString('crop');

    if (plotId > data.guildUser.plots.length) return await interaction.reply({ content: `You don't own a plot with id \`${plotId}\`.`, ephemeral: true });
    const cropItem = await client.database.fetchItem(cropType);
    if (cropItem == null) return await interaction.reply({ content: `\`${cropType.toLowerCase()}\` is not a valid crop. Use \`/shop list\` to view all crops.`, ephemeral: true });

    await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id, 'plots.plotId': plotId - 1 }, {
        $set: {
            'plots.$.status': "growing",
            'plots.$.harvestOn': parseInt(Date.now() / 1000) + cropItem.duration,
            'plots.$.crop': cropItem.itemId
        }
    });
    if (!await client.tools.takeItem(interaction, data, cropItem.itemId, 1)) return await interaction.reply({ content: `You don't have that crop in your inventory. Please buy a crop with \`/shop buy <crop-id>\`.`, ephemeral: true });
    await interaction.reply({ content: `You successfully planted \`${cropItem.name}\` on plot ${plotId}`, ephemeral: true });
}

module.exports.execute = async (client, interaction, data) => {
    if (interaction.options.getSubcommand() === "list") return await execList(client, interaction, data);
    if (interaction.options.getSubcommand() === "buy") return await execBuy(client, interaction, data);
    if (interaction.options.getSubcommand() === "plant") return await execPlant(client, interaction, data);
    return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help plot\`.`, ephemeral: true });
}

module.exports.help = {
    name: "plot",
    description: "Plant or get a list of your plots",
    options: [
        {
            name: 'list',
            type: 'SUB_COMMAND',
            description: 'Get a list with information about all your plots.',
            options: []
        },
        {
            name: 'plant',
            type: 'SUB_COMMAND',
            description: 'Plant a new crop on your plots.',
            options: [
                {
                    name: 'plot-id',
                    type: 'INTEGER',
                    description: 'The plot ID of where you want to plant.',
                    required: true,
                    min_value: 1,
                    max_value: 15
                },
                {
                    name: 'crop',
                    type: 'STRING',
                    description: 'What crop you want to plant. Use "/shop list" to check all available crops.',
                    required: true
                }
            ]
        }
    ],
    usage: "<list | buy | plant> [plot-id] [crop]",
    category: "farming",
    extraFields: [],
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "READ_MESSAGE_HISTORY"],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}