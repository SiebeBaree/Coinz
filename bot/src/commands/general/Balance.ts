import {
    ActionRowBuilder,
    ApplicationCommandOptionType, ButtonBuilder, ButtonStyle,
    ChatInputCommandInteraction,
    ColorResolvable,
    ComponentType,
    EmbedBuilder, User,
} from "discord.js";
import Bot from "../../domain/Bot";
import ICommand from "../../domain/ICommand";
import Command from "../../domain/Command";
import Member, { IMember } from "../../models/Member";
import Database from "../../lib/Database";

export default class extends Command implements ICommand {
    readonly info = {
        name: "balance",
        description: "Get your balance or the balance of another user.",
        options: [
            {
                name: "user",
                type: ApplicationCommandOptionType.User,
                description: "Get the balance of another user.",
                required: false,
            },
        ],
        category: "general",
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const user = interaction.options.getUser("user") ?? interaction.user;
        if (user.bot) {
            await interaction.reply({ content: "You can't get the balance of a bot.", ephemeral: true });
            return;
        }

        let userData = interaction.user.id === user.id ? member : await Database.getMember(user.id);
        if (interaction.user.id !== user.id) {
            await interaction.reply({ embeds: [this.getEmbed(user, userData, -1, false)] });
            return;
        }

        let price = this.calculateBankLimitPrice(userData.bankLimit);
        let enoughMoney = userData.wallet >= price;
        let interactionFinished = false;

        const message = await interaction.reply({ embeds: [this.getEmbed(user, userData, price, enoughMoney)], components: [this.getButton(enoughMoney)] });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, max: 10, idle: 30_000, componentType: ComponentType.Button });

        collector.on("collect", async (i) => {
            if (i.customId === "balance_addLimit" && !interactionFinished) {
                userData = await Database.getMember(interaction.user.id);
                price = this.calculateBankLimitPrice(userData.bankLimit);
                enoughMoney = userData.wallet >= price;

                const oldBankLimit = userData.bankLimit;
                userData.wallet -= price;
                userData.bankLimit *= 2;

                if (!enoughMoney) {
                    await i.reply({ content: "You don't have enough money to increase your bank limit.", ephemeral: true });
                    return;
                }

                await Member.updateOne({ id: interaction.user.id }, { $inc: { wallet: -price, bankLimit: oldBankLimit } });

                price = this.calculateBankLimitPrice(userData.bankLimit);
                enoughMoney = userData.wallet >= price;

                if (!enoughMoney) interactionFinished = true;
                await i.update({ embeds: [this.getEmbed(user, userData, price, enoughMoney)], components: [this.getButton(enoughMoney)] });
            }
        });

        collector.on("end", async () => {
            interactionFinished = true;
            await interaction.editReply({ components: [this.getButton(enoughMoney, true)] });
        });
    }

    calculateBankLimitPrice(bankLimit: number) {
        return Math.ceil(bankLimit * 0.7);
    }

    getEmbed(user: User, member: IMember, price: number, enoughMoney: boolean): EmbedBuilder {
        let desc = `:dollar: **Wallet:** :coin: ${member.wallet}\n:bank: **Bank:** :coin: ${member.bank} / ${member.bankLimit || 7500}\n:moneybag: **Net Worth:** :coin: ${member.wallet + member.bank}`;

        if (price !== -1) {
            desc = (enoughMoney ?
                `:white_check_mark: **You can increase your bank limit to \`${member.bankLimit * 2}\` for :coin: ${price}**.` :
                `:x: **You need :coin: ${price > member.wallet ? price - member.wallet : 1} to increase your bank limit to \`${member.bankLimit * 2}\`.**`) + "\n\n" + desc;
        }

        return new EmbedBuilder()
            .setAuthor({ name: `${user.username}'s Balance`, iconURL: user.avatarURL() ?? undefined })
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription(desc);
    }

    getButton(enoughMoney: boolean, disabled = false): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("balance_addLimit")
                    .setLabel("Increase Bank Limit")
                    .setEmoji("🪙")
                    .setStyle(enoughMoney ? ButtonStyle.Success : ButtonStyle.Danger)
                    .setDisabled(!enoughMoney || disabled),
            );
    }
}