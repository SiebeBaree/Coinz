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
        options: [],
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
        const createRow = (tickets, disableAll = false) => {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("premium_supporter")
                    .setStyle(tickets < 200 ? ButtonStyle.Danger : ButtonStyle.Success)
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
        const message = await interaction.editReply({ embeds: [createEmbed(data.user.tickets, data.premium)], components: createRow(data.user.tickets), fetchReply: true });
        const collector = createMessageComponentCollector(message, interaction, { max: 12, time: 60_000, componentType: ComponentType.Button });

        collector.on("collect", async (i) => {
            if (!interactionFinished) {
                await i.deferUpdate();
                if (i.customId === "premium_supporter") {
                    let ticketCost = 200;

                    if (!interactionFinished) interactionFinished = data.user.tickets - ticketCost < ticketCost;
                    if (data.user.tickets < ticketCost) {
                        return await i.reply({ content: "You don't have enough tickets to buy this tier.", ephemeral: true });
                    }

                    data.user.tickets -= ticketCost;
                    await Member.updateOne({ id: interaction.member.id }, { $inc: { tickets: -ticketCost } }, { upsert: true });

                    if (data.premium.isPremium === true && data.premium.premiumExpiresAt > Math.floor(Date.now() / 1000)) {
                        data.premium.premiumExpiresAt += 86400 * 30;

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
                            { $set: { isPremium: true, premiumExpiresAt: data.premium.premiumExpiresAt } },
                            { upsert: true }
                        );
                    }

                    await interaction.editReply({ embeds: [createEmbed(data.user.tickets, data.premium)], components: createRow(data.user.tickets, interactionFinished) });
                }
            }
        });

        collector.on("end", async (collected) => {
            interactionFinished = true;
            await interaction.editReply({ components: createRow(0, interactionFinished) });
        });
    }
}