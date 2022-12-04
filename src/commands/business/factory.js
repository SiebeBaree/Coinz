import Command from '../../structures/Command.js'
import {
    ApplicationCommandOptionType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ButtonBuilder
} from 'discord.js'
import Business from '../../models/Business.js'
import { checkItem, getBusiness, takeMoney } from '../../lib/user.js'
import { msToTime } from '../../lib/helpers.js'
import { createMessageComponentCollector } from '../../lib/embed.js'
import productRequirements from '../../assets/production.json' assert { type: "json" }

let products = {}; // used to cache the products
let requirements = {}; // used to cache the requirements

export default class extends Command {
    info = {
        name: "factory",
        description: "Create products from your supply and sell them for profit!",
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
        deferReply: false
    };

    constructor(...args) {
        super(...args);
        this.init();
    }

    async init() {
        if (Object.keys(products).length === 0) {
            const requirementItemIds = [];
            const productReqKeys = Object.keys(productRequirements);

            for (let i = 0; i < productReqKeys.length; i++) {
                const product = await bot.database.fetchItem(productReqKeys[i]);
                const reqs = productRequirements[productReqKeys[i]];
                if (product === null) continue;

                for (let j = 0; j < Object.keys(reqs).length; j++) {
                    const reqItemId = Object.keys(reqs)[j];

                    if (!requirementItemIds.includes(reqItemId)) {
                        const item = await bot.database.fetchItem(reqItemId);
                        if (item !== null) {
                            requirements[reqItemId] = {
                                emoteId: item.emoteId,
                                buyPrice: item.buyPrice,
                                name: item.name,
                            };
                            requirementItemIds.push(reqItemId);
                        }
                    }
                }

                products[productReqKeys[i]] = {
                    itemId: productReqKeys[i],
                    emoteId: product.emoteId,
                    name: product.name,
                    sellPrice: product.sellPrice,
                    quantity: Math.floor(product.multiplier),
                    produceTime: product.duration,
                    requirements: reqs
                };
            }
        }
    }

    async run(interaction, data) {
        const company = await getBusiness(data.user);

        switch (interaction.options.getSubcommand()) {
            case "view":
                return await this.execView(company, interaction, data);
            case "set-production":
                return await this.execSetProduction(company, interaction, data);
            case "list-products":
                return await this.execListProducts(company, interaction, data);
            default:
                return await interaction.editReply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help command ${this.info.name}\`.` });
        }
    }

    async execView(company, interaction, data) {
        await interaction.deferReply();

        const calcFactoryPrice = (factories) => {
            return factories * 3000 + 3000;
        }

        const embed = async (company) => {
            const createVisualRow = (element) => {
                return element.repeat(6);
            }

            const factories = company.company.factories;
            const maxFactories = company.company.employees.length * 2 + 2;
            let buyFactory = ``;

            if (factories.length < maxFactories) {
                buyFactory = `\n:moneybag: **To buy a new factory you will need :coin: ${calcFactoryPrice(factories.length)} in your wallet.**`;
            } else if (factories.length >= maxFactories && factories.length < 15) {
                buyFactory = `\n:moneybag: **You need to hire more employees to buy more factories.**`;
            }

            const e = new EmbedBuilder()
                .setTitle(`:factory: Factories of ${company.company.name}`)
                .setColor(bot.config.embed.color)
                .setDescription(`:gear: **Use** </${this.info.name} set-production:993095062726647809> **to produce an item.**\n:hammer_pick: **All collected products are found in** </business inventory:1048340073470513155>**.**${buyFactory}`)

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
                    if (factories[i].produceOn.getTime() + 172_800_000 <= Date.now()) {
                        factories[i].status = "destroyed";
                        statusChanged = true;
                    } else if (factories[i].produceOn.getTime() <= Date.now()) {
                        factories[i].status = "ready";
                        statusChanged = true;
                    }
                }

                switch (factories[i].status.toLowerCase()) {
                    case 'producing':
                        product = products[factories[i].production];
                        visualRow = createVisualRow(':gear:');
                        status = `<:${product.itemId}:${product.emoteId}> in ${msToTime(factories[i].produceOn.getTime() - Date.now())}`;
                        break;
                    case 'destroyed':
                        visualRow = createVisualRow(':package:');
                        status = "Products are destroyed";
                        break;
                    case 'ready':
                        product = products[factories[i].production];
                        visualRow = createVisualRow(`<:${product.itemId}:${product.emoteId}>`);
                        status = `<:${product.itemId}:${product.emoteId}> ready to collect`;
                        break;
                    default:
                        visualRow = createVisualRow(':black_large_square:');
                        status = "Shutdown";
                        break;
                }

                e.addFields({ name: `Factory (ID: ${i + 1})`, value: `${visualRow}\n${status}`, inline: true });

                if (statusChanged) {
                    await Business.updateOne({ ownerId: company.company.ownerId, 'factories.factoryId': factories[i].factoryId }, {
                        $set: { 'factories.$.status': factories[i].status }
                    });
                }
            }

            return e;
        }

        const row = (company, data, disabled = false) => {
            let btnsDisabled = [true, false];

            if (!disabled) {
                for (let i = 0; i < company.company.factories.length; i++) {
                    if (company.company.factories[i].status === "ready" || company.company.factories[i].status === "destroyed") {
                        btnsDisabled[0] = false;
                        break;
                    }
                }

                const maxFactories = company.company.employees.length * 2 + 2;
                if (company.company.factories.length >= 15 || data.user.wallet < calcFactoryPrice(company.company.factories.length) || company.company.factories.length >= maxFactories) btnsDisabled[1] = true;
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

        const giveItem = async (company, itemId, quantity) => {
            if (checkItem(company.company.inventory, itemId)) {
                await Business.updateOne({ ownerId: company.company.ownerId, 'inventory.itemId': itemId }, {
                    $inc: { 'inventory.$.amount': quantity }
                });
            } else {
                const invObj = {
                    itemId: itemId,
                    amount: quantity
                };

                await Business.updateOne({ ownerId: company.company.ownerId }, {
                    $push: { inventory: invObj },
                });
            }
        }

        const buyFactory = async (company, interaction) => {
            const newPrice = calcFactoryPrice(company.company.factories.length);

            const factoryObj = {
                factoryId: company.company.factories.length,
                produceOn: 0
            };

            await takeMoney(interaction.member.id, newPrice, true);
            await Business.updateOne({ ownerId: company.company.ownerId }, { $push: { factories: factoryObj } });
            await interaction.followUp({ content: `You successfully bought a new factory. Check your factory with </${this.info.name} view:993095062726647809>.`, ephemeral: true });
        }

        if (company.company === null) return await interaction.editReply({ content: `You don't own or work at a business. Create one using </business create:1048340073470513155>.` });
        const interactionMessage = await interaction.editReply({ embeds: [await embed(company)], components: [row(company, data)], fetchReply: true });
        const collector = createMessageComponentCollector(interactionMessage, interaction, { max: 15, idle: 15000, time: 60000 });

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();

            if (interactionCollector.customId === 'factory_collect') {
                for (let i = 0; i < company.company.factories.length; i++) {
                    if (company.company.factories[i].status === "ready" || company.company.factories[i].status === "destroyed") {
                        const product = products[company.company.factories[i].production];
                        if (company.company.factories[i].status === "ready") await giveItem(company, product.itemId, product.quantity);
                        company.company = await Business.findOne({ ownerId: company.company.ownerId });

                        company.company.factories[i].status = "standby";
                        await Business.updateOne({ ownerId: company.company.ownerId, 'factories.factoryId': company.company.factories[i].factoryId }, {
                            $set: { 'factories.$.status': "standby" }
                        });
                    }
                }
            } else if (interactionCollector.customId === 'factory_buy') {
                await buyFactory(company, interaction);
                data.user.wallet -= calcFactoryPrice(company.company.factories.length)
                company.company = await bot.database.fetchBusiness(company.company.ownerId);
            }

            await interaction.editReply({ embeds: [await embed(company)], components: [row(company, data)] });
        });

        collector.on('end', async (interactionCollector) => {
            await interaction.editReply({ components: [row(company, data, true)] });
        });
    }

    async execSetProduction(company, interaction, data) {
        await interaction.deferReply({ ephemeral: true });
        if (company.company === null) return await interaction.editReply({ content: `You don't own or work at a business. Create one using </business create:1048340073470513155>.` });

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
        if (factories.length === 0) return await interaction.editReply({ content: `You didn't provide any valid factory IDs.` });
        if (Math.min(...factories) <= 0) return await interaction.editReply({ content: `Factory IDs start counting from 1. Please choose a number higher than 0.` });
        if (Math.max(...factories) > company.company.factories.length) return await interaction.editReply({ content: `You don't own a factory with id \`${Math.max(...factories)}\`.` });

        const product = products[productId.toLowerCase()];
        if (product === undefined) return await interaction.editReply({ content: `\`${productId.toLowerCase()}\` is not a valid product. Use </${this.info.name} list-products:993095062726647809> to view all products.` });

        if (force !== "yes") {
            for (let i = 0; i < factories.length; i++) {
                if (company.company.factories[i].status !== "standby") {
                    return await interaction.editReply({ content: `You are already producing items in ${factories.length === 1 ? "that factory" : "those factories"}. If you want to override the production, please use \`/${this.info.name} set-production ${factoryId} Yes\`` });
                }
            }
        }

        // check if the user has enough items to produce the product
        const reqs = {};
        const productReqKeys = Object.keys(product.requirements);
        for (let i = 0; i < productReqKeys.length; i++) {
            reqs[productReqKeys[i]] = product.requirements[productReqKeys[i]] * product.quantity;
        }

        const reqKeys = Object.keys(reqs);
        for (let i = 0; i < reqKeys.length; i++) {
            const item = checkItem(company.company.inventory, reqKeys[i], true);

            if (item.amount < reqs[reqKeys[i]]) {
                return await interaction.editReply({ content: `You don't have enough items to produce that product. You need \`${reqs[reqKeys[i]]}\` \`${requirements[reqKeys[i]].name}\` but you only have \`${item.amount}\`.` });
            }

            if (item.amount - reqs[reqKeys[i]] > 0) {
                await Business.updateOne({ ownerId: company.company.ownerId, 'inventory.itemId': item.itemId }, {
                    $inc: { 'inventory.$.amount': -reqs[reqKeys[i]] }
                });
            } else {
                await Business.updateOne({ ownerId: company.company.ownerId }, {
                    $pull: { 'inventory': { itemId: item.itemId } }
                });
            }
        }

        for (let i = 0; i < factories.length; i++) {
            await Business.updateOne({ ownerId: company.company.ownerId, 'factories.factoryId': factories[i] - 1 }, {
                $set: {
                    'factories.$.production': productId,
                    'factories.$.status': "producing",
                    'factories.$.produceOn': new Date(Date.now() + (product.produceTime * 1000))
                }
            });
        }

        await interaction.editReply({ content: `You are currently producing <:${productId}:${product.emoteId}> **${product.name}** in ${factories.length === 1 ? "factory" : "factories"} \`${factories.join(", ")}\`` });
    }

    async execListProducts(company, interaction, data) {
        await interaction.deferReply();
        const listProducts = () => {
            let listStr = "";
            const productKeys = Object.keys(products);

            for (let i = 0; i < productKeys.length; i++) {
                const product = products[productKeys[i]];
                const requirementKeys = Object.keys(product.requirements);

                listStr += `<:${productKeys[i]}:${product.emoteId}> **${product.name}** ― :coin: ${product.sellPrice}/item (\`${productKeys[i]}\`)\n`;
                listStr += `> **Production:** ${product.quantity}x every ${msToTime(parseInt(product.produceTime * 1000))}\n`;
                if (requirementKeys.length > 0) listStr += `> **Requirements:** ${requirementKeys.map(r => `**${product.requirements[r]}x** <:${r}:${requirements[r].emoteId}>`).join(", ")}\n`;
                listStr += `\n`;
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

    getProductQuantity(factory, product) {
        factory.level = factory.level === undefined ? 1 : factory.level;

        let returnValue = 1;
        if (factory.level === 1) returnValue = Math.ceil(product.quantity / 3);
        else if (factory.level === 2) returnValue = Math.ceil(product.quantity / 2);
        else returnValue = product.quantity;

        return returnValue > 0 ? returnValue : 1;
    }
}