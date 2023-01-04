import { ActionRowBuilder, APIEmbedField, ApplicationCommandOptionType, ChatInputCommandInteraction, ColorResolvable, ComponentType, EmbedBuilder, StringSelectMenuBuilder, Collection, APIApplicationCommandOption } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Helpers from "../../utils/Helpers";
import { readdirSync, readFileSync } from "fs";
import { ILoot, ILootCategory } from "../../interfaces/ILoot";

export default class extends Command implements ICommand {
    guides = {
        "Getting Started": [
        ],
        "Investing": [
        ],
        "Farming": [
        ],
        "Business": [
        ],
        "Premium": [
        ],
    } as Record<string, APIEmbedField[]>;

    readonly info = {
        name: "help",
        description: "Get a list of all commands or get more info about a specific command.",
        options: [
            {
                name: "command",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Get more information about a specific command.",
                options: [
                    {
                        name: "command",
                        type: ApplicationCommandOptionType.String,
                        description: "The command you want to get more information about.",
                        required: true,
                    },
                ],
            },
            {
                name: "categories",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Get all possible commands in a specific category.",
                options: [],
            },
            {
                name: "guide",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Get a guide on how to use the bot.",
                options: [
                    {
                        name: "topic",
                        type: ApplicationCommandOptionType.String,
                        description: "The topic you want to get more information from.",
                        required: false,
                        choices: Object.keys(this.guides).map((key) => {
                            return {
                                name: key,
                                value: key,
                            };
                        }),
                    },
                ],
            },
            {
                name: "loot",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Get a list of all possible loot from a command.",
                options: [
                    {
                        name: "command",
                        type: ApplicationCommandOptionType.String,
                        description: "The command you want to get all possible loot from.",
                        required: true,
                        choices: [
                            {
                                name: "Fish",
                                value: "fish",
                            },
                            {
                                name: "Hunt",
                                value: "hunt",
                            },
                        ],
                    },
                ],
            },
        ],
        category: "misc",
    };

    categories = [
        { name: "Miscellaneous", category: "misc", icon: "🔧" },
        { name: "General", category: "general", icon: "🪙" },
        { name: "Games", category: "games", icon: "🎮" },
        { name: "Business", category: "business", icon: "🏢" },
        { name: "Investing", category: "investing", icon: "📈" },
    ];

    lootTables = new Collection<string, ILoot>();

    constructor(bot: Bot, file: string) {
        super(bot, file);

        const files = readdirSync(`${__dirname}/../../assets/loot`);
        files.forEach((_file) => {
            if (_file.endsWith(".json")) {
                const lootTable = JSON.parse(readFileSync(`${__dirname}/../../assets/loot/${_file}`, "utf-8")) as ILoot;
                this.lootTables.set(_file.replace(".json", ""), lootTable);
            }
        });
    }

    async execute(interaction: ChatInputCommandInteraction) {
        switch (interaction.options.getSubcommand()) {
            case "categories":
                await this.getCategories(interaction);
                break;
            case "command":
                await this.getCommand(interaction);
                break;
            case "guide":
                await this.getGuide(interaction);
                break;
            case "loot":
                await this.getLoot(interaction);
                break;
            default:
                await interaction.reply({ content: this.client.config.invalidCommand, ephemeral: true });
        }
    }

    async getCategories(interaction: ChatInputCommandInteraction) {
        const getSelectMenu = (defaultLabel = this.categories[0].category, isDisabled = false) => {
            const options = this.categories.map((cat) => {
                return {
                    label: cat.name,
                    value: cat.category,
                    emoji: cat.icon,
                    default: cat.category === defaultLabel,
                };
            });

            return new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("help-categories")
                        .setPlaceholder("Select a category")
                        .addOptions(options)
                        .setDisabled(isDisabled),
                );
        };

        const getEmbed = (category: string) => {
            const embed = new EmbedBuilder()
                .setAuthor({ name: `Commands for ${this.categories.filter((cat) => cat.category === category).map((cat) => `${cat.icon} ${cat.name}`).join("")}`, iconURL: this.client.user?.avatarURL() || this.client.config.embed.icon })
                .setColor(<ColorResolvable>this.client.config.embed.color)
                .setFooter({ text: this.client.config.embed.footer })
                .setDescription(":question: **Don't know where to begin? Use** </help guide:983096143439335467>\n:gear: **Visit our** [**support server**](https://discord.gg/asnZQwc6kW)**!**\n:bulb: **More info about a command: ** `/help command <command>`");

            const commands = this.client.commands.filter((cmd) => cmd.info.category === category && cmd.info.enabled !== false);

            embed.addFields({
                name: "Commands",
                value: commands.size > 0 ? commands.map((cmd) => `\`${cmd.info.name}\``).join(", ") : "No commands found.",
                inline: false,
            });

            return embed;
        };

        let category = this.categories[0].category;
        const message = await interaction.reply({ embeds: [getEmbed(category)], components: [getSelectMenu(category)], fetchReply: true });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, max: 7, time: 90_000, componentType: ComponentType.StringSelect });

        collector.on("collect", async (i) => {
            if (i.customId === "help-categories") {
                category = i.values[0];
                await i.update({ embeds: [getEmbed(category)], components: [getSelectMenu(category)] });
            }
        });

        collector.on("end", async () => {
            await interaction.editReply({ components: [getSelectMenu(category, true)] });
        });
    }

    async getCommand(interaction: ChatInputCommandInteraction) {
        const commandName = interaction.options.getString("command", true).toLowerCase();
        const command = this.client.commands.get(commandName);

        if (!command) {
            return await interaction.reply({ content: `\`/${commandName}\` is not a valid command. Use </help categories:983096143439335467> to view all commands.`, ephemeral: true });
        }

        const usage = this.getCommandUsage(command.info.name, command.info.options as APIApplicationCommandOption[]);

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Help: ${command.info.name}`, iconURL: this.client.user?.avatarURL() || this.client.config.embed.icon })
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setFooter({ text: this.client.config.embed.footer })
            .setDescription(":question: **Don't know where to begin? Use** </help guide:983096143439335467>\n:gear: **Visit our** [**support server**](https://discord.gg/asnZQwc6kW)**!**")
            .addFields(
                { name: "Description", value: ">>> " + (command.info.helpDescription ?? command.info.description ?? "No Description."), inline: false },
                { name: "Command Usage", value: usage, inline: false },
                {
                    name: "Cooldown",
                    value: command.info.cooldown !== undefined ?
                        Helpers.msToTime(command.info.cooldown * 1000) :
                        `**Default:** \`${this.client.config.defaultTimeout}s\`\n**Premium:** \`${this.client.config.premiumTimeout}s\``,
                    inline: false,
                },
            );

        if (command.info.extraFields !== undefined) {
            command.info.extraFields.forEach(field => {
                embed.addFields({ name: field.name, value: field.value, inline: field.inline });
            });
        }

        if (command.info.image !== undefined) {
            embed.setImage(command.info.image);
        }

        await interaction.reply({ embeds: [embed] });
    }

    async getGuide(interaction: ChatInputCommandInteraction) {
        const topic = interaction.options.getString("topic")?.toLowerCase() ?? Object.keys(this.guides)[0];

        const embed = new EmbedBuilder()
            .setTitle(`${topic} Guide`)
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setFooter({ text: this.client.config.embed.footer })
            .setDescription(":question: **If you still have a question please visit our** [**support server**](https://discord.gg/asnZQwc6kW)**!**\n:globe_with_meridians: **Don't forget to check out our** [**website**](${bot.config.website})**!**")
            .addFields(this.guides[topic]);
        await interaction.reply({ embeds: [embed] });
    }

    async getLoot(interaction: ChatInputCommandInteraction) {
        const command = interaction.options.getString("command", true).toLowerCase();

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Loot Table for ${command}`, iconURL: this.client.user?.avatarURL() || this.client.config.embed.icon })
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setFooter({ text: this.client.config.embed.footer });

        const lootTable = this.lootTables.get(command);

        if (!lootTable) {
            return await interaction.reply({ content: `\`${command}\` is not a valid command. Use </help categories:983096143439335467> to view all commands.`, ephemeral: true });
        }

        if (lootTable.hard) embed.addFields({ name: command === "fish" ? "Premium Fishing Rod" : "HARD", value: this.getLootFieldValue(lootTable.hard), inline: true });
        if (lootTable.medium) embed.addFields({ name: "MEDIUM", value: this.getLootFieldValue(lootTable.medium), inline: true });
        if (lootTable.easy) embed.addFields({ name: command === "fish" ? "Fishing Rod" : "EASY", value: this.getLootFieldValue(lootTable.easy), inline: true });

        await interaction.reply({ embeds: [embed] });
    }

    private getCommandUsage(commandName: string, options: APIApplicationCommandOption[], insert = ""): string {
        let usage = "";

        for (let i = 0; i < options.length; i++) {
            const option = options[i];

            if ((option.type === ApplicationCommandOptionType.SubcommandGroup || option.type === ApplicationCommandOptionType.Subcommand) && option.options) {
                if (option.options.length <= 0) {
                    usage += `\`/${commandName} ${option.name}\`\n`;
                } else {
                    usage += this.getCommandUsage(commandName, option.options, ` ${option.name}`) + "\n";
                }
            } else {
                if (usage === "") {
                    usage += `\`/${commandName}${insert}`;
                }

                usage += ` ${this.getRequiredSyntax(option.name, option.required)}`;
            }
        }

        usage = usage.trim();
        return usage === "" ? `\`/${commandName}\`` : usage.endsWith("`") ? usage : usage + "`";
    }

    private getRequiredSyntax(name: string, isRequired = false): string {
        return isRequired ? `<${name}>` : `[${name}]`;
    }

    private getLootFieldValue(loot: ILootCategory): string {
        return loot.success.loot.map(itemId => {
            const item = this.client.items.getById(itemId);
            if (!item) return "";
            return `<:${item.itemId}:${item.emoteId}> **${item.name}**${item.sellPrice ? ` ― :coin: ${item.sellPrice}` : ""}`;
        }).join("\n");
    }
}