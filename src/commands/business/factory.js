const Command = require('../../structures/Command.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandOptionType } = require('discord.js');
const CompanyModel = require('../../models/Company');
const items = require('../../assets/companyProducts.json').products;

class Factory extends Command {
    info = {
        name: "factory",
        description: "Do stuff with your factories!",
        options: [
            {
                name: 'view',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'View all your factories and their statuses.',
                options: []
            },
            {
                name: 'set-production',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Produce items from a factory.',
                options: [
                    {
                        name: 'factory-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The factory you want to make items in. Use , or - to produce in more than one factory.',
                        required: true
                    },
                    {
                        name: 'product-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The product you want to produce.',
                        required: true
                    },
                    {
                        name: 'force',
                        type: ApplicationCommandOptionType.String,
                        description: 'Do you want to override the production in a factory? Default = No',
                        required: false,
                        choices: [
                            {
                                name: "Yes",
                                value: "yes"
                            },
                            {
                                name: "No",
                                value: "no"
                            }
                        ]
                    }
                ]
            },
            {
                name: 'list-products',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get a list of all the items your factories can produce.',
                options: []
            }
        ],
        category: "business",
        extraFields: [],
        cooldown: 0,
        enabled: true,
        memberRequired: true,
        deferReply: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        switch (interaction.options.getSubcommand()) {
            case "view":
                return await this.execView(interaction, data);
            case "set-production":
                return await this.execSetProduction(interaction, data);
            case "list-products":
                return await this.execListProducts(interaction, data);
            default:
                return await interaction.editReply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${this.info.name}\`.` });
        }
    }

    async execView(interaction, data) {
        const calcFactoryPrice = (factories) => {
            return factories * 3000 + 3000;
        }

        const embed = async (interaction, data) => {
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

            const e = new EmbedBuilder()
                .setTitle(`:factory: Factories of ${data.company.name}`)
                .setColor(bot.config.embed.color)
                .setDescription(`:gear: **Use** </${this.info.name} set-production:993095062726647809> **to produce an item.**\n:hammer_pick: **All collected products are found in** </company inventory:993095062726647808>**.**${buyFactory}`)

            if (factories.length == 0) {
                e.addFields({ name: `Buy a Factory`, value: `Please press the button below to buy a factory.`, inline: false });
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
                        product = bot.tools.getProduct(factories[i].product);
                        visualRow = createVisualRow(':gear:');
                        status = `<:${product.itemId}:${product.emoteId}> in ${bot.tools.msToTime((factories[i].collectOn * 1000) - Date.now())}`;
                        break;
                    case 'destroyed':
                        visualRow = createVisualRow(':package:');
                        status = "Products are destroyed";
                        break;
                    case 'ready':
                        product = bot.tools.getProduct(factories[i].product);
                        visualRow = createVisualRow(`<:${product.itemId}:${product.emoteId}>`);
                        status = `<:${product.itemId}:${product.emoteId}> ready to collect`;
                        break;
                    default:
                        visualRow = createVisualRow(':black_large_square:');
                        status = "Factory standby";
                        break;
                }

                e.addFields({ name: `Factory (ID: ${i + 1})`, value: `${visualRow}\n${status}`, inline: true });

                if (statusChanged) {
                    await CompanyModel.updateOne({ id: data.company.id, 'factories.factoryId': factories[i].factoryId }, {
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
                if (data.company.factories.length >= 15 || data.user.wallet < calcFactoryPrice(data.company.factories.length) || data.company.factories.length >= maxFactories) btnsDisabled[1] = true;
            } else {
                btnsDisabled = [true, true];
            }

            let r = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("factory_collect")
                    .setLabel("Collect Products")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(btnsDisabled[0]),
                new ButtonBuilder()
                    .setCustomId("factory_buy")
                    .setLabel("Buy New Factory")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(btnsDisabled[1])
            );
            return r;
        }

        const giveItem = async (data, itemId, quantity) => {
            if (bot.tools.checkItem(data.company.inventory, itemId)) {
                await CompanyModel.updateOne({ id: data.company.id, 'inventory.itemId': itemId }, {
                    $inc: { 'inventory.$.quantity': quantity }
                });
            } else {
                const invObj = {
                    itemId: itemId,
                    quantity: quantity
                };

                await CompanyModel.updateOne({ id: data.company.id }, {
                    $push: { inventory: invObj },
                });
            }
        }

        const buyFactory = async (interaction, data) => {
            const newPrice = calcFactoryPrice(data.company.factories.length);

            const factoryObj = {
                factoryId: data.company.factories.length,
                level: 1,
                product: "none",
                status: "standby",
                collectOn: 0,
                maintenanceLevel: 100
            };

            await bot.tools.takeMoney(interaction.member.id, newPrice, true);
            await CompanyModel.updateOne({ id: data.company.id }, { $push: { factories: factoryObj } });
            await interaction.followUp({ content: `You successfully bought a new factory. Check your factory with </${this.info.name} view:993095062726647809>.`, ephemeral: true });
        }

        data = await bot.tools.hasCompany(interaction.member.id, data);
        if (!data.company) return await interaction.editReply({ content: `You don't own or work at a company. Please create or join one first to view your factories.\nIf this is a mistake, please join our support server: https://discord.gg/asnZQwc6kW` });
        const interactionMessage = await interaction.editReply({ embeds: [await embed(interaction, data)], components: [row(data)], fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { max: 15, idle: 15000, time: 60000 });

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();

            if (interactionCollector.customId === 'factory_collect') {
                for (let i = 0; i < data.company.factories.length; i++) {
                    if (data.company.factories[i].status === "ready" || data.company.factories[i].status === "destroyed") {
                        const product = bot.tools.getProduct(data.company.factories[i].product);
                        if (data.company.factories[i].status === "ready") await giveItem(data, product.itemId, product.quantity);
                        data.company = await CompanyModel.findOne({ id: data.company.id });

                        data.company.factories[i].status = "standby";
                        await CompanyModel.updateOne({ id: data.company.id, 'factories.factoryId': data.company.factories[i].factoryId }, {
                            $set: { 'factories.$.status': "standby" }
                        });
                    }
                }
            } else if (interactionCollector.customId === 'factory_buy') {
                await buyFactory(interaction, data);
                data.company = await bot.database.fetchCompany(data.company.id);
            }

            await interaction.editReply({ embeds: [await embed(interaction, data)], components: [row(data)] });
        })

        collector.on('end', async (interactionCollector) => {
            await interaction.editReply({ components: [row(data, true)] });
        })
    }

    async execSetProduction(interaction, data) {
        data = await bot.tools.hasCompany(interaction.member.id, data);

        if (!data.company) return await interaction.editReply({ content: `You don't have a company. Please create one using </company create:993095062726647808>.` });
        if (data.employee.role !== "ceo" && data.employee.role !== "admin") return await interaction.editReply({ content: `You can't set the production of a factory.` });

        const factoryId = interaction.options.getString('factory-id');
        const productId = interaction.options.getString('product-id');
        const force = interaction.options.getString('force') || "no";

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
        if (factories.length <= 0) return await interaction.editReply({ content: `Those are not valid factories.` });
        if (Math.min(...factories) <= 0) return await interaction.editReply({ content: `Factory IDs start counting from 1. Please choose a number higher than 0.`, ephemeral: true });
        if (Math.max(...factories) > data.company.factories.length) return await interaction.editReply({ content: `You don't own a factory with id \`${Math.max(...factories)}\`.` });

        const product = bot.tools.getProduct(productId.toLowerCase());
        if (product === undefined) return await interaction.editReply({ content: `\`${productId.toLowerCase()}\` is not a valid product. Use </${this.info.name} list-products:993095062726647809> to view all products.` });

        if (force !== "yes") {
            for (let i = 0; i < factories.length; i++) {
                if (data.company.factories[i].status !== "standby") {
                    return await interaction.editReply({ content: `You are already producing items in ${factories.length === 1 ? "that factory" : "those factories"}. If you want to override the production, please use \`/${this.info.name} set-production ${factoryId} Yes\``, ephemeral: true });
                }
            }
        }

        for (let i = 0; i < factories.length; i++) {
            await CompanyModel.updateOne({ id: data.company.id, 'factories.factoryId': factories[i] - 1 }, {
                $set: {
                    'factories.$.product': product.itemId,
                    'factories.$.status': "producing",
                    'factories.$.collectOn': parseInt(Date.now() / 1000) + product.produceTime
                }
            });
        }

        await interaction.editReply({ content: `You are currently producing **${product.quantity}x** <:${product.itemId}:${product.emoteId}> **${product.name}** in ${factories.length === 1 ? "factory" : "factories"} \`${factories.join(", ")}\`` });
    }

    async execListProducts(interaction, data) {
        const listProducts = () => {
            let listStr = "";
            for (let i = 0; i < items.length; i++) {
                listStr += `<:${items[i].itemId}:${items[i].emoteId}> **${items[i].name}** ― :coin: ${items[i].sellPrice}/item\n`;
                listStr += `> **ID:** \`${items[i].itemId}\`\n`;
                listStr += `> **Production:** ${items[i].quantity}x every ${bot.tools.msToTime(parseInt(items[i].produceTime * 1000))} (Per week: :coin: ${parseInt(items[i].quantity * items[i].sellPrice * (604800 / items[i].produceTime))})\n\n`;
            }

            return listStr === "" ? "No Products Found" : listStr;
        }

        const embed = new EmbedBuilder()
            .setTitle(`Factory Products`)
            .setColor(bot.config.embed.color)
            .setFooter({ text: `Use /${this.info.name} set-production <factory-id> <product> to produce an item.` })
            .setDescription(listProducts())
        await interaction.editReply({ embeds: [embed] });
    }
}

module.exports = Factory;