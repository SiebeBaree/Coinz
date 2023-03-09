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
            { name: "What is Coinz?", value: "Coinz is a discord economy bot with unique features that will never make you bored! Server owners can make their server more active, users will click on your server more and maybe stay and start a conversation with your members.", inline: false },
            { name: "How to start using Coinz?", value: "Just started using Coinz and don't know what to do? No worries, we'll help you! The goal of Coinz is to make money. You can check your balance using </balance:1074380587751710793> and make money using </job work:1074380588187922514>, </beg:1074380587751710794>, </fish:1074380587751710797> or play minigames. To get a list of all commands use </help categories:1074380588187922519>", inline: false },
            { name: "Get more information for a command", value: "To get more information like the paramets, command examples, cooldown and more you can use </help command:1074380588187922519>.", inline: false },
            { name: "Voting", value: "Voting for a Discord bot on Top.gg and Discordbotlist.com (using </vote:1074380588393439263>) supports the bot developer and earns you a free Lucky Wheel spin with each vote. It's a great way to help your favorite bots gain more visibility and reach new heights in the community.", inline: false },
        ],
        "Investing": [
            { name: "What is investing?", value: "Investing is buying something and selling it later for a profit. In Coinz you can invest in real companies or crypto currencies using </invest info:1074380588187922515>.", inline: false },
            { name: "What are tickers?", value: "Tickers are the short name for a Stock or Crypto Currency. For example the ticker of Google is `GOOG` and for Bitcoin it is `BTC`. You can view the tickers online or using </invest info:1074380588187922515>.", inline: false },
            { name: "Does this feature use real money", value: "No, the prices are real but you can only spend Coinz money for this feature. This means if you want to buy the stock or crypto for real (with a real broker) the prices should be (almost) the same. You can use this feature to invest without real-life consequences.", inline: false },
            { name: "Are these prices updated real-time?", value: "Yes, the prices are updated multiple times each day. This ensures real prices and simulates a real-life trading system. Stocks are updated 2x every open hour and are the same as the US$ price, Crypto is updated every 3 minutes and use the EUR price from the Bitvavo API.", inline: false },
            { name: "Can you add a new stock or crypto?", value: "We're currently not adding any more stocks or crypto to this feature. Once we decide to remove and/or add new investments we'll let you know in an announcement in our [support server](https://discord.gg/asnZQwc6kW).", inline: false },
        ],
        "Farming": [
            { name: "Where to buy crops?", value: "You can buy crops using </shop buy:1074380587969822826>. To get a list of all crops and their grow times use </shop info:1074380587969822826> and select the `Crops` category.", inline: false },
            { name: "Buying Plots", value: "To start farming you will first need to buy a plot, to buy a plot use </farm plots:1074380587508445275> and buy your first plot, if you have enough money in your wallet.", inline: false },
            { name: "Future Plans", value: "We're planning to add more crops and update the watering system. In the future you won't get an extra 1 hour boost for watering your crops. You will have to water your crops to not let them die. We'll also introduce the use of fertilizer and tractors for your plots. Fertilizer will replace the current watering system and tractors will harvest your crops when they are done and plant new crops for you (until the tractor breaks down).", inline: false },
        ],
        "Business": [
            { name: "How to start my own business?", value: "To start a business you need to be at least level 15 and have a minimum of :coin: 4000 in your wallet. You cannot own or work at any other business and some jobs are uncompatible with a bussines. If you qualify for a business you can create one using </business create:1074380587508445276>.", inline: false },
            { name: "How to get rich from my business?", value: "You can make money from your factories. It works the same as the farming feature but you sometimes need required items to produce another item. To pay everyone in your business use </business pay-dividends:1074380587508445276>. To earn more use </business employee set-payout:1074380587508445276> and increase the % you make from your business.", inline: false },
            { name: "What can employees do?", value: "Employees can increase the maximum number of factories your business can own and operate. They can also start producing items on your factories and buy new factories for your business. If you promote them, they can sell items and buy (or steal) supplies.", inline: false },
        ],
        "Premium": [
            { name: "Feature Coming Soon", value: "We've implemented the premium commands in the bot but we're having trouble with our website. This means you cannot buy a premium subscription at the moment.", inline: false },
            // { name: "", value: "", inline: false },
            // { name: "", value: "", inline: false },
            // { name: "", value: "", inline: false },
            // { name: "", value: "", inline: false },
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
                .setDescription(":question: **Don't know where to begin? Use** </help guide:1074380588187922519>\n:gear: **Visit our** [**support server**](https://discord.gg/asnZQwc6kW)**!**\n:bulb: **More info about a command: ** `/help command <command>`");

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

        if (!command || command.info.category === "admin") {
            return await interaction.reply({ content: `\`/${commandName}\` is not a valid command. Use </help categories:1074380588187922519> to view all commands.`, ephemeral: true });
        }

        const usage = this.getCommandUsage(command.info.name, command.info.options as APIApplicationCommandOption[]);

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Help: ${command.info.name}`, iconURL: this.client.user?.avatarURL() || this.client.config.embed.icon })
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setFooter({ text: this.client.config.embed.footer })
            .setDescription(":question: **Don't know where to begin? Use** </help guide:1074380588187922519>\n:gear: **Visit our** [**support server**](https://discord.gg/asnZQwc6kW)**!**")
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
            return await interaction.reply({ content: `\`${command}\` is not a valid command. Use </help categories:1074380588187922519> to view all commands.`, ephemeral: true });
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