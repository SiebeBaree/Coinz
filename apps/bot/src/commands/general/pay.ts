import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from '../../domain/Command';
import Member from '../../models/member';
import UserStats from '../../models/userStats';
import { getLevel, parseStrToNum } from '../../utils';
import logger from '../../utils/logger';
import { addMoney, removeMoney } from '../../utils/money';

const LOWER_LIMIT = 30;
const START_LIMIT = 1000;
const MAX_LIMIT = 15_000;
const PREMIUM_LIMIT = 30_000;

function getLimit(level: number, premium: number): number {
    if (premium >= 2) return PREMIUM_LIMIT;
    return Math.min(START_LIMIT + Math.floor(level / 3) * 1000, MAX_LIMIT);
}

export default {
    data: {
        name: 'pay',
        description: 'Give some of your money to another user.',
        category: 'general',
        options: [
            {
                name: 'user',
                type: ApplicationCommandOptionType.User,
                description: 'The user you want to give money to.',
                required: true,
            },
            {
                name: 'amount',
                type: ApplicationCommandOptionType.String,
                description: 'The amount of money you want to give.',
                required: true,
            },
        ],
        extraFields: [
            {
                name: 'Limits',
                value:
                    `You can donate up to :coin: ${START_LIMIT}. This limit will increase by :coin: 1000 every 3 levels and will be capped at a maximum of :coin: ${MAX_LIMIT}.\n` +
                    `**Coinz Pro** users always have a maximum limit of :coin: ${PREMIUM_LIMIT}, [**upgrade to Coinz Pro**](https://coinzbot.xyz/premium).`,
                inline: false,
            },
        ],
        cooldown: 7200,
        usage: ['<user> <amount>'],
    },
    async execute(client, interaction, member) {
        const user = interaction.options.getUser('user', true);
        const amountStr = interaction.options.getString('amount', true);

        const level = getLevel(member.experience);
        const limit = getLimit(level, member.premium);

        let amount = 0;
        if (amountStr.toLowerCase() === 'all' || amountStr.toLowerCase() === 'max') {
            amount = Math.min(member.wallet, limit);
        } else {
            amount = parseStrToNum(amountStr);

            if (Number.isNaN(amount) || amount <= 0) {
                await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
                await interaction.reply({ content: ':x: The amount must be a valid number.', ephemeral: true });
                return;
            }
        }

        if (user.id === interaction.user.id || user.bot) {
            await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
            await interaction.reply({ content: ":x: You can't give money to yourself or a bot.", ephemeral: true });
            return;
        } else if (amount > member.wallet) {
            await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
            await interaction.reply({
                content: ":x: You don't have that much money in your wallet.",
                ephemeral: true,
            });
            return;
        } else if (amount > limit) {
            await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);

            let message = `:x: You can't donate more than :coin: ${limit} at your current level.`;
            if (member.premium < 2 && amount < PREMIUM_LIMIT) {
                message += ` You can increase your limit to :coin: 25.000 by becoming a Coinz Pro subscriber. [**Upgrade now**](<${client.config.website}/premium>).`;
            }

            await interaction.reply({
                content: message,
                ephemeral: true,
            });
            return;
        } else if (amount < LOWER_LIMIT) {
            await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
            await interaction.reply({
                content: `:x: You can't donate less than :coin: ${LOWER_LIMIT}.`,
                ephemeral: true,
            });
            return;
        }

        const receiver = await Member.findOne({ id: user.id });
        if (!receiver) {
            await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
            await interaction.reply({ content: ":x: That user doesn't have an account yet.", ephemeral: true });
            return;
        }

        await interaction.reply({ content: `:white_check_mark: You've sent :coin: ${amount} to **${user.tag}**.` });
        await removeMoney(interaction.user.id, amount);
        await addMoney(user.id, amount);

        await UserStats.updateOne({ id: interaction.user.id }, { $inc: { moneyDonated: amount } }, { upsert: true });
        await UserStats.updateOne({ id: user.id }, { $inc: { moneyReceived: amount } }, { upsert: true });

        logger.info(
            `PAY | User ${interaction.user.tag} (${interaction.user.id}) gave ${amount} to ${user.tag} (${user.id}).`,
        );
    },
} satisfies Command;
