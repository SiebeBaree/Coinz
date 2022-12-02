import Command from "../../structures/Command.js"
import {
    EmbedBuilder,
    ApplicationCommandOptionType,
    PermissionsBitField,
    ActionRowBuilder,
    ButtonStyle,
    ButtonBuilder,
    ComponentType
} from "discord.js"
import GuildModel from "../../models/Guild.js"
import PremiumModel from "../../models/Premium.js"
import { createMessageComponentCollector } from "../../lib/embed.js"
import Member from "../../models/Member.js"

export default class extends Command {
    info = {
        name: "premium",
        description: "Get more information and toggle premium features.",
        options: [
            {
                name: 'toggle-server',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Toggle the premium status of this server.',
                options: [
                    {
                        name: 'server-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'OPTIONAL: The server ID to toggle premium for.',
                        required: false
                    }
                ]
            },
            {
                name: 'status',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get your current premium status and the status of this server.',
                options: []
            },
            {
                name: 'buy',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Buy Coinz Premium using tickets.',
                options: []
            }
        ],
        category: "misc",
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
        if (interaction.options.getSubcommand() === "toggle-server") return await this.execToggleServer(interaction, data);
        if (interaction.options.getSubcommand() === "status") return await this.execStatus(interaction, data);
        if (interaction.options.getSubcommand() === "buy") return await this.execBuy(interaction, data);
        return await interaction.editReply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help command ${this.info.name}\`.` });
    }

    async execToggleServer(interaction, data) {
        const guildId = interaction.options.getString("server-id") || interaction.guildId;

        if (guildId !== interaction.guildId && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.editReply({ content: `Sorry, only administrators can toggle server premium.` });
        }
        const guild = await bot.database.fetchGuild(guildId);

        if (!guild.premium === true) {
            if (data.premium.premium === true && data.premium.guilds.length < data.premium.maximumGuilds) {
                await GuildModel.updateOne({ id: guildId }, { premium: true, premiumUser: interaction.member.id, premiumCooldown: Math.floor(Date.now() / 1000) + (86400 * 3) });
                await PremiumModel.updateOne({ id: interaction.member.id }, { $push: { guilds: guildId } });
            } else {
                return await interaction.editReply({ content: `Sorry, you don't have any more premium server slots on your account. Buy more premium server slots or disable premium status on existing servers.` });
            }
        } else {
            if (guild.premiumCooldown <= Math.floor(Date.now() / 1000)) {
                await GuildModel.updateOne({ id: guildId }, { premium: false, premiumUser: "", premiumCooldown: 0 });
                await PremiumModel.updateOne({ id: guild.premiumUser }, { $pull: { guilds: guildId } });
            } else {
                return await interaction.editReply({ content: `You can only change the premium status of a server every 3 days. Cooldown expires <t:${guild.premiumCooldown}:R>.` });
            }
        }

        await interaction.editReply({ content: `Successfully ${!guild.premium === true ? "enabled" : "disabled"} server premium.` });
    }

    async execStatus(interaction, data) {
        const expireTimestamp = data.premium.premiumExpiresAt > Math.floor(Date.now() / 1000) ? data.premium.premiumExpiresAt : 0;
        const guild = await bot.database.fetchGuild(interaction.guildId);

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.member.displayName || interaction.member.username}'s balance`, iconURL: `${interaction.member.displayAvatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(bot.config.embed.color)
            .setFooter({ text: bot.config.embed.footer })
            .setDescription("**Get [Coinz Premium](https://coinzbot.xyz/store) to unlock all features of Coinz!**")
            .addFields(
                {
                    name: "Your Premium Status",
                    value: data.premium.premium === true && expireTimestamp > 0 ? `Premium: :white_check_mark:\nPremium Expires: <t:${expireTimestamp}:D>\n` : "Premium: :x:",
                    inline: false
                },
                {
                    name: "Server Premium Status",
                    value: guild.premium === true ? "Premium: :white_check_mark:" : "Premium: :x:",
                    inline: false
                }
            )
        await interaction.editReply({ embeds: [embed] });
    }

    async execBuy(interaction, data) {
        const createRow = (tickets, type, disableAll = false) => {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("premium_supporter")
                    .setStyle(ButtonStyle.Success)
                    .setLabel("Buy Supporter Tier (1 month)")
                    .setDisabled(tickets < 100 || disableAll || type !== 1 && type !== 0)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("premium_server_i")
                    .setStyle(ButtonStyle.Success)
                    .setLabel("Buy Server Tier I (1 month)")
                    .setDisabled(tickets < 300 || disableAll || type !== 2 && type !== 0),
                new ButtonBuilder()
                    .setCustomId("premium_server_ii")
                    .setStyle(ButtonStyle.Success)
                    .setLabel("Buy Server Tier II (1 month)")
                    .setDisabled(tickets < 500 || disableAll || type !== 3 && type !== 0)
            );
            return [row1, row2];
        }

        const createEmbed = (tickets = 0) => {
            const embed = new EmbedBuilder()
                .setTitle("Buy Coinz Premium")
                .setColor(bot.config.embed.color)
                .setFooter({ text: bot.config.embed.footer })
                .setDescription("Get [Coinz Premium](https://coinzbot.xyz/store) to unlock all features of Coinz!\nYou can buy Coinz Premium with tickets by pressing the buttons below.\nIf you already have premium, it will add 1 month to your current subscription.")
                .addFields(
                    {
                        name: "Ticket Balance",
                        value: `<:ticket:1032669959161122976> ${tickets}`,
                        inline: false
                    },
                    {
                        name: "Supporter Tier",
                        value: "Perks: [Supporter Tier](https://coinzbot.xyz/store)\nPrice per month: $1 or <:ticket:1032669959161122976> 100 Tickets",
                        inline: false
                    },
                    {
                        name: "Server Tier I",
                        value: "Perks: [Server Tier I](https://coinzbot.xyz/store)\nPrice per month: $3 or <:ticket:1032669959161122976> 300 Tickets",
                        inline: false
                    },
                    {
                        name: "Server Tier II",
                        value: "Perks: [Server Tier II](https://coinzbot.xyz/store)\nPrice per month: $5 or <:ticket:1032669959161122976> 500 Tickets",
                        inline: false
                    }
                )
            return embed;
        }

        const message = await interaction.editReply({ embeds: [createEmbed(data.user.tickets || 0)], components: createRow(data.user.tickets || 0, data.premium.premiumType), fetchReply: true });
        const collector = createMessageComponentCollector(message, interaction, { max: 2, time: 60_000, componentType: ComponentType.Button });

        collector.on("collect", async (i) => {
            await i.deferUpdate();
            let hasBoughtPremium = false;
            let ticketCost = 0;
            let premiumTier = 0;

            if (i.customId === "premium_supporter") {
                ticketCost = 100;
                premiumTier = 1;
            } else if (i.customId === "premium_server_i") {
                ticketCost = 300;
                premiumTier = 2;
            } else if (i.customId === "premium_server_ii") {
                ticketCost = 500;
                premiumTier = 3;
            }

            if (data.premium.premiumType !== 0 && data.premium.premiumType !== data.premium.premiumTier) {
                collector.stop();
                return await i.reply({ content: "You can't buy a different premium tier while you already have premium. This feature will be supported soon!", ephemeral: true });
            }

            if (data.user.tickets >= ticketCost) {
                hasBoughtPremium = true;
            } else {
                return await i.reply({ content: "You don't have enough tickets to buy this tier.", ephemeral: true });
            }

            if (hasBoughtPremium) {
                data.user.tickets -= ticketCost;
                await Member.updateOne({ id: interaction.member.id }, { $inc: { tickets: -ticketCost } }, { upsert: true });

                if (data.premium.premium === true && data.premium.premiumExpiresAt > Math.floor(Date.now() / 1000)) {
                    await PremiumModel.updateOne(
                        { id: interaction.member.id },
                        {
                            $inc: { premiumExpiresAt: 86400 * 30 },
                            $set: { premiumType: premiumTier }
                        },
                        { upsert: true }
                    );
                } else {
                    data.premium.premium = true;
                    data.premium.premiumExpiresAt = Math.floor(Date.now() / 1000) + (86400 * 30);

                    await PremiumModel.updateOne(
                        { id: interaction.member.id },
                        { $set: { premium: true, premiumExpiresAt: Math.floor(Date.now() / 1000) + (86400 * 30), premiumType: premiumTier } },
                        { upsert: true }
                    );
                }

                if (data.premium.premiumType === 0) {
                    data.premium.premiumType = premiumTier;
                    if (premiumTier === 2) {
                        await PremiumModel.updateOne({ id: interaction.member.id }, { $set: { maximumGuilds: 1 } }, { upsert: true });
                    } else if (premiumTier === 3) {
                        await PremiumModel.updateOne({ id: interaction.member.id }, { $set: { maximumGuilds: 3 } }, { upsert: true });
                    }
                }
            }

            await interaction.editReply({ embeds: [createEmbed(data.user.tickets)], components: createRow(data.user.tickets, data.premium.premiumType) });
        });

        collector.on("end", async (i) => {
            await interaction.editReply({ components: createRow(0, 0, true) });
        });
    }
}