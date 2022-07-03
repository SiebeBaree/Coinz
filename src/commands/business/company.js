const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const guildUserSchema = require('../../database/schemas/guildUsers');
const companiesSchema = require('../../database/schemas/companies');

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

function calcWorth(client, inventory, factories) {
    let worth = 0;

    for (let i = 0; i < inventory.length; i++) {
        const item = client.tools.getProduct(inventory[i].itemId);
        if (item !== null && item !== undefined) worth += item.sellPrice * inventory[i].quantity;
    }

    return Math.round(worth + (factories * 500));
}

function getEmployees(client, employees) {
    let employeesStr = "";

    for (let i = 0; i < employees.length; i++) {
        employeesStr += `${positions[employees[i].role].name} <@${employees[i].userId}> - Wage: :coin: ${employees[i].wage}\n`;
    }

    return employeesStr === "" ? "No Employees Found!" : employeesStr;
}

async function removeEmployee(company, employeeId) {
    await companiesSchema.updateOne({ guildId: company.guildId, ownerId: company.ownerId }, {
        $pull: {
            employees: { userId: employeeId }
        }
    })
}

async function execInfo(client, interaction, data) {
    await interaction.deferReply();
    data = await client.tools.hasBusiness(interaction, data, positions);
    const company = data.company;
    if (!company) return await interaction.editReply({ content: `You might want to create a company to use this command. Please create one using \`/company create <name>\`.` });

    const embed = async function (client, company) {
        let em = new MessageEmbed()
            .setAuthor({ name: `Company: ${company.name}` })
            .setColor(client.config.embed.color)
            .addFields(
                { name: 'Information', value: `:sunglasses: **Owner:** <@${company.ownerId}>\n:credit_card: **Bank Balance:** :coin: ${company.balance}\n:moneybag: **Worth:** :coin: ${calcWorth(client, company.inventory, company.factories.length)}\n:factory: **Factories:** \`${company.factories.length}\``, inline: false },
                { name: 'Employees', value: getEmployees(client, company.employees), inline: false },
                { name: 'Your Information', value: `**Position:** ${positions[data.employee.role.toLowerCase()].name}\n**Wage:** :coin: ${data.employee.wage}`, inline: false }
            )
        return em;
    }

    const row = function (data, disabled = false) {
        if (data.isEmployee === true) {
            let r = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId("company_leave")
                    .setLabel("Leave Company")
                    .setStyle("DANGER")
                    .setDisabled(disabled)
            );
            return r;
        } else {
            let r = new MessageActionRow().addComponents(
                new MessageButton()
                    .setCustomId("company_sell")
                    .setLabel("Sell Company")
                    .setStyle("DANGER")
                    .setDisabled(disabled)
            );
            return r;
        }
    }

    const interactionMessage = await interaction.editReply({ embeds: [await embed(client, company)], components: [row(data)], fetchReply: true });

    const filter = async (i) => {
        if (i.member.id === interaction.member.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, time: 20000 });

    collector.on('collect', async (interactionCollector) => {
        await interactionCollector.deferUpdate();

        if (interactionCollector.customId === 'company_sell') {
            const worth = calcWorth(client, company.inventory, company.factories.length);
            await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, { $set: { job: "" } });
            await companiesSchema.deleteOne({ guildId: interaction.guildId, ownerId: interaction.member.id });
            await client.tools.addMoney(interaction.guildId, interaction.member.id, worth);

            return await interaction.followUp({ content: `You sold \`${company.name}\` for :coin: ${worth}. Let's buy a yacht and do nothing with your live...` });
        } else if (interactionCollector.customId === 'company_leave') {
            await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, { $set: { job: "" } });
            await removeEmployee(company, interaction.member.id);

            return await interaction.followUp({ content: `You left ${company.name}. Go find a new job before you're broke!` });
        }

        await interaction.editReply({ embeds: [await embed(client, company)], components: [row(data, true)] });
    })

    collector.on('end', async (interactionCollector) => {
        await interaction.editReply({ components: [row(data, true)] });
    })
}

async function execInventory(client, interaction, data) {
    data = await client.tools.hasBusiness(interaction, data, positions);
    await interaction.deferReply();
    if (!data.company) return await interaction.editReply({ content: `To view your companies inventory you may need a company? Am I right? Please create one using \`/company create <name>\`.` });

    const embed = async function (client, company) {
        let inventory = "";

        for (let i = 0; i < company.inventory.length; i++) {
            const item = client.tools.getProduct(company.inventory[i].itemId);
            if (item !== undefined) inventory += `**${company.inventory[i].quantity}x** <:${item.itemId}:${item.emoteId}> ${item.name}\n`;
        }

        let em = new MessageEmbed()
            .setAuthor({ name: `Inventory of ${company.name}` })
            .setColor(client.config.embed.color)
            .setDescription(`:credit_card: **Bank Balance:** :coin: ${company.balance}\n:moneybag: **Total Inventory Worth:** :coin: ${calcWorth(client, company.inventory, 0)}`)
            .addField("Inventory", inventory === "" ? "Your company has no inventory." : inventory, false)
        return em;
    }

    if (data.employee.role !== "ceo" && data.employee.role !== "admin") return await interaction.editReply({ embeds: [await embed(client, data.company)] });

    const row = function (data, disabled = false) {
        if (data.company.inventory.length <= 0) disabled = true;

        let r = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId("company_sellInventory")
                .setLabel("Sell Inventory")
                .setStyle("DANGER")
                .setDisabled(disabled)
        );
        return r;
    }

    const interactionMessage = await interaction.editReply({ embeds: [await embed(client, data.company)], components: [row(data)], fetchReply: true });

    const filter = async (i) => {
        if (i.member.id === interaction.member.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, time: 20000 });

    collector.on('collect', async (interactionCollector) => {
        await interactionCollector.deferUpdate();

        if (interactionCollector.customId === 'company_sellInventory') {
            data.company.balance += calcWorth(client, data.company.inventory, 0);
            data.company.inventory = [];

            await companiesSchema.updateOne({ guildId: data.company.guildId, ownerId: data.company.ownerId }, {
                $set: {
                    inventory: [],
                    balance: data.company.balance
                }
            })
        }

        await interaction.editReply({ embeds: [await embed(client, data.company)], components: [row(data, true)] });
    })

    collector.on('end', async (interactionCollector) => {
        await interaction.editReply({ components: [row(data, true)] });
    })
}

async function execEmployeeAdd(client, interaction, data) {
    const user = interaction.options.getUser('user');
    await interaction.deferReply();
    data = await client.tools.hasBusiness(interaction, data, positions);
    const company = data.company;

    if (!company) return await interaction.editReply({ content: `You don't have a company. Please create one using \`/company create <name>\`.` });
    if (data.employee.role !== "ceo" && data.employee.role !== "admin") return await interaction.editReply({ content: `You don't have the power to hire new people.` });

    if (user.bot) return await interaction.editReply({ content: `Do you really want to invite a bot?! I don't think so. The bots don't want to work for your company...` });
    if (user.id === interaction.member.id) return await interaction.editReply({ content: `Why are you trying to invite yourself?!` });
    if (company.employees.length >= 5) return await interaction.editReply({ content: `You are not Apple. Please don't invite the whole world...\nYou already have the maximum allowed staff for a company. Check your employees using \`/company info\`` });
    for (let i = 0; i < company.employees.length; i++) {
        if (company.employees[i].userId === user.id) {
            return await interaction.editReply({ content: `You really want to invite this user? That's already an employee of your company...` });
        }
    }

    const employeeData = await client.database.fetchGuildUser(interaction.guildId, user.id);
    if (employeeData.job.startsWith("business")) return await interaction.editReply({ content: `That user is already working for another company.` });

    data.interactionHasEnded = false;

    const confirmEmbed = new MessageEmbed()
        .setAuthor({ name: `Join ${company.name}?` })
        .setColor(client.config.embed.color)
        .setDescription(`${user.username}, do you want to work for ${company.name} (Owner: <@${company.ownerId}>)\nYou have 30 seconds to respond. If you want to deny, don't press anything!`)

    const row = function (disabled = false) {
        const r = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId("company_addEmployee")
                .setLabel("Join the company")
                .setStyle("PRIMARY")
                .setDisabled(disabled)
        );
        return r;
    }

    const interactionMessage = await interaction.editReply({ content: `<@${user.id}>`, embeds: [confirmEmbed], components: [row(false)], fetchReply: true });

    const filter = async (i) => {
        if (i.member.id === user.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, time: 30000 });

    collector.on('collect', async (interactionCollector) => {
        await interactionCollector.deferUpdate();

        if (interactionCollector.customId === 'company_addEmployee') {
            data.interactionHasEnded = true;
            const respondsEmbed = new MessageEmbed()
                .setAuthor({ name: `${company.name} just got another employee!` })
                .setColor("GREEN")
                .setDescription(`<@${user.id}> has signed a contract with \`${company.name}\`.`)

            await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: user.id }, {
                $set: {
                    job: `business-${company.ownerId}`
                }
            });

            await companiesSchema.updateOne({ guildId: company.guildId, ownerId: company.ownerId }, {
                $push: {
                    employees: {
                        userId: user.id,
                        role: "employee",
                        wage: positions["employee"].defaultWage
                    }
                }
            })

            return await interaction.editReply({ embeds: [respondsEmbed], components: [row(true)] });
        }
    })

    collector.on('end', async (interactionCollector) => {
        if (!data.interactionHasEnded) {
            const respondsEmbed = new MessageEmbed()
                .setAuthor({ name: `${user.username} has denied the invitation of ${company.name}` })
                .setColor("RED")
                .setDescription(`<@${user.id}> won't be working for \`${company.name}\`.`)

            await interaction.editReply({ embeds: [respondsEmbed], components: [row(true)] });
        }
    })
}

async function execEmployeeFire(client, interaction, data) {
    const user = interaction.options.getUser('user');
    await interaction.deferReply();
    data = await client.tools.hasBusiness(interaction, data, positions);
    const company = data.company;

    if (!company) return await interaction.editReply({ content: `You don't have a company. Please create one using \`/company create <name>\`.` });
    if (data.employee.role !== "ceo" && data.employee.role !== "admin") return await interaction.editReply({ content: `You don't have the power to fire employees.` });
    if (user.id === interaction.member.id) return await interaction.editReply({ content: `Why do you want to fire yourself?!` });
    if (user.id === company.ownerId) return await interaction.editReply({ content: `You can't invite the CEO of this company...` });

    let removedEmployee = false;
    for (let i = 0; i < company.employees.length; i++) {
        if (company.employees[i].userId === user.id) {
            removedEmployee = true;

            await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: user.id }, {
                $set: {
                    job: ""
                }
            });

            await removeEmployee(company, user.id);
            break;
        }
    }

    const embed = new MessageEmbed()
        .setTitle(`Fire Employee`)
        .setColor("RED")
        .setDescription(removedEmployee ? `You fired ${user.username}#${user.discriminator} from your company.` : `<@${user.id}> is not an employee of your company.`)
    await interaction.editReply({ embeds: [embed] });
}

async function execEmployeeSetWage(client, interaction, data) {
    const user = interaction.options.getUser('user');
    const wage = interaction.options.getInteger('wage');
    await interaction.deferReply();
    data = await client.tools.hasBusiness(interaction, data, positions);
    const company = data.company;

    if (!company) return await interaction.editReply({ content: `You don't have a company. Please create one using \`/company create <name>\`.` });
    if (data.employee.role !== "ceo" && data.employee.role !== "admin") return await interaction.editReply({ content: `You don't have the power to set wages.` });

    let employeeExists = false;
    for (let i = 0; i < company.employees.length; i++) {
        if (company.employees[i].userId === user.id) {
            employeeExists = true;
            await companiesSchema.updateOne({ guildId: company.guildId, ownerId: company.ownerId, 'employees.userId': user.id }, {
                $set: {
                    "employees.$.wage": wage
                }
            });
            break;
        }
    }

    const embed = new MessageEmbed()
        .setTitle(`Set Wage`)
        .setColor(client.config.embed.color)
        .setDescription(employeeExists ? `You set the wage of ${user.username}#${user.discriminator} to :coin: ${wage}.` : `<@${user.id}> is not an employee of your company.`)
    await interaction.editReply({ embeds: [embed] });
}

async function execEmployeeSetPosition(client, interaction, data) {
    const user = interaction.options.getUser('user');
    await interaction.deferReply();
    data = await client.tools.hasBusiness(interaction, data, positions);
    const company = data.company;

    if (!company) return await interaction.editReply({ content: `You don't have a company. Please create one using \`/company create <name>\`.` });
    if (data.employee.role !== "ceo" && data.employee.role !== "admin") return await interaction.editReply({ content: `You don't have the power to set positions.` });
    if (user.id === company.ownerId) return await interaction.editReply({ content: `You can't change the position of the CEO.` });

    const position = positions[interaction.options.getString('position')];

    let employeeExists = false;
    for (let i = 0; i < company.employees.length; i++) {
        if (company.employees[i].userId === user.id) {
            employeeExists = true;
            await companiesSchema.updateOne({ guildId: company.guildId, ownerId: company.ownerId, 'employees.userId': user.id }, {
                $set: {
                    "employees.$.role": interaction.options.getString('position')
                }
            });
            break;
        }
    }

    const embed = new MessageEmbed()
        .setTitle(`Set Position`)
        .setColor(client.config.embed.color)
        .setDescription(employeeExists ? `You set the position of ${user.username}#${user.discriminator} to ${position.name}.` : `<@${user.id}> is not an employee of your company.`)
    await interaction.editReply({ embeds: [embed] });
}

async function execCreate(client, interaction, data) {
    await interaction.deferReply();
    data = await client.tools.hasBusiness(interaction, data, positions);
    const company = data.company;
    if (company) return await interaction.editReply({ content: "You already have a company! If you don't know how this feature works, please use `/help company`." });

    if (data.guildUser.job.startsWith("business")) {
        await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
            $set: {
                job: ""
            }
        });
    } else if (data.guildUser.job !== "") {
        return await interaction.editReply({ content: `You already have a job. Please leave your job to create a company!` });
    }

    const name = interaction.options.getString('name').trim();
    if (name.length > 32) return await interaction.editReply({ content: `You can only use a maximum of 32 characters for your company name.` });
    if (!/^[A-Za-z][a-zA-Z0-9 _-]*$/.test(name)) return await interaction.editReply({ content: `Your company name can only use \`A-Z, a-z, 0-9, whitespaces, -, _\` and you have to start with a letter.` });
    if (data.guildUser.wallet < 1000) return await interaction.editReply({ content: `You need :coin: 1500 in your wallet to create a company.` });

    const nameAlreadyExists = await companiesSchema.findOne({ guildId: interaction.guildId, name: name });
    if (nameAlreadyExists) return await interaction.editReply({ content: `A company with the name \`${name}\` already exists in this server.` });

    // create the company
    await client.database.fetchCompany(interaction.guildId, interaction.member.id, name);
    await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
        $set: {
            job: "business"
        },
        $inc: {
            wallet: -1500
        }
    });

    await interaction.editReply({ content: `You succesfully created a company called \`${name}\`` });
}

module.exports.execute = async (client, interaction, data) => {
    switch (interaction.options.getSubcommand()) {
        case "info":
            return await execInfo(client, interaction, data);
        case "inventory":
            return await execInventory(client, interaction, data);
        case "add":
            return await execEmployeeAdd(client, interaction, data);
        case "fire":
            return await execEmployeeFire(client, interaction, data);
        case "set-wage":
            return await execEmployeeSetWage(client, interaction, data);
        case "set-position":
            return await execEmployeeSetPosition(client, interaction, data);
        case "create":
            return await execCreate(client, interaction, data);
        default:
            return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${data.cmd.help.name}\`.`, ephemeral: true });
    }
}

module.exports.help = {
    name: "company",
    description: "Start your own company and become richer than Elon Musk!",
    options: [
        {
            name: 'info',
            type: 'SUB_COMMAND',
            description: 'Get more info about a company.',
            options: []
        },
        {
            name: 'inventory',
            type: 'SUB_COMMAND',
            description: 'View the inventory of your company.',
            options: []
        },
        {
            name: 'employee',
            type: 'SUB_COMMAND_GROUP',
            description: 'Do stuff with employees.',
            options: [
                {
                    name: 'add',
                    type: 'SUB_COMMAND',
                    description: 'Add an employee to your company.',
                    options: [
                        {
                            name: 'user',
                            type: 'USER',
                            description: 'The user you want to add to your company.',
                            required: true
                        }
                    ]
                },
                {
                    name: 'fire',
                    type: 'SUB_COMMAND',
                    description: 'Fire an employee from your company.',
                    options: [
                        {
                            name: 'user',
                            type: 'USER',
                            description: 'The user you want to fire from your company.',
                            required: true
                        }
                    ]
                },
                {
                    name: 'set-wage',
                    type: 'SUB_COMMAND',
                    description: 'Set a wage for an employee.',
                    options: [
                        {
                            name: 'user',
                            type: 'USER',
                            description: 'The employee you want to change the wage of.',
                            required: true
                        },
                        {
                            name: 'wage',
                            type: 'INTEGER',
                            description: 'The wage of that employee. (Leave blank to reset to 15)',
                            required: false,
                            min_value: 10,
                            max_value: 200
                        }
                    ]
                },
                {
                    name: 'set-position',
                    type: 'SUB_COMMAND',
                    description: 'Give your employee a job title.',
                    options: [
                        {
                            name: 'user',
                            type: 'USER',
                            description: 'The employee you want to change the wage of.',
                            required: true
                        },
                        {
                            name: 'position',
                            type: 'STRING',
                            description: 'The position of that employee.',
                            required: true,
                            choices: [
                                {
                                    name: "Normal Employee",
                                    value: "employee",
                                    focused: true
                                },
                                {
                                    name: "Chief Operations Officier (ADMIN)",
                                    value: "admin"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            name: 'create',
            type: 'SUB_COMMAND',
            description: 'Create your own company.',
            options: [
                {
                    name: 'name',
                    type: 'STRING',
                    description: 'The name of the company you want to create.',
                    required: true
                }
            ]
        }
    ],
    category: "business",
    extraFields: [
        { name: "General Information", value: "Create a business and buy factories. You can produce items in those factories and sell them for a profit when the items are produced.", inline: false },
        { name: "Factories", value: "Factories are responsible to produce items. For more information use `/help factory`.", inline: false },
        { name: "Inventory", value: "View your inventory and sell any items. All sold items will be paid into your companies bank account. To earn money from your company please use `/work`.", inline: false }
    ],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}