const Command = require('../../structures/Command.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ApplicationCommandOptionType, Colors } = require('discord.js');
const MemberModel = require('../../models/Member');
const CompanyModel = require('../../models/Company');
const positions = require('../../assets/companyPositions.json');

function calcWorth(inventory, factories) {
    let worth = 0;

    for (let i = 0; i < inventory.length; i++) {
        const item = bot.tools.getProduct(inventory[i].itemId);
        if (item !== null && item !== undefined) worth += item.sellPrice * inventory[i].quantity;
    }

    return Math.round(worth + (factories * 500));
}

function getEmployees(employees) {
    let employeesStr = "";

    for (let i = 0; i < employees.length; i++) {
        employeesStr += `${positions[employees[i].role].name} <@${employees[i].userId}> - Wage: :coin: ${employees[i].wage}\n`;
    }

    return employeesStr === "" ? "No Employees Found!" : employeesStr;
}

class Company extends Command {
    info = {
        name: "company",
        description: "Start your own company and become richer than Elon Musk!",
        options: [
            {
                name: 'info',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get more info about a company.',
                options: []
            },
            {
                name: 'inventory',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'View the inventory of your company.',
                options: []
            },
            {
                name: 'employee',
                type: ApplicationCommandOptionType.SubcommandGroup,
                description: 'Do stuff with employees.',
                options: [
                    {
                        name: 'add',
                        type: ApplicationCommandOptionType.Subcommand,
                        description: 'Add an employee to your company.',
                        options: [
                            {
                                name: 'user',
                                type: ApplicationCommandOptionType.User,
                                description: 'The user you want to add to your company.',
                                required: true
                            }
                        ]
                    },
                    {
                        name: 'fire',
                        type: ApplicationCommandOptionType.Subcommand,
                        description: 'Fire an employee from your company.',
                        options: [
                            {
                                name: 'user',
                                type: ApplicationCommandOptionType.User,
                                description: 'The user you want to fire from your company.',
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
                                description: 'The wage of that employee. (Leave blank to reset to 15)',
                                required: false,
                                min_value: 10,
                                max_value: 200
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
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Create your own company.',
                options: [
                    {
                        name: 'name',
                        type: ApplicationCommandOptionType.String,
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
            { name: "Inventory", value: "View your inventory and sell any items. All sold items will be paid into your companies bank account. To earn money from your company please use </work:983096143284174864>.", inline: false }
        ],
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
            case "info":
                return await this.execInfo(interaction, data);
            case "inventory":
                return await this.execInventory(interaction, data);
            case "add":
                return await this.execEmployeeAdd(interaction, data);
            case "fire":
                return await this.execEmployeeFire(interaction, data);
            case "set-wage":
                return await this.execEmployeeSetWage(interaction, data);
            case "set-position":
                return await this.execEmployeeSetPosition(interaction, data);
            case "create":
                return await this.execCreate(interaction, data);
            default:
                return await interaction.editReply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${this.info.name}\`.` });
        }
    }

    async execInfo(interaction, data) {
        data = await bot.tools.hasCompany(interaction.member.id, data);
        const company = data.company;
        if (!company) return await interaction.editReply({ content: `You might want to create a company to use this command. Please create one using </${this.info.name} create:993095062726647808>.` });

        const embed = async function (company) {
            let em = new EmbedBuilder()
                .setAuthor({ name: `Company: ${company.name}` })
                .setColor(bot.config.embed.color)
                .addFields(
                    { name: 'Information', value: `:sunglasses: **Owner:** <@${company.id}>\n:credit_card: **Bank Balance:** :coin: ${company.balance}\n:moneybag: **Worth:** :coin: ${calcWorth(company.inventory, company.factories.length)}\n:factory: **Factories:** \`${company.factories.length}\``, inline: false },
                    { name: 'Employees', value: getEmployees(company.employees), inline: false },
                    { name: 'Your Information', value: `**Position:** ${positions[data.employee.role.toLowerCase()].name}\n**Wage:** :coin: ${data.employee.wage}`, inline: false }
                )
            return em;
        }

        const row = function (data, disabled = false) {
            if (data.isEmployee === true) {
                let r = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("company_leave")
                        .setLabel("Leave Company")
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(disabled)
                );
                return r;
            } else {
                let r = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("company_sell")
                        .setLabel("Sell Company")
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(disabled)
                );
                return r;
            }
        }

        const interactionMessage = await interaction.editReply({ embeds: [await embed(company)], components: [row(data)], fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { time: 20000 });

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();

            if (interactionCollector.customId === 'company_sell') {
                const worth = calcWorth(company.inventory, company.factories.length);
                await MemberModel.updateOne({ id: interaction.member.id }, { $set: { job: "" } });
                await CompanyModel.deleteOne({ id: interaction.member.id });
                await bot.tools.addMoney(interaction.member.id, worth);

                return await interaction.followUp({ content: `You sold \`${company.name}\` for :coin: ${worth}. Let's buy a yacht and do nothing with your live...` });
            } else if (interactionCollector.customId === 'company_leave') {
                await MemberModel.updateOne({ id: interaction.member.id }, { $set: { job: "" } });
                await this.removeEmployee(company, interaction.member.id);

                return await interaction.followUp({ content: `You left ${company.name}. Go find a new job before you're broke!` });
            }

            await interaction.editReply({ embeds: [await embed(company)], components: [row(data, true)] });
        })

        collector.on('end', async (interactionCollector) => {
            await interaction.editReply({ components: [row(data, true)] });
        })
    }

    async execInventory(interaction, data) {
        data = await bot.tools.hasCompany(interaction.member.id, data);
        if (!data.company) return await interaction.editReply({ content: `To view your companies inventory you may need a company? Am I right? Please create one using </${this.info.name} create:993095062726647808>.` });

        const embed = async function (company) {
            let inventory = "";

            for (let i = 0; i < company.inventory.length; i++) {
                const item = bot.tools.getProduct(company.inventory[i].itemId);
                if (item !== undefined) inventory += `**${company.inventory[i].quantity}x** <:${item.itemId}:${item.emoteId}> ${item.name}\n`;
            }

            let em = new EmbedBuilder()
                .setAuthor({ name: `Inventory of ${company.name}` })
                .setColor(bot.config.embed.color)
                .setDescription(`:credit_card: **Bank Balance:** :coin: ${company.balance}\n:moneybag: **Total Inventory Worth:** :coin: ${calcWorth(company.inventory, 0)}`)
                .addFields({ name: "Inventory", value: inventory === "" ? "Your company has no inventory." : inventory, inline: false })
            return em;
        }

        if (data.employee.role !== "ceo" && data.employee.role !== "admin") return await interaction.editReply({ embeds: [await embed(data.company)] });

        const row = function (data, disabled = false) {
            if (data.company.inventory.length <= 0) disabled = true;

            let r = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("company_sellInventory")
                    .setLabel("Sell Inventory")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(disabled)
            );
            return r;
        }

        const interactionMessage = await interaction.editReply({ embeds: [await embed(data.company)], components: [row(data)], fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { time: 20000 });

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();

            if (interactionCollector.customId === 'company_sellInventory') {
                data.company.balance += calcWorth(data.company.inventory, 0);
                data.company.inventory = [];

                await CompanyModel.updateOne({ id: data.company.id }, {
                    $set: {
                        inventory: [],
                        balance: data.company.balance
                    }
                })
            }

            await interaction.editReply({ embeds: [await embed(data.company)], components: [row(data, true)] });
        })

        collector.on('end', async (interactionCollector) => {
            await interaction.editReply({ components: [row(data, true)] });
        })
    }

    async execEmployeeAdd(interaction, data) {
        const user = interaction.options.getUser('user');
        data = await bot.tools.hasCompany(interaction.member.id, data);
        const company = data.company;

        if (!company) return await interaction.editReply({ content: `You don't have a company. Please create one using </${this.info.name} create:993095062726647808>.` });
        if (data.employee.role !== "ceo" && data.employee.role !== "admin") return await interaction.editReply({ content: `You don't have the power to hire new people.` });

        if (user.bot) return await interaction.editReply({ content: `Do you really want to invite a bot?! I don't think so. The bots don't want to work for your company...` });
        if (user.id === interaction.member.id) return await interaction.editReply({ content: `Why are you trying to invite yourself?!` });
        if (company.employees.length >= 5) return await interaction.editReply({ content: `You are not Apple. Please don't invite the whole world...\nYou already have the maximum allowed staff for a company. Check your employees using </${this.info.name} info:993095062726647808>` });
        for (let i = 0; i < company.employees.length; i++) {
            if (company.employees[i].userId === user.id) {
                return await interaction.editReply({ content: `You really want to invite this user? That's already an employee of your company...` });
            }
        }

        const employeeData = await bot.database.fetchMember(user.id);
        if (employeeData.job.startsWith("business")) return await interaction.editReply({ content: `That user is already working for another company.` });

        data.interactionHasEnded = false;

        const confirmEmbed = new EmbedBuilder()
            .setAuthor({ name: `Join ${company.name}?` })
            .setColor(bot.config.embed.color)
            .setDescription(`${user.username}, do you want to work for ${company.name} (Owner: <@${company.id}>)\nYou have 30 seconds to respond. If you want to deny, don't press anything!`)

        const row = function (disabled = false) {
            const r = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("company_addEmployee")
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

        const collector = interactionMessage.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();

            if (interactionCollector.customId === 'company_addEmployee') {
                data.interactionHasEnded = true;
                const respondsEmbed = new EmbedBuilder()
                    .setAuthor({ name: `${company.name} just got another employee!` })
                    .setColor(Colors.Green)
                    .setDescription(`<@${user.id}> has signed a contract with \`${company.name}\`.`)

                await MemberModel.updateOne({ id: user.id }, {
                    $set: {
                        job: `business-${company.id}`
                    }
                });

                await CompanyModel.updateOne({ id: company.id }, {
                    $push: {
                        employees: {
                            userId: user.id,
                            role: "employee",
                            wage: positions["employee"].defaultWage
                        }
                    }
                });

                if (company.employees.length + 1 >= 5) await MemberModel.updateOne({ id: interaction.member.id }, { $push: { badges: "going_places" } });
                return await interaction.editReply({ embeds: [respondsEmbed], components: [row(true)] });
            }
        })

        collector.on('end', async (interactionCollector) => {
            if (!data.interactionHasEnded) {
                const respondsEmbed = new EmbedBuilder()
                    .setAuthor({ name: `${user.username} has denied the invitation of ${company.name}` })
                    .setColor(Colors.Red)
                    .setDescription(`<@${user.id}> won't be working for \`${company.name}\`.`)

                await interaction.editReply({ embeds: [respondsEmbed], components: [row(true)] });
            }
        })
    }

    async execEmployeeFire(interaction, data) {
        const user = interaction.options.getUser('user');
        data = await bot.tools.hasCompany(interaction.member.id, data);
        const company = data.company;

        if (!company) return await interaction.editReply({ content: `You don't have a company. Please create one using </${this.info.name} create:993095062726647808>.` });
        if (data.employee.role !== "ceo" && data.employee.role !== "admin") return await interaction.editReply({ content: `You don't have the power to fire employees.` });
        if (user.id === interaction.member.id) return await interaction.editReply({ content: `Why do you want to fire yourself?!` });
        if (user.id === company.id) return await interaction.editReply({ content: `You can't invite the CEO of this company...` });

        let removedEmployee = false;
        for (let i = 0; i < company.employees.length; i++) {
            if (company.employees[i].userId === user.id) {
                removedEmployee = true;

                await MemberModel.updateOne({ id: user.id }, {
                    $set: {
                        job: ""
                    }
                });

                await this.removeEmployee(company, user.id);
                break;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`Fire Employee`)
            .setColor(Colors.Red)
            .setDescription(removedEmployee ? `You fired ${user.username}#${user.discriminator} from your company.` : `<@${user.id}> is not an employee of your company.`)
        await interaction.editReply({ embeds: [embed] });
    }

    async execEmployeeSetWage(interaction, data) {
        const user = interaction.options.getUser('user');
        const wage = interaction.options.getInteger('wage');
        data = await bot.tools.hasCompany(interaction.member.id, data);
        const company = data.company;

        if (!company) return await interaction.editReply({ content: `You don't have a company. Please create one using </${this.info.name} create:993095062726647808>.` });
        if (data.employee.role !== "ceo" && data.employee.role !== "admin") return await interaction.editReply({ content: `You don't have the power to set wages.` });

        let employeeExists = false;
        for (let i = 0; i < company.employees.length; i++) {
            if (company.employees[i].userId === user.id) {
                employeeExists = true;
                await CompanyModel.updateOne({ id: company.id, 'employees.userId': user.id }, {
                    $set: {
                        "employees.$.wage": wage
                    }
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

    async execEmployeeSetPosition(interaction, data) {
        const user = interaction.options.getUser('user');
        data = await bot.tools.hasCompany(interaction.member.id, data);
        const company = data.company;

        if (!company) return await interaction.editReply({ content: `You don't have a company. Please create one using </${this.info.name} create:993095062726647808>.` });
        if (data.employee.role !== "ceo" && data.employee.role !== "admin") return await interaction.editReply({ content: `You don't have the power to set positions.` });
        if (user.id === company.id) return await interaction.editReply({ content: `You can't change the position of the CEO.` });

        const position = positions[interaction.options.getString('position')];

        let employeeExists = false;
        for (let i = 0; i < company.employees.length; i++) {
            if (company.employees[i].userId === user.id) {
                employeeExists = true;
                await CompanyModel.updateOne({ id: company.id, 'employees.userId': user.id }, {
                    $set: {
                        "employees.$.role": interaction.options.getString('position')
                    }
                });
                break;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`Set Position`)
            .setColor(bot.config.embed.color)
            .setDescription(employeeExists ? `You set the position of ${user.username}#${user.discriminator} to ${position.name}.` : `<@${user.id}> is not an employee of your company.`)
        await interaction.editReply({ embeds: [embed] });
    }

    async execCreate(interaction, data) {
        data = await bot.tools.hasCompany(interaction.member.id, data);
        const company = data.company;
        if (company) return await interaction.editReply({ content: `You already have a company! If you don't know how this feature works, please use \`/help ${this.info.name}\`.` });

        if (data.user.job.startsWith("business")) {
            await MemberModel.updateOne({ id: interaction.member.id }, {
                $set: {
                    job: ""
                }
            });
        } else if (data.user.job !== "") {
            return await interaction.editReply({ content: `You already have a job. Please leave your job to create a company!` });
        }

        const name = interaction.options.getString('name').trim();
        if (name.length > 32) return await interaction.editReply({ content: `You can only use a maximum of 32 characters for your company name.` });
        if (!/^[A-Za-z][a-zA-Z0-9 _-]*$/.test(name)) return await interaction.editReply({ content: `Your company name can only use \`A-Z, a-z, 0-9, whitespaces, -, _\` and you have to start with a letter.` });
        if (data.user.wallet < 3000) return await interaction.editReply({ content: `You need :coin: 3000 in your wallet to create a company.` });

        const nameAlreadyExists = await CompanyModel.findOne({ name: name });
        if (nameAlreadyExists) return await interaction.editReply({ content: `A company with the name \`${name}\` already exists. Please choose another name.` });

        // create the company
        await bot.database.fetchCompany(interaction.member.id, name);
        await MemberModel.updateOne({ id: interaction.member.id }, {
            $set: {
                job: "business"
            },
            $inc: {
                wallet: -1500
            }
        });

        await interaction.editReply({ content: `You succesfully created a company called \`${name}\`` });
    }

    async removeEmployee(company, employeeId) {
        await CompanyModel.updateOne({ id: company.id }, {
            $pull: {
                employees: { userId: employeeId }
            }
        })
    }
}

module.exports = Company;