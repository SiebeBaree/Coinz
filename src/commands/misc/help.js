const { MessageEmbed } = require("discord.js");

const categories = [
    { name: "Miscellaneous", category: "misc", icon: ":wrench: " },
    { name: "Economy", category: "economy", icon: ":coin: " },
    { name: "Games", category: "games", icon: ":video_game: " },
    // { name: "Pets", category: "pets", icon: ":dog: " },
    { name: "Business", category: "business", icon: ":office: " },
    { name: "Crop Farming", category: "farming", icon: ":carrot: " },
    { name: "Stocks", category: "stocks", icon: ":chart_with_upwards_trend: " },
    // { name: "Social Media", category: "social", icon: ":mobile_phone: " },
    // { name: "Crypto Mining", category: "mining", icon: ":zap: " }
];

function addNewUsage(usage, commandName, type, optionsName, parameter, i) {
    if (type === "SUB_COMMAND") {
        usage += `\`/${commandName} ${optionsName}`;
        for (let j = 0; j < parameter.length; j++) {
            usage += `${parameter[j].required ? " <" : " ["}${parameter[j].name}${parameter[j].required ? ">" : "]"}`
        }
        usage += "`\n";
    } else {
        if (i === 0) usage += `\`/${commandName}`;
        usage += `${parameter.required ? " <" : " ["}${optionsName}${parameter.required ? ">" : "]"}`
    }

    return usage;
}

module.exports.execute = async (client, interaction, data) => {
    let commandName = interaction.options.getString('command');

    if (commandName != null) {
        let commandIsCategory = false;
        categories.forEach(categoryObj => { if (commandName.toLowerCase() == categoryObj.category.toLowerCase()) commandIsCategory = true })

        if (commandIsCategory) {
            var embed = new MessageEmbed()
                .setColor(client.config.embed.color)
                .setFooter({ text: client.config.embed.footer })

            categories.forEach(categoryObj => {
                if (categoryObj.category.toLowerCase() == commandName.toLowerCase()) {
                    embed.setTitle(`Help Category: ${categoryObj.icon || ""}${categoryObj.name}`);

                    let allCommands = [];
                    client.commands.forEach(cmd => {
                        if ((cmd.help.category).toLowerCase() == categoryObj.category.toLowerCase() && cmd.help.enabled) allCommands.push(`\`${cmd.help.name}\``);
                    });
                    if (allCommands.length) {
                        embed.setDescription(`To get more info about a command use \`/help [command]\`\n\n**All Commands:**\n${allCommands.join(", ")}`);
                    } else {
                        embed.setDescription("No commmands found in this category.");
                    }
                }
            });
        } else {
            const command = client.commands.get(commandName.toLowerCase());
            if (!command) return interaction.reply({ content: `Sorry, we couldn't find any category or command with the name \`${commandName}\`.`, ephemeral: true })

            let options = command.help.options;
            let usage = "";
            for (let i = 0; i < options.length; i++) {
                if (options[i].type === "SUB_COMMAND_GROUP") {
                    for (let j = 0; j < options[i].options.length; j++) {
                        usage = addNewUsage(usage, `${command.help.name} ${options[i].name}`, options[i].options[j].type, options[i].options[j].name, options[i].options[j].options, i);
                    }
                } else {
                    usage = addNewUsage(usage, command.help.name, options[i].type, options[i].name, options[i].options, i);
                }
            }

            var embed = new MessageEmbed()
                .setAuthor({ name: `Help: ${command.help.name}`, iconURL: `${client.user.avatarURL() || client.config.embed.defaultIcon}` })
                .setColor(client.config.embed.color)
                .setFooter({ text: client.config.embed.footer })
                .setDescription(command.help.description || "No Description.")
                .addFields(
                    { name: 'Command Usage', value: `${usage === "" ? `\`/${command.help.name}\`` : usage}`, inline: false },
                    { name: 'Cooldown', value: client.calc.msToTime(command.help.cooldown * 1000), inline: false }
                )

            let botPerms = [];
            command.help.botPermissions.forEach(perm => {
                botPerms.push(`\`${perm}\``);
            });

            let userPerms = [];
            command.help.memberPermissions.forEach(perm => {
                userPerms.push(`\`${perm}\``);
            });

            if (botPerms.length > 0) embed.addField('Permissions Required (For Bot)', botPerms.join(', '), false);
            if (userPerms.length > 0) embed.addField('Permissions Needed (For User)', userPerms.join(', '), false);

            if (command.help.extraFields !== undefined && command.help.extraFields.length > 0) {
                command.help.extraFields.forEach(field => {
                    embed.addField(field.name, field.value, field.inline);
                });
            }

            if (command.help.image !== undefined && command.help.image != "") {
                embed.setImage(command.help.image);
            }
        }

        await interaction.reply({ embeds: [embed] });
    } else {
        let embed = new MessageEmbed()
            .setAuthor({ name: "Commands List", iconURL: `${client.user.avatarURL() || client.config.embed.defaultIcon}` })
            .setColor(client.config.embed.color)
            .setFooter({ text: client.config.embed.footer })
            .setDescription(`:question: **Need help with Coinz?**\n:gear: **Visit our** [**support server**](https://discord.gg/asnZQwc6kW)**!**`)

        categories.forEach(categoryObj => {
            embed.addField(`${categoryObj.icon || ""}${categoryObj.name}`, `\`/help ${categoryObj.category}\``, true);
        });

        return await interaction.reply({ embeds: [embed] });
    }
}

module.exports.help = {
    name: "help",
    description: "Get a list of all commands. To get more info about a specific command use `/help <command>`.",
    options: [
        {
            name: 'command',
            type: 'STRING',
            description: 'The category or command you want more info on.',
            required: false
        }
    ],
    category: "misc",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}