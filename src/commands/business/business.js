import Command from '../../structures/Command.js'
import {
    ApplicationCommandOptionType,
    EmbedBuilder,
    Colors,
    ActionRowBuilder,
    ButtonStyle,
    ButtonBuilder,
    ComponentType,
    StringSelectMenuBuilder
} from 'discord.js'
import Member from '../../models/Member.js'
import Business from '../../models/Business.js'
import { checkItem, getBusiness } from '../../lib/user.js'
import { commandPassed, randomNumber } from '../../lib/helpers.js'
import { createMessageComponentCollector } from '../../lib/embed.js'
import positions from '../../assets/positions.json' assert { type: "json" }

const validItems = [
    'plastic',
    'cloth',
    'silicon',
    'soccer_ball',
    'shirt',
    'earbuds',
    'processor',
    'graphics_card',
    'desktop',
    'server'
];

const calcWorth = async (inventory, factories) => {
    let worth = 0;

    for (let i = 0; i < inventory.length; i++) {
        const item = await bot.database.fetchItem(inventory[i].itemId);
        if (item) worth += item.sellPrice * inventory[i].amount;
    }

    for (let i = 0; i < factories.length; i++) {
        worth += 250 * factories[i].level;
    }

    return worth;
}

export default class extends Command {
    info = {
        name: "business",
        description: "Start your own business and earn the big bucks!",
        options: [
            {
                name: 'info',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get an overview of your business.',
                options: []
            },
            {
                name: 'create',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Create your own business.',
                options: [
                    {
                        name: 'name',
                        type: ApplicationCommandOptionType.String,
                        description: 'The name of your business.',
                        required: true
                    }
                ]
            },
            {
                name: 'sell-business',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Sell your business and get the net worth of your business.',
                options: []
            },
            {
                name: 'sell-item',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Sell an item from the inventory of your business.',
                options: [
                    {
                        name: 'item-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The item ID of the item you want to sell.',
                        required: true
                    },
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Integer,
                        description: 'The amount of items you want to sell.',
                        required: false,
                        min_value: 1,
                        max_value: 100
                    }
                ]
            },
            {
                name: 'supply',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Buy or steal supplies to use in your factories.',
                options: [
                    {
                        name: 'option',
                        type: ApplicationCommandOptionType.String,
                        description: 'How do you want to get your supplies?',
                        required: true,
                        choices: [
                            {
                                name: "Buy",
                                value: "buy",
                                focused: true
                            },
                            {
                                name: "Steal",
                                value: "steal"
                            }
                        ]
                    },
                    {
                        name: 'item-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The item you want to buy or steal.',
                        required: true
                    },
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Integer,
                        description: 'This only applies when you buy supplies.',
                        required: false,
                        min_value: 1,
                        max_value: 25
                    }
                ]
            },
            {
                name: 'employee',
                type: ApplicationCommandOptionType.SubcommandGroup,
                description: 'Do stuff with employees.',
                options: [
                    {
                        name: 'hire',
                        type: ApplicationCommandOptionType.Subcommand,
                        description: 'Hire an employee.',
                        options: [
                            {
                                name: 'user',
                                type: ApplicationCommandOptionType.User,
                                description: 'The user you want to hire.',
                                required: true
                            }
                        ]
                    },
                    {
                        name: 'fire',
                        type: ApplicationCommandOptionType.Subcommand,
                        description: 'Fire an employee from your business.',
                        options: [
                            {
                                name: 'user',
                                type: ApplicationCommandOptionType.User,
                                description: 'The user you want to fire from your business.',
                                required: true
                            }
                        ]
                    },
                    {
                        name: 'set-wage',
                        type: ApplicationCommandOptionType.Subcommand,
                        description: 'Set a wage for an employee.',
                        options: [
                            {
                                name: 'user',
                                type: ApplicationCommandOptionType.User,
                                description: 'The employee you want to change the wage of.',
                                required: true
                            },
                            {
                                name: 'wage',
                                type: ApplicationCommandOptionType.Integer,
                                description: 'The wage of that employee.',
                                required: true,
                                min_value: 15,
                                max_value: 250
                            }
                        ]
                    },
                    {
                        name: 'set-position',
                        type: ApplicationCommandOptionType.Subcommand,
                        description: 'Give your employee a job title.',
                        options: [
                            {
                                name: 'user',
                                type: ApplicationCommandOptionType.User,
                                description: 'The employee you want to change the wage of.',
                                required: true
                            },
                            {
                                name: 'position',
                                type: ApplicationCommandOptionType.String,
                                description: 'The position of that employee.',
                                required: true,
                                choices: [
                                    {
                                        name: "Employee",
                                        value: "employee",
                                        focused: true
                                    },
                                    {
                                        name: "Operations Officer",
                                        value: "operations_officer"
                                    },
                                    {
                                        name: "Manager",
                                        value: "manager"
                                    },
                                    {
                                        name: "Executive",
                                        value: "executive"
                                    },
                                ]
                            }
                        ]
                    }
                ]
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
    }

    async run(interaction, data) {
        const company = await getBusiness(data.user);

        switch (interaction.options.getSubcommand()) {
            case "info":
                return await this.execInfo(company, interaction, data);
            case "create":
                return await this.execCreate(company, interaction, data);
            case "sell-business":
                return await this.execSellBusiness(company, interaction, data);
            case "sell-item":
                return await this.execSellItem(company, interaction, data);
            case "supply":
                return await this.execSupply(company, interaction, data);
            case "hire":
                return await this.execEmployeeAdd(company, interaction, data);
            case "fire":
                return await this.execEmployeeFire(company, interaction, data);
            case "set-wage":
                return await this.execEmployeeSetWage(company, interaction, data);
            case "set-position":
                return await this.execEmployeeSetPosition(company, interaction, data);
            default:
                return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help command ${this.info.name}\`.` });
        }
    }

    async execInfo(company, interaction, data) {
        const getEmbed = async (company, page = "overview") => {
            let embed = new EmbedBuilder()
                .setColor(bot.config.embed.color)
                .setFooter({ text: `${company.company.name} in Coinz`, iconURL: bot.user.avatarURL() });

            if (page === "inventory") {
                embed.setTitle(`Inventory of ${company.company.name}`);
                embed.setDescription(`:credit_card: **Bank Balance:** :coin: ${company.company.balance}\n:moneybag: **Total Inventory Worth:** :coin: ${await calcWorth(company.company.inventory, 0)}`);

                let items = [];
                for (let i = 0; i < company.company.inventory.length; i++) {
                    const invItem = company.company.inventory[i];
                    const item = await bot.database.fetchItem(invItem.itemId);
                    items.push(`**${invItem.amount}x** <:${invItem.itemId}:${item.emoteId}> ${item.name}`);
                }

                embed.addFields({ name: "Inventory", value: items.length > 0 ? items.join("\n") : "Your business has no inventory..." });

            } else if (page === "employees") {
                let employees = "";

                for (let i = 0; i < company.company.employees.length; i++) {
                    const employee = company.company.employees[i];
                    employees += `**${i + 1}.** <@${employee.userId}> (**${employee.role}**) - :coin: ${employee.wage}\n> **Money Collected:** :coin: ${employee.moneyCollected} - **Times Worked:** ${employee.timesWorked}\n\n`;
                }

                embed.setTitle(`Employees of ${company.company.name}`)
                embed.setDescription(employees || "There are no employees in this business.");
            } else {
                const worker = company.employee === null ? { role: "ceo", wage: 200 } : company.employee;

                embed.setTitle(`Overview of ${company.company.name}`);
                embed.addFields(
                    {
                        name: "Business Information",
                        value: `:sunglasses: **Owner:** <@${company.company.ownerId}>\n:credit_card: **Bank Balance:** :coin: ${company.company.balance}\n:moneybag: **Worth:** :coin: ${await calcWorth(company.company.inventory, company.company.factories)}\n:factory: **Factories:** \`${company.company.factories.length}\``,
                        inline: false
                    },
                    {
                        name: "Your Status",
                        value: `**Position:** ${positions[worker.role].name}\n**Wage:** :coin: ${worker.wage}${company.employee !== null ? `\n**Money Collected:** :coin: ${company.employee.moneyCollected}` : ""}${company.employee !== null ? `\n**Times Worked:** ${company.employee.timesWorked}x` : ""}`,
                        inline: false
                    }
                )
            }

            return embed;
        }

        const getSelectMenu = (defaultLabel = "overview", disabled = false) => {
            let options = [
                { label: '📜 Overview', value: 'overview' },
                { label: '📦 Inventory', value: 'inventory' },
                { label: '👥 Employees', value: 'employees' }
            ]

            for (let i = 0; i < options.length; i++) {
                if (options[i].value === defaultLabel) {
                    options[i].default = true;
                }
            }

            const SelectMenu = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("business_info")
                        .setPlaceholder('The interaction has ended')
                        .setDisabled(disabled)
                        .addOptions(options),
                );

            return SelectMenu;
        }

        if (company.company === null) return await interaction.reply({ content: `You don't own or work at a business. Create one using </business create:1048340073470513155>.`, ephemeral: true });

        await interaction.deferReply();
        let category = "overview";
        const message = await interaction.editReply({ embeds: [await getEmbed(company, category)], components: [getSelectMenu(category)], fetchReply: true });
        const collector = createMessageComponentCollector(message, interaction, { max: 5, time: 60000, componentType: ComponentType.StringSelect });

        collector.on('collect', async (i) => {
            category = i.values[0];
            await i.update({ embeds: [await getEmbed(company, category)], components: [getSelectMenu(category)] });
        });

        collector.on('end', async (i) => {
            await interaction.editReply({ components: [getSelectMenu(category, true)] });
        });
    }

    async execCreate(company, interaction, data) {
        await interaction.deferReply({ ephemeral: true });
        if (company.company === null && data.user.job === "") {
            const name = interaction.options.getString('name').trim();
            if (name.length > 32) return await interaction.editReply({ content: `You can only use a maximum of 32 characters for your business name.`, ephemeral: true });
            if (!/^[A-Za-z][a-zA-Z0-9 _-]*$/.test(name)) return await interaction.editReply({ content: `Your business name can only use \`A-Z, a-z, 0-9, whitespaces, -, _\` and you have to start with a letter.`, ephemeral: true });
            if (data.user.wallet < 2000) return await interaction.editReply({ content: `You need :coin: 2000 in your wallet to create a business.`, ephemeral: true });

            await bot.database.fetchBusiness(interaction.member.id, name);
            await Member.updateOne(
                { id: interaction.member.id },
                { $set: { job: "business" }, $inc: { wallet: -2000 } }
            );

            return await interaction.editReply({ content: `You have successfully created a business named \`${name}\` for :coin: 2000.`, ephemeral: true });
        } else {
            return await interaction.editReply({ content: `You already own or work at a business or have a job.\nQuit your job using </job leave:983096143284174858>, sell your business using </business sell:0>.`, ephemeral: true });
        }
    }

    async execSellBusiness(company, interaction, data) {
        await interaction.deferReply({ ephemeral: true });
        if (company.company !== null) {
            if (company.isOwner) {
                const worth = await calcWorth(company.company.inventory, company.company.factories);

                await Member.updateOne(
                    { id: interaction.member.id },
                    { $set: { job: "" }, $inc: { wallet: worth } }
                );

                await Business.deleteOne({ ownerId: interaction.member.id });
                return await interaction.editReply({ content: `You have successfully sold your business for :coin: ${worth}.`, ephemeral: true });
            } else {
                return await interaction.editReply({ content: `You don't own a business. If you are trying to quit your job, use </job leave:983096143284174858>.`, ephemeral: true });
            }
        } else {
            return await interaction.editReply({ content: `You don't work at a business.`, ephemeral: true });
        }
    }

    async execSellItem(company, interaction, data) {
        await interaction.deferReply({ ephemeral: true });
        if (company.company === null) return await interaction.editReply({ content: `You don't own or work at a business. Create one using </business create:1048340073470513155>.` });

        // check if user has permissions
        const allowedRoles = ["executive", "manager"];
        if (!company.isOwner && !allowedRoles.includes(company.employee.role)) return await interaction.editReply({ content: `You don't have permission to use this command.` });

        const itemId = interaction.options.getString('item-id');
        const amount = interaction.options.getInteger('amount') ?? 1;

        const item = await bot.database.fetchItem(itemId);
        if (item === null) return await interaction.editReply({ content: `The item with ID \`${itemId}\` doesn't exist.` });

        const inventory = company.company.inventory;
        const itemIndex = inventory.findIndex(i => i.itemId === itemId);
        if (itemIndex === -1) return await interaction.editReply({ content: `You don't have any <:${item.itemId}:${item.emoteId}> ${item.name} in your inventory.` });

        const itemAmount = inventory[itemIndex].amount;
        if (amount > itemAmount) return await interaction.editReply({ content: `You don't have enough <:${item.itemId}:${item.emoteId}> ${item.name} in your inventory.` });

        const price = item.sellPrice * amount;

        if (amount >= itemAmount) {
            await Business.updateOne(
                { ownerId: interaction.member.id },
                {
                    $pull: { 'inventory': { itemId: item.itemId } },
                    $inc: { balance: price }
                },
            );
        } else {
            await Business.updateOne(
                { ownerId: interaction.member.id, 'inventory.itemId': item.itemId },
                { $inc: { balance: price, 'inventory.$.amount': -amount } }
            );
        }

        await interaction.editReply({ content: `You have successfully sold ${amount}x <:${item.itemId}:${item.emoteId}> ${item.name} for :coin: ${price}.` });
    }

    async execSupply(company, interaction, data) {
        if (company.company === null) return await interaction.reply({ content: `You don't own or work at a business. Create one using </business create:1048340073470513155>.`, ephemeral: true });

        // check if user has permissions
        const allowedRoles = ["executive", "manager"];
        if (!company.isOwner && !allowedRoles.includes(company.employee.role)) return await interaction.reply({ content: `You don't have permission to use this command.`, ephemeral: true });

        const option = interaction.options.getString('option');
        const itemId = interaction.options.getString('item-id');

        if (!validItems.includes(itemId)) return await interaction.reply({ content: `The item ID you have entered is invalid. Please try </factory list-products:1040552927288377345>.`, ephemeral: true });
        const product = await bot.database.fetchItem(itemId);

        if (option === "steal") {
            if (company.company.balance < 25) return await interaction.reply({ content: `Your business needs at least :coin: 25 to steal supplies.`, ephemeral: true });
            await interaction.deferReply();

            if (await bot.cooldown.isOnCooldown(company.company.ownerId, "business-steal")) {
                return await interaction.editReply({ content: `:x: Your company has to wait ${msToTime(await bot.cooldown.getCooldown(company.company.ownerId, cmd.info.name) * 1000)} to steal supplies again.` });
            }
            await bot.cooldown.setCooldown(company.company.ownerId, "business-steal", 86400 * 2);

            if (!commandPassed(company.company.risk)) {
                const amount = randomNumber(1, 4);
                const newRisk = company.company.risk + 10 > 80 ? 80 - company.company.risk : 10;

                if (checkItem(company.company.inventory, itemId)) {
                    await Business.updateOne({ ownerId: company.company.ownerId }, { $inc: { risk: newRisk } });
                    await Business.updateOne({ ownerId: company.company.ownerId, 'inventory.itemId': product.itemId }, { $inc: { 'inventory.$.amount': amount } });
                } else {
                    await Business.updateOne(
                        { ownerId: company.company.ownerId },
                        {
                            $inc: { risk: newRisk },
                            $push: { inventory: { itemId: itemId, amount: amount } }
                        });
                }

                return await interaction.editReply({ content: `You have successfully stolen ${amount}x <:${product.itemId}:${product.emoteId}> from another business. The risk went up to ${company.company.risk + newRisk}%.` });
            } else {
                const amount = randomNumber(100, 750);
                const newRisk = company.company.risk - 5 >= 0 ? -5 : 0;
                await Business.updateOne({ ownerId: company.company.ownerId }, { $inc: { balance: -amount, risk: newRisk } });
                return await interaction.editReply({ content: `You got caught stealing... You paid a :coin: ${amount} fine. The risk went down to ${company.company.risk + newRisk}%.` });
            }
        } else {
            const amount = interaction.options.getInteger('amount') ?? 1;
            const totalPrice = Math.floor(product.buyPrice * amount);

            if (!product) return await interaction.reply({ content: `The item with the ID \`${itemId}\` doesn't exist.` });
            if (totalPrice > company.company.balance) return await interaction.reply({ content: `You don't have enough money in your wallet.` });
            await interaction.deferReply();
            const newRisk = company.company.risk - 15 >= 0 ? -15 : 0;

            if (checkItem(company.company.inventory, itemId)) {
                await Business.updateOne({ ownerId: company.company.ownerId }, { $inc: { balance: -totalPrice, risk: newRisk } });
                await Business.updateOne({ ownerId: company.company.ownerId, 'inventory.itemId': product.itemId }, { $inc: { 'inventory.$.amount': amount } });
            } else {
                await Business.updateOne({ ownerId: company.company.ownerId }, { $inc: { balance: -totalPrice, risk: newRisk }, $push: { inventory: { itemId: itemId, amount: amount } } });
            }

            return await interaction.editReply({ content: `You have successfully bought ${amount}x <:${product.itemId}:${product.emoteId}> for :coin: ${totalPrice}. The risk went down to ${company.company.risk + newRisk}%.` });
        }
    }

    async execEmployeeAdd(company, interaction, data) {
        if (company.company === null) return await interaction.reply({ content: `You don't own or work at a business. Create one using </business create:1048340073470513155>.`, ephemeral: true });

        // check if user has permissions
        const allowedRoles = ["executive", "manager"];
        if (!company.isOwner && !allowedRoles.includes(company.employee.role)) return await interaction.reply({ content: `You don't have permission to use this command.`, ephemeral: true });

        const user = interaction.options.getUser('user');
        if (user.bot) return await interaction.reply({ content: `Do you really want to invite a bot?! I don't think so. The bots don't want to work for your company...`, ephemeral: true });
        if (user.id === interaction.member.id) return await interaction.reply({ content: `Why are you trying to invite yourself?!`, ephemeral: true });
        if (company.company.employees.length >= 5) return await interaction.reply({ content: `You can't have more than 5 employees.`, ephemeral: true });
        if (company.company.employees.some(e => e.userId === user.id)) return await interaction.reply({ content: `This member is already an employee.`, ephemeral: true });

        await interaction.deferReply();
        const employee = await bot.database.fetchMember(user.id);
        if (employee.job.startsWith("business")) return await interaction.editReply({ content: `That user is already working for another company.` });

        data.interactionHasEnded = false;

        const confirmEmbed = new EmbedBuilder()
            .setAuthor({ name: `Join ${company.company.name}?` })
            .setColor(bot.config.embed.color)
            .setDescription(`${user.username}, do you want to work for ${company.company.name} (Owner: <@${company.company.ownerId}>)\nYou have 30 seconds to respond. If you want to deny, don't press anything!`)

        const row = function (disabled = false) {
            const r = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("company_hireEmployee")
                    .setLabel("Join the company")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(disabled)
            );
            return r;
        }

        const interactionMessage = await interaction.editReply({ content: `<@${user.id}>`, embeds: [confirmEmbed], components: [row(false)], fetchReply: true });

        const filter = async (i) => {
            if (i.member.id === user.id) return true;
            await i.reply({ content: `Only <@${user.id}> can respond to this button.`, ephemeral: true, target: i.member });
            return false;
        }

        const collector = interactionMessage.createMessageComponentCollector({ filter, time: 30000, componentType: ComponentType.Button });

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();

            if (interactionCollector.customId === 'company_hireEmployee') {
                data.interactionHasEnded = true;
                const respondsEmbed = new EmbedBuilder()
                    .setAuthor({ name: `${company.company.name} just got another employee!` })
                    .setColor(Colors.Green)
                    .setDescription(`<@${user.id}> has signed a contract with \`${company.company.name}\`.`)

                await Member.updateOne({ id: user.id }, {
                    $set: {
                        job: `business-${company.company.ownerId}`
                    }
                });

                await Business.updateOne({ ownerId: company.company.ownerId }, {
                    $push: { employees: { userId: user.id } }
                });

                if (company.company.employees.length + 1 >= 5) await Member.updateOne({ id: interaction.member.id }, { $push: { badges: "going_places" } });
                return await interaction.editReply({ embeds: [respondsEmbed], components: [row(true)] });
            }
        })

        collector.on('end', async (interactionCollector) => {
            if (!data.interactionHasEnded) {
                const respondsEmbed = new EmbedBuilder()
                    .setAuthor({ name: `${user.username} has denied the invitation of ${company.company.name}` })
                    .setColor(Colors.Red)
                    .setDescription(`<@${user.id}> won't be working for \`${company.company.name}\`.`)

                await interaction.editReply({ embeds: [respondsEmbed], components: [row(true)] });
            }
        })
    }

    async execEmployeeFire(company, interaction, data) {
        if (company.company === null) return await interaction.reply({ content: `You don't own or work at a business. Create one using </business create:1048340073470513155>.`, ephemeral: true });

        // check if user has permissions
        const allowedRoles = ["executive", "manager"];
        if (!company.isOwner && !allowedRoles.includes(company.employee.role)) return await interaction.reply({ content: `You don't have permission to use this command.`, ephemeral: true });

        const user = interaction.options.getUser('user');
        if (user.id === interaction.member.id) return await interaction.reply({ content: `Why do you want to fire yourself?!`, ephemeral: true });
        if (user.id === company.company.ownerId) return await interaction.reply({ content: `You can't fire the CEO of this business...`, ephemeral: true });

        await interaction.deferReply();
        let removedEmployee = false;
        for (let i = 0; i < company.company.employees.length; i++) {
            if (company.company.employees[i].userId === user.id) {
                removedEmployee = true;

                await Member.updateOne({ id: user.id }, { $set: { job: "" } });
                await this.removeEmployee(company.company, user.id);
                break;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`Fire Employee`)
            .setColor(Colors.Red)
            .setDescription(removedEmployee ? `You fired ${user.username}#${user.discriminator} from your business.` : `<@${user.id}> is not an employee of your business.`)
        await interaction.editReply({ embeds: [embed] });
    }

    async execEmployeeSetWage(company, interaction, data) {
        if (company.company === null) return await interaction.reply({ content: `You don't own or work at a business. Create one using </business create:1048340073470513155>.`, ephemeral: true });

        // check if user has permissions
        const allowedRoles = ["executive", "manager"];
        if (!company.isOwner && !allowedRoles.includes(company.employee.role)) return await interaction.reply({ content: `You don't have permission to use this command.`, ephemeral: true });

        const user = interaction.options.getUser('user');
        const wage = interaction.options.getInteger('wage');
        if (user.id === interaction.member.id) return await interaction.reply({ content: `You can't set your own wage...`, ephemeral: true });
        if (company.company.ownerId === user.id) return await interaction.reply({ content: `You can't set the CEO's wage...`, ephemeral: true });

        await interaction.deferReply();
        let employeeExists = false;
        for (let i = 0; i < company.company.employees.length; i++) {
            if (company.company.employees[i].userId === user.id) {
                employeeExists = true;
                await Business.updateOne({ ownerId: company.company.ownerId, 'employees.userId': user.id }, {
                    $set: { "employees.$.wage": wage }
                });
                break;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`Set Wage`)
            .setColor(bot.config.embed.color)
            .setDescription(employeeExists ? `You set the wage of ${user.username}#${user.discriminator} to :coin: ${wage}.` : `<@${user.id}> is not an employee of your company.`)
        await interaction.editReply({ embeds: [embed] });
    }

    async execEmployeeSetPosition(company, interaction, data) {
        if (company.company === null) return await interaction.reply({ content: `You don't own or work at a business. Create one using </business create:1048340073470513155>.`, ephemeral: true });

        // check if user has permissions
        const allowedRoles = ["executive", "manager"];
        if (!company.isOwner && !allowedRoles.includes(company.employee.role)) return await interaction.reply({ content: `You don't have permission to use this command.`, ephemeral: true });

        const user = interaction.options.getUser('user');
        if (user.id === interaction.member.id) return await interaction.reply({ content: `You can't change your own position`, ephemeral: true });
        if (user.id === company.company.ownerId) return await interaction.reply({ content: `You can't change the position of the CEO.`, ephemeral: true });

        await interaction.deferReply();
        let employeeExists = false;
        for (let i = 0; i < company.company.employees.length; i++) {
            if (company.company.employees[i].userId === user.id) {
                employeeExists = true;
                await Business.updateOne({ ownerId: company.company.ownerId, 'employees.userId': user.id }, {
                    $set: { "employees.$.role": interaction.options.getString('position') }
                });
                break;
            }
        }

        const position = positions[interaction.options.getString('position')];
        const embed = new EmbedBuilder()
            .setTitle(`Set Position`)
            .setColor(bot.config.embed.color)
            .setDescription(employeeExists ? `You set the position of ${user.username}#${user.discriminator} to ${position.name}.` : `<@${user.id}> is not an employee of your business.`)
        await interaction.editReply({ embeds: [embed] });
    }

    async removeEmployee(company, employeeId) {
        await Business.updateOne({ ownerId: company.ownerId }, {
            $pull: { employees: { userId: employeeId } }
        })
    }
}