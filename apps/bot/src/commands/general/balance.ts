import {
    ApplicationCommandOptionType,
    ButtonStyle,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    type ColorResolvable,
    type User,
    ComponentType,
} from 'discord.js';
import type Bot from '../../domain/Bot';
import type { Command } from '../../domain/Command';
import { getMember } from '../../lib/database';
import type { IMember } from '../../models/member';
import Member from '../../models/member';
import { filter } from '../../utils';

function calculateBankLimitPrice(premium: number, bankLimit: number) {
    return Math.ceil(bankLimit * (premium > 0 ? 0.35 : 0.7));
}

function getEmbed(client: Bot, user: User, member: IMember, price: number, enoughMoney: boolean): EmbedBuilder {
    let desc = '';
    if (price !== -1) {
        desc =
            (enoughMoney
                ? `:white_check_mark: **You can increase your bank limit to \`${member.bankLimit * 2}\` for :coin: ${price}**.`
                : `:x: **You need :coin: ${price > member.wallet ? price - member.wallet : 1} to increase your bank limit to \`${member.bankLimit * 2}\`.**`) +
            '\n\n';
    }

    return new EmbedBuilder()
        .setAuthor({ name: `${user.username}'s Balance`, iconURL: user.avatarURL() ?? undefined })
        .setColor(client.config.embed.color as ColorResolvable)
        .setDescription(
            desc +
                `:dollar: **Wallet:** :coin: ${member.wallet}\n` +
                `:bank: **Bank:** :coin: ${member.bank} / ${member.bankLimit || 7_500}\n` +
                `:moneybag: **Net Worth:** :coin: ${member.wallet + member.bank}`,
        );
}

function getButton(enoughMoney: boolean, disabled = false): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('balance_addLimit')
            .setLabel('Increase Bank Limit')
            .setEmoji('🪙')
            .setStyle(enoughMoney ? ButtonStyle.Success : ButtonStyle.Danger)
            .setDisabled(!enoughMoney || disabled),
    );
}

export default {
    data: {
        name: 'balance',
        description: 'Get your balance or the balance of another user.',
        category: 'general',
        options: [
            {
                name: 'user',
                type: ApplicationCommandOptionType.User,
                description: 'Get the balance of another user.',
                required: false,
            },
        ],
        usage: ['[user]'],
    },
    async execute(client, interaction, member) {
        const user = interaction.options.getUser('user') ?? interaction.user;
        if (user.bot) {
            await interaction.reply({ content: "You can't get the balance of a bot.", ephemeral: true });
            return;
        }

        let memberData = interaction.user.id === user.id ? member : await getMember(user.id);
        let price = calculateBankLimitPrice(memberData.premium, memberData.bankLimit);
        let enoughMoney = memberData.wallet >= price;
        let interactionFinished = false;

        const message = await interaction.reply({
            embeds: [getEmbed(client, interaction.user, memberData, price, enoughMoney)],
            components: [getButton(enoughMoney)],
            fetchReply: true,
        });

        const collector = message.createMessageComponentCollector({
            filter: async (i) => filter(interaction, i),
            max: 10,
            idle: 45_000,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'balance_addLimit' && !interactionFinished) {
                memberData = await getMember(interaction.user.id);
                price = calculateBankLimitPrice(memberData.premium, memberData.bankLimit);
                enoughMoney = memberData.wallet >= price;

                const oldBankLimit = memberData.bankLimit;
                memberData.wallet -= price;
                memberData.bankLimit *= 2;

                if (!enoughMoney) {
                    await i.reply({
                        content: "You don't have enough money to increase your bank limit.",
                        ephemeral: true,
                    });
                    return;
                }

                await Member.updateOne(
                    { id: interaction.user.id },
                    { $inc: { wallet: -price, bankLimit: oldBankLimit } },
                );

                price = calculateBankLimitPrice(memberData.premium, memberData.bankLimit);
                enoughMoney = memberData.wallet >= price;

                if (!enoughMoney) interactionFinished = true;
                await i.update({
                    embeds: [getEmbed(client, user, memberData, price, enoughMoney)],
                    components: [getButton(enoughMoney)],
                });
            }
        });

        collector.on('end', async () => {
            interactionFinished = true;
            await interaction.editReply({ components: [getButton(enoughMoney, true)] });
        });
    },
} satisfies Command;
