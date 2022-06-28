const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const companiesSchema = require('../../database/schemas/companies');
const items = require('./items.json').items;

const positions = {
    "employee": {
        name: "Normal Employee",
        defaultWage: 15
    },
    "admin": {
        name: "Chief Operations Officier",
        defaultWage: 100
    },
    "ceo": {
        name: "Chief Executive Officier",
        defaultWage: 200
    }
}

async function execView(client, interaction, data) {
    await interaction.deferReply();

    const calcFactoryPrice = (factories) => {
        return factories * 1000 + 3000;
    }

    const embed = async (client, interaction, data) => {
        const createVisualRow = (element) => {
            return element.repeat(6);
        }

        const factories = data.company.factories;
        const maxFactories = data.company.employees.length * 2 + 2;
        let buyFactory = ``;

        if (factories.length < maxFactories) {
            buyFactory = `\n:moneybag: **To buy a new factory you will need :coin: ${calcFactoryPrice(factories.length)} in your wallet.**`;
        } else if (factories.length >= maxFactories && factories.length < 15) {
            buyFactory = `\n:moneybag: **You need to hire more employees to buy more factories.**`;
        }

        const e = new MessageEmbed()
            .setTitle(`:factory: Factories of ${data.company.name}`)
            .setColor(client.config.embed.color)
            .setDescription(`:gear: **Use** \`/factory set-production\` **to produce an item.**\n:hammer_pick: **All collected products are found in** \`/company inventory\`**.**${buyFactory}`)

        if (factories.length == 0) {
            e.addField(`Buy a Factory`, `Please press the button below to buy a factory.`, false);
            return e;
        }

        for (let i = 0; i < factories.length; i++) {
            let visualRow;
            let status;
            let statusChanged = false;
            let product;

            if (factories[i].status !== "standby") {
                if (factories[i].collectOn + 172800 <= parseInt(Date.now() / 1000)) {
                    factories[i].status = "destroyed";
                    statusChanged = true;
                } else if (factories[i].collectOn <= parseInt(Date.now() / 1000)) {
                    factories[i].status = "ready";
                    statusChanged = true;
                }
            }

            switch (factories[i].status.toLowerCase()) {
                case 'producing':
                    product = client.tools.getProduct(factories[i].product);
                    visualRow = createVisualRow(':gear:');
                    status = `<:${product.itemId}:${product.emoteId}> in ${client.calc.msToTime((factories[i].collectOn * 1000) - Date.now())}`;
                    break;
                case 'destroyed':
                    visualRow = createVisualRow(':package:');
                    status = "Products are destroyed";
                    break;
                case 'ready':
                    product = client.tools.getProduct(factories[i].product);
                    visualRow = createVisualRow(`<:${product.itemId}:${product.emoteId}>`);
                    status = `<:${product.itemId}:${product.emoteId}> ready to collect`;
                    break;
                default:
                    visualRow = createVisualRow(':black_large_square:');
                    status = "Factory standby";
                    break;
            }

            e.addField(`Factory ${i + 1}`, `${visualRow}\n${status}`, true);

            if (statusChanged) {
                await companiesSchema.updateOne({ guildId: data.company.guildId, ownerId: data.company.ownerId, 'factories.factoryId': factories[i].factoryId }, {
                    $set: { 'factories.$.status': factories[i].status }
                });
            }
        }

        return e;
    }

    const row = (data, disabled = false) => {
        let btnsDisabled = [true, false];

        if (!disabled) {
            for (let i = 0; i < data.company.factories.length; i++) {
                if (data.company.factories[i].status === "ready" || data.company.factories[i].status === "destroyed") {
                    btnsDisabled[0] = false;
                    break;
                }
            }

            const maxFactories = data.company.employees.length * 2 + 2;
            if (data.company.factories.length >= 15 || data.guildUser.wallet < calcFactoryPrice(data.company.factories.length) || data.company.factories.length >= maxFactories) btnsDisabled[1] = true;
        } else {
            btnsDisabled = [true, true];
        }

        let r = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId("factory_collect")
                .setLabel("Collect Products")
                .setStyle("SUCCESS")
                .setDisabled(btnsDisabled[0]),
            new MessageButton()
                .setCustomId("factory_buy")
                .setLabel("Buy New Factory")
                .setStyle("SECONDARY")
                .setDisabled(btnsDisabled[1])
        );
        return r;
    }

    const giveItem = async (data, itemId, quantity) => {
        if (await client.tools.userHasItem(data.company.inventory, itemId)) {
            await companiesSchema.updateOne({ guildId: data.company.guildId, ownerId: data.company.ownerId, 'inventory.itemId': itemId }, {
                $inc: { 'inventory.$.quantity': quantity }
            });
        } else {
            const invObj = {
                itemId: itemId,
                quantity: quantity
            };

            await companiesSchema.updateOne({ guildId: data.company.guildId, ownerId: data.company.ownerId }, {
                $push: { inventory: invObj },
            });
        }
    }

    const buyFactory = async (client, interaction, data) => {
        const newPrice = calcFactoryPrice(data.company.factories.length);

        const factoryObj = {
            factoryId: data.company.factories.length,
            level: 1,
            product: "none",
            status: "standby",
            collectOn: 0,
            maintenanceLevel: 100
        };

        await client.tools.removeMoney(interaction.guildId, interaction.member.id, newPrice, true);
        await companiesSchema.updateOne({ guildId: data.company.guildId, ownerId: data.company.ownerId }, {
            $push: { factories: factoryObj }
        });

        await interaction.followUp({ content: `You successfully bought a new factory. Check your factory with \`/factory view\`.`, ephemeral: true });
    }

    data = await client.tools.hasBusiness(interaction, data, positions);
    const interactionMessage = await interaction.editReply({ embeds: [await embed(client, interaction, data)], components: [row(data)], fetchReply: true });

    const filter = async (i) => {
        if (i.member.id === interaction.member.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, max: 15, idle: 15000, time: 60000 });

    collector.on('collect', async (interactionCollector) => {
        await interactionCollector.deferUpdate();

        if (interactionCollector.customId === 'factory_collect') {
            for (let i = 0; i < data.company.factories.length; i++) {
                if (data.company.factories[i].status === "ready" || data.company.factories[i].status === "destroyed") {
                    const product = client.tools.getProduct(data.company.factories[i].product);
                    if (data.company.factories[i].status === "ready") await giveItem(data, product.itemId, product.quantity);

                    data.company.factories[i].status = "standby";
                    await companiesSchema.updateOne({ guildId: data.company.guildId, ownerId: data.company.ownerId, 'factories.factoryId': data.company.factories[i].factoryId }, {
                        $set: { 'factories.$.status': "standby" }
                    });
                }
            }
        } else if (interactionCollector.customId === 'factory_buy') {
            await buyFactory(client, interaction, data);
            data.company = await client.database.fetchCompany(data.company.guildId, data.company.ownerId);
        }

        await interaction.editReply({ embeds: [await embed(client, interaction, data)], components: [row(data)] });
    })

    collector.on('end', async (interactionCollector) => {
        await interaction.editReply({ components: [row(data, true)] });
    })
}

async function execSetProduction(client, interaction, data) {
    await interaction.deferReply();
    data = await client.tools.hasBusiness(interaction, data, positions);

    if (!data.company) return await interaction.editReply({ content: `You don't have a company. Please create one using \`/company create <name>\`.` });
    if (data.employee.role !== "ceo" && data.employee.role !== "admin") return await interaction.editReply({ content: `You can't set the production of a factory.` });

    const factoryId = interaction.options.getString('factory-id');
    const productId = interaction.options.getString('product-id');

    const getFactories = (factoryId) => {
        let factories = [];

        // remove all bad characters
        factoryId = factoryId.replace(/[^0-9,-]/g, '');

        let commaFactories = factoryId.split(',');
        for (let i = 0; i < commaFactories.length; i++) {
            try {
                if (commaFactories[i] === "") continue;

                let hyphenFactories = commaFactories[i].split('-');
                if (hyphenFactories.length === 2) {
                    for (let j = parseInt(hyphenFactories[0]); j <= parseInt(hyphenFactories[1]); j++) {
                        if (!factories.includes(j)) {
                            factories.push(j);
                        }
                    }
                } else {
                    if (!factories.includes(parseInt(hyphenFactories[0]))) {
                        factories.push(parseInt(hyphenFactories[0]));
                    }
                }
            } catch (e) { }
        }

        return factories;
    }

    const factories = getFactories(factoryId);
    if (factories === []) return await interaction.editReply({ content: `Those are not valid factories.` });
    if (Math.max(...factories) > data.company.factories.length) return await interaction.editReply({ content: `You don't own a factory with id \`${Math.max(...factories)}\`.` });

    const product = client.tools.getProduct(productId.toLowerCase());
    if (product === undefined) return await interaction.editReply({ content: `\`${productId.toLowerCase()}\` is not a valid product. Use \`/factory list-products\` to view all products.` });

    for (let i = 0; i < factories.length; i++) {
        await companiesSchema.updateOne({ guildId: data.company.guildId, ownerId: data.company.ownerId, 'factories.factoryId': factories[i] - 1 }, {
            $set: {
                'factories.$.product': product.itemId,
                'factories.$.status': "producing",
                'factories.$.collectOn': parseInt(Date.now() / 1000) + product.produceTime
            }
        });
    }

    await interaction.editReply({ content: `You are currently producing **${product.quantity}x** <:${product.itemId}:${product.emoteId}> **${product.name}** in ${factories.length === 1 ? "factory" : "factories"} \`${factories.join(", ")}\`` });
}

async function execListProducts(client, interaction, data) {
    await interaction.deferReply();

    const listProducts = () => {
        let listStr = "";
        for (let i = 0; i < items.length; i++) {
            listStr += `<:${items[i].itemId}:${items[i].emoteId}> **${items[i].name}** ― :coin: ${items[i].sellPrice}/item\n`;
            listStr += `> **ID:** \`${items[i].itemId}\`\n`;
            listStr += `> **Production:** ${items[i].quantity}x every ${client.calc.msToTime(parseInt(items[i].produceTime * 1000))} (Per week: :coin: ${parseInt(items[i].quantity * items[i].sellPrice * (604800 / items[i].produceTime))})\n\n`;
        }

        return listStr === "" ? "No Products Found" : listStr;
    }

    const embed = new MessageEmbed()
        .setTitle(`Factory Products`)
        .setColor(client.config.embed.color)
        .setFooter({ text: "Use /factory set-production <factory-id> <product> to produce an item." })
        .setDescription(listProducts())
    await interaction.editReply({ embeds: [embed] });
}

module.exports.execute = async (client, interaction, data) => {
    switch (interaction.options.getSubcommand()) {
        case "view":
            return await execView(client, interaction, data);
        case "set-production":
            return await execSetProduction(client, interaction, data);
        case "list-products":
            return await execListProducts(client, interaction, data);
        default:
            return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${data.cmd.help.name}\`.`, ephemeral: true });
    }
}

module.exports.help = {
    name: "factory",
    description: "Do stuff with your factories!",
    options: [
        {
            name: 'view',
            type: 'SUB_COMMAND',
            description: 'View all your factories and their statuses.',
            options: []
        },
        {
            name: 'set-production',
            type: 'SUB_COMMAND',
            description: 'Produce items from a factory.',
            options: [
                {
                    name: 'factory-id',
                    type: 'STRING',
                    description: 'The factory you want to make items in. Use , or - to produce in more than one factory.',
                    required: true
                },
                {
                    name: 'product-id',
                    type: 'STRING',
                    description: 'The product you want to produce.',
                    required: true
                }
            ]
        },
        {
            name: 'list-products',
            type: 'SUB_COMMAND',
            description: 'Get a list of all the items your factories can produce.',
            options: []
        }
    ],
    category: "business",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}