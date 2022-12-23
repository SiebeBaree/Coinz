import Command from "../../structures/Command.js"
import {
    EmbedBuilder,
    ApplicationCommandOptionType,
    ActionRowBuilder,
    ButtonStyle,
    ButtonBuilder,
    ComponentType
} from "discord.js"
import PremiumModel from "../../models/Premium.js"
import { createMessageComponentCollector } from "../../lib/embed.js"
import Member from "../../models/Member.js"

export default class extends Command {
    info = {
        name: "premium",
        description: "Get more information and toggle premium features.",
        options: [
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
        if (interaction.options.getSubcommand() === "status") return await this.execStatus(interaction, data);
        if (interaction.options.getSubcommand() === "buy") return await this.execBuy(interaction, data);
        return await interaction.editReply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help command ${this.info.name}\`.` });
    }

    async execStatus(interaction, data) {
        const expireTimestamp = data.premium.premiumExpiresAt > Math.floor(Date.now() / 1000) ? data.premium.premiumExpiresAt : 0;

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.member.displayName || interaction.member.username}'s balance`, iconURL: `${interaction.member.displayAvatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(bot.config.embed.color)
            .setFooter({ text: bot.config.embed.footer })
            .setDescription("**Get [Coinz Premium](https://coinzbot.xyz/store) to unlock all features of Coinz!**")
            .addFields(
                {
                    name: "Your Premium Status",
                    value: data.premium.isPremium === true && expireTimestamp > 0 ? `Premium: :white_check_mark:\nPremium Expires: <t:${expireTimestamp}:D>\n` : "Premium: :x:",
                    inline: false
                }
            )
        await interaction.editReply({ embeds: [embed] });
    }

    async execBuy(interaction, data) {
        const createRow = (tickets, disableAll = false) => {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("premium_supporter")
                    .setStyle(ButtonStyle.Success)
                    .setLabel("Buy Supporter Tier (1 month)")
                    .setDisabled(tickets < 200 || disableAll)
            );
            return [row];
        }

        const createEmbed = (tickets = 0, premium) => {
            const expireTimestamp = premium.premiumExpiresAt > Math.floor(Date.now() / 1000) ? premium.premiumExpiresAt : 0;

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
                        value: "Perks: [Supporter Tier](https://coinzbot.xyz/store)\nPrice per month: $2 or <:ticket:1032669959161122976> 200 Tickets",
                        inline: false
                    },
                    {
                        name: "Your Premium Status",
                        value: premium.isPremium === true && expireTimestamp > 0 ? `Premium: :white_check_mark:\nPremium Expires: <t:${expireTimestamp}:D>\n` : "Premium: :x:",
                        inline: false
                    }
                )
            return embed;
        }

        let interactionFinished = false;
        const message = await interaction.editReply({ embeds: [createEmbed(data.user.tickets)], components: createRow(data.user.tickets), fetchReply: true });
        const collector = createMessageComponentCollector(message, interaction, { max: 10, time: 60_000, componentType: ComponentType.Button });

        collector.on("collect", async (i) => {
            if (!interactionFinished) {
                await i.deferUpdate();
                if (i.customId === "premium_supporter") {
                    let ticketCost = 200;

                    interactionFinished = data.user.tickets - ticketCost < ticketCost;
                    if (data.user.tickets < ticketCost) {
                        return await i.reply({ content: "You don't have enough tickets to buy this tier.", ephemeral: true });
                    }

                    data.user.tickets -= ticketCost;
                    await Member.updateOne({ id: interaction.member.id }, { $inc: { tickets: -ticketCost } }, { upsert: true });

                    if (data.premium.isPremium === true && data.premium.premiumExpiresAt > Math.floor(Date.now() / 1000)) {
                        await PremiumModel.updateOne(
                            { id: interaction.member.id },
                            { $inc: { premiumExpiresAt: 86400 * 30 } },
                            { upsert: true }
                        );
                    } else {
                        data.premium.isPremium = true;
                        data.premium.premiumExpiresAt = Math.floor(Date.now() / 1000) + (86400 * 30);

                        await PremiumModel.updateOne(
                            { id: interaction.member.id },
                            { $set: { isPremium: true, premiumExpiresAt: Math.floor(Date.now() / 1000) + (86400 * 30) } },
                            { upsert: true }
                        );
                    }

                    await interaction.editReply({ embeds: [createEmbed(data.user.tickets)], components: createRow(data.user.tickets, interactionFinished) });
                }
            }
        });

        collector.on("end", async (i) => {
            interactionFinished = true;
            await interaction.editReply({ components: createRow(0, true) });
        });
    }
}