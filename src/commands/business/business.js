const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const guildUserSchema = require('../../database/schemas/guildUsers');

const advertiseTime = 43200;
const maxLevel = 10;

async function createEmbed(client, interaction, data) {
    // Add for future: ability to add custom company logo, slogan and color
    let level = data.userData.business.level;
    let expandCost = getExpandCosts(level);
    let worth = getWorth(data.userData.business);
    let workSalary = data.userData.business.workSalary;

    let embed = new MessageEmbed()
        .setAuthor({ name: `Business: ${data.userData.business.name}` })
        .setColor(client.config.embed.color)
        .addFields(
            { name: 'Owner', value: `<@${data.userData.userId}>`, inline: false },
            { name: 'Can Advertise?', value: `${data.advertise}`, inline: true },
            { name: 'Worth', value: `:coin: ${worth}`, inline: true },
            { name: 'Level', value: `${level}`, inline: true },
            { name: 'Work Salary', value: `:coin: ${workSalary}`, inline: true },
            { name: 'Expansion Cost', value: `:coin: ${expandCost}`, inline: true }
        )
    return embed;
}

function createRow(data, disabled = false) {
    let row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("bus_advertise")
            .setLabel("Advertise")
            .setStyle("PRIMARY")
            .setDisabled(!data.canAdvertise || disabled),
        new MessageButton()
            .setCustomId("bus_expand")
            .setLabel("Expand")
            .setStyle("SUCCESS")
            .setDisabled(!data.canExpand || disabled),
        new MessageButton()
            .setCustomId("bus_sell")
            .setLabel("Sell Business")
            .setStyle("DANGER")
            .setDisabled(disabled)
    );
    return row;
}

function getNewSalary(business) {
    const newSalary = business.workSalary + (business.level * 2 + 5);
    return newSalary > 750 ? 750 : newSalary;
}

function getAdvertisementCosts(level) {
    return 250 + (level * 50);
}

function getExpandCosts(level) {
    return 250 * (level >= 10 ? 0 : level);
}

function getWorth(business) {
    return (business.level < 5 ? 0 : business.level) * 80 + (business.workSalary < 100 ? 0 : business.workSalary) * 2;
}

async function execInfo(client, interaction, data) {
    let name = interaction.options.getString('name') || 1;
    if (name === 1 && data.guildUser.business === undefined) return await interaction.reply({ content: `You don't have a business. Please create one using \`/business create <name>\` or give a valid business name.`, ephemeral: true });

    if (name === 1) name = data.guildUser.business.name;
    data.userData = await guildUserSchema.findOne({ guildId: interaction.guildId, "business.name": name.toLowerCase() });
    if (data.userData == null) return await interaction.reply({ content: `That business doesn't exist. Please try another name.`, ephemeral: true })
    if (data.userData.userId === interaction.member.id) data.ownBusiness = true;
    await interaction.deferReply();

    data.advertise = "yes";
    if (data.userData.business.lastAdvertised + advertiseTime > parseInt(Date.now() / 1000)) {
        data.advertise = "in " + client.calc.msToTime(parseInt((data.userData.business.lastAdvertised + advertiseTime) * 1000 - Date.now()));
    }

    if (!data.ownBusiness) return await interaction.editReply({ embeds: [await createEmbed(client, interaction, data)] });

    let advertiseCost = getAdvertisementCosts(data.userData.business.level);
    let expandCost = getExpandCosts(data.userData.business.level);
    data.canAdvertise = advertiseCost <= data.guildUser.wallet && data.userData.business.lastAdvertised + advertiseTime <= parseInt(Date.now() / 1000);
    data.canExpand = data.userData.business.level < 10 && expandCost <= data.guildUser.wallet;

    await interaction.editReply({ embeds: [await createEmbed(client, interaction, data)], components: [createRow(data)] });
    const interactionMessage = await interaction.fetchReply();

    const filter = async (i) => {
        if (i.member.id === interaction.member.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, max: 15, idle: 15000, time: 60000 });

    collector.on('collect', async (interactionCollector) => {
        await interactionCollector.deferUpdate();

        if (interactionCollector.customId === 'bus_advertise') {
            data.canAdvertise = false;

            await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
                $set: {
                    "business.lastAdvertised": parseInt(Date.now() / 1000),
                    "business.workSalary": getNewSalary(data.userData.business)
                }
            });

            await client.tools.removeMoney(interaction.guildId, interaction.member.id, advertiseCost);
            data.userData = await guildUserSchema.findOne({ guildId: interaction.guildId, "business.name": name.toLowerCase() });
        } else if (interactionCollector.customId === 'bus_expand') {
            if (data.userData.business.level < maxLevel) {
                await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
                    $inc: {
                        "business.level": 1
                    }
                });
                await client.tools.removeMoney(interaction.guildId, interaction.member.id, expandCost);
                data.userData = await guildUserSchema.findOne({ guildId: interaction.guildId, "business.name": name.toLowerCase() });
            }
            data.canExpand = data.userData.business.level < 10;

            advertiseCost = getAdvertisementCosts(data.userData.business.level);
            expandCost = getExpandCosts(data.userData.business.level);
        } else if (interactionCollector.customId === 'bus_sell') {
            const worth = getWorth(data.userData.business);
            await interaction.editReply({ components: [createRow(data, true)] });

            guildUserSchema.findOne({ guildId: interaction.guildId, userId: interaction.member.id }, function (err, user) {
                user.business = undefined;
                user.save();
            });

            await client.tools.addMoney(interaction.guildId, interaction.member.id, worth);
            return await interaction.followUp({ content: `You sold your business for :coin: ${worth}.` });
        }

        await interaction.editReply({ embeds: [await createEmbed(client, interaction, data)], components: [createRow(data)] });
    })

    collector.on('end', async (interactionCollector) => {
        await interaction.editReply({ components: [createRow(data, true)] });
    })
}

async function execCreate(client, interaction, data) {
    const name = interaction.options.getString('name');

    if (data.guildUser.business != undefined && data.guildUser.business.name != undefined) return await interaction.reply({ content: `You already have a business. If you want to change the name you'll have to sell your business, using: \`/business info\`.`, ephemeral: true });
    const existingBusiness = await guildUserSchema.findOne({ guildId: interaction.guildId, "business.name": name.toLowerCase() });
    if (existingBusiness != null) return await interaction.reply({ content: `A business with that name already exists in this server. Please try another one.`, ephemeral: true })
    await interaction.deferReply();

    const businessObj = {
        name: name.toLowerCase(),
        level: 1,
        workSalary: 25,
        lastAdvertised: parseInt(Date.now() / 1000)
    }

    await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
        business: businessObj
    });

    await interaction.editReply({ content: `You succesfully created a business with the name: \`${name.toLowerCase()}\`` });
}

module.exports.execute = async (client, interaction, data) => {
    if (interaction.options.getSubcommand() === "info") return await execInfo(client, interaction, data);
    if (interaction.options.getSubcommand() === "create") return await execCreate(client, interaction, data);
    return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${data.cmd.help.name}\`.`, ephemeral: true });
}

module.exports.help = {
    name: "business",
    description: "Start your own business and become richer than Elon Musk!",
    options: [
        {
            name: 'info',
            type: 'SUB_COMMAND',
            description: 'Get more info about a company.',
            options: [
                {
                    name: 'name',
                    type: 'STRING',
                    description: 'The name of the business you want to get more info about.',
                    required: false
                }
            ]
        },
        {
            name: 'create',
            type: 'SUB_COMMAND',
            description: 'Create your own business.',
            options: [
                {
                    name: 'name',
                    type: 'STRING',
                    description: 'The name of the business you want to create.',
                    required: true
                }
            ]
        }
    ],
    category: "business",
    extraFields: [],
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}