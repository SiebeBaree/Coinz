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
                        if ((cmd.help.category).toLowerCase() == categoryObj.category.toLowerCase()) allCommands.push(`\`${cmd.help.name}\``);
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

            const options = command.help.options;
            let usage = "";
            for (let i = 0; i < options.length; i++) {
                if (options[i].type === "SUB_COMMAND") {
                    usage += `/${command.help.name} ${options[i].name}`;
                    for (let j = 0; j < options[i].options.length; j++) {
                        usage += `${options[i].options[j].required ? " <" : " ["}${options[i].options[j].name}${options[i].options[j].required ? ">" : "]"}`
                    }
                    usage += "\n";
                } else {
                    if (i === 0) usage += `/${command.help.name}`;
                    usage += `${options[i].required ? " <" : " ["}${options[i].name}${options[i].required ? ">" : "]"}`
                }
            }

            var embed = new MessageEmbed()
                .setAuthor({ name: `Help: ${command.help.name}`, iconURL: `${client.user.avatarURL() || client.config.embed.defaultIcon}` })
                .setColor(client.config.embed.color)
                .setFooter({ text: client.config.embed.footer })
                .setDescription(command.help.description || "No Description.")
                .addFields(
                    { name: 'Command Usage', value: `\`${usage === "" ? "/" + command.help.name : usage}\``, inline: false },
                    { name: 'Cooldown', value: client.calc.msToTime(command.help.cooldown * 1000), inline: false }
                )

            let perms = [];
            command.help.botPermissions.forEach(perm => {
                perms.push(`\`${perm}\``);
            });

            embed.addField('Permissions Needed', perms.join(', '), false);

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
            .setDescription(`Want to get more information about Coinz?\nVisit our website: <${client.config.website}>\n_ _`)

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
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}