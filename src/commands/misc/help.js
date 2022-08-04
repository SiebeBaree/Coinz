const Command = require('../../structures/Command.js');
const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");

class Help extends Command {
    info = {
        name: "help",
        description: "Get a list of all commands. To get more info about a specific command use `/help <command>`.",
        options: [
            {
                name: 'command',
                type: ApplicationCommandOptionType.String,
                description: 'The category or command you want more info on.',
                required: false
            }
        ],
        category: "misc",
        extraFields: [],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 0,
        enabled: true
    };

    categories = [
        { name: "Miscellaneous", category: "misc", icon: ":wrench: " },
        { name: "Economy", category: "economy", icon: ":coin: " },
        { name: "Games", category: "games", icon: ":video_game: " },
        { name: "Business", category: "business", icon: ":office: " },
        { name: "Crop Farming", category: "farming", icon: ":carrot: " },
        { name: "Investing", category: "investing", icon: ":chart_with_upwards_trend: " },
    ];

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        let commandName = interaction.options.getString('command');

        if (commandName != null) {
            let commandIsCategory = false;
            this.categories.forEach(categoryObj => { if (commandName.toLowerCase() == categoryObj.category.toLowerCase()) commandIsCategory = true })

            if (commandIsCategory) {
                var embed = new EmbedBuilder()
                    .setColor(bot.config.embed.color)
                    .setFooter({ text: bot.config.embed.footer })

                this.categories.forEach(categoryObj => {
                    if (categoryObj.category.toLowerCase() == commandName.toLowerCase()) {
                        embed.setTitle(`Help Category: ${categoryObj.icon || ""}${categoryObj.name}`);

                        let allCommands = [];
                        for (const num of bot.commands) {
                            if ((num[1].info.category).toLowerCase() == categoryObj.category.toLowerCase() && num[1].info.enabled) allCommands.push(`\`${num[1].info.name}\``);
                        }

                        if (allCommands.length) {
                            embed.setDescription(`To get more info about a command use \`/help [command]\`\n\n**All Commands:**\n${allCommands.join(", ")}`);
                        } else {
                            embed.setDescription("No commmands found in this category.");
                        }
                    }
                });
            } else {
                const command = bot.commands.get(commandName.toLowerCase());
                if (!command) return interaction.reply({ content: `Sorry, we couldn't find any category or command with the name \`${commandName}\`.`, ephemeral: true })

                let options = command.info.options;
                let usage = "";
                for (let i = 0; i < options.length; i++) {
                    if (options[i].type === ApplicationCommandOptionType.SubcommandGroup) {
                        for (let j = 0; j < options[i].options.length; j++) {
                            usage = this.addNewUsage(usage, `${command.info.name} ${options[i].name}`, options[i].options[j].type, options[i].options[j].name, options[i].options[j], i);
                        }
                    } else {
                        usage = this.addNewUsage(usage, command.info.name, options[i].type, options[i].name, options[i], i);
                    }
                }

                usage = usage.trim();
                if (!usage.endsWith('`')) usage += "`";

                var embed = new EmbedBuilder()
                    .setAuthor({ name: `Help: ${command.info.name}`, iconURL: `${bot.user.avatarURL() || bot.config.embed.defaultIcon}` })
                    .setColor(bot.config.embed.color)
                    .setFooter({ text: bot.config.embed.footer })
                    .setDescription(command.info.description || "No Description.")
                    .addFields(
                        { name: 'Command Usage', value: `${usage === "`" ? `\`/${command.info.name}\`` : usage}`, inline: false },
                        { name: 'Cooldown', value: `${command.info.cooldown > 0 ? bot.tools.msToTime(command.info.cooldown * 1000) : `${bot.config.defaultTimeout}s`}`, inline: false }
                    )

                let botPerms = [];
                command.info.botPermissions.forEach(perm => {
                    botPerms.push(`\`${perm}\``);
                });

                let userPerms = [];
                command.info.memberPermissions.forEach(perm => {
                    userPerms.push(`\`${perm}\``);
                });

                if (botPerms.length > 0) embed.addFields([
                    { name: 'Permissions Required (For Bot)', value: otPerms.join(', '), inline: false }
                ]);
                if (userPerms.length > 0) embed.addFields([
                    { name: 'Permissions Needed (For User)', value: userPerms.join(', '), inline: false }
                ]);

                if (command.info.extraFields !== undefined && command.info.extraFields.length > 0) {
                    command.info.extraFields.forEach(field => {
                        embed.addFields([{ name: field.name, value: field.value, inline: field.inline }]);
                    });
                }

                if (command.info.image !== undefined && command.info.image != "") {
                    embed.setImage(command.info.image);
                }
            }

            await interaction.reply({ embeds: [embed] });
        } else {
            let embed = new EmbedBuilder()
                .setAuthor({ name: "Commands List", iconURL: `${bot.user.avatarURL() || bot.config.embed.defaultIcon}` })
                .setColor(bot.config.embed.color)
                .setFooter({ text: bot.config.embed.footer })
                .setDescription(`:question: **Don't know where to begin? Use** \`/guide\`\n:gear: **Visit our** [**support server**](https://discord.gg/asnZQwc6kW)**!**`)

            this.categories.forEach(categoryObj => {
                embed.addFields([
                    { name: `${categoryObj.icon || ""}${categoryObj.name}`, value: `\`/help ${categoryObj.category}\``, inline: true }
                ]);
            });

            return await interaction.reply({ embeds: [embed] });
        }
    }

    addNewUsage(usage, commandName, type, optionsName, parameter, i) {
        if (type === ApplicationCommandOptionType.Subcommand) {
            parameter = parameter.options;
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
}

module.exports = Help;