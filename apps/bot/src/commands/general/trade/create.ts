import type { ChatInputCommandInteraction } from 'discord.js';
import type Bot from '../../../domain/Bot';
import { getMember } from '../../../lib/database';
import type { IMember } from '../../../models/member';
import Trade, { TradeStatus } from '../../../models/trade';
import { generateRandomString, getLevel, msToTime } from '../../../utils';

const COOLDOWN_KEY = 'trade.create';

export default async function create(client: Bot, interaction: ChatInputCommandInteraction, member: IMember) {
    await interaction.deferReply({ ephemeral: true });

    const cooldown = await client.cooldown.getCooldown(interaction.user.id, COOLDOWN_KEY);
    if (cooldown) {
        await interaction.editReply({
            content: `Please wait ${msToTime(
                Math.abs(Number.parseInt(cooldown, 10) - Math.floor(Date.now() / 1_000)) * 1_000,
            )} before using this command again.`,
        });
        return;
    }

    if (member.premium < 1) {
        await interaction.editReply({
            content: `Creating trades is only for Coinz Plus or Pro subscribers. To gain access to this command, consider [**upgrading**](<${client.config.website}/premium>).`,
        });
        return;
    } else if (getLevel(member.experience) < 10) {
        await interaction.editReply({ content: 'You need to be level 10 to use this command.' });
        return;
    }

    const user = interaction.options.getUser('user', true);
    if (user.bot) {
        await interaction.editReply({ content: "You can't get the balance of a bot." });
        return;
    }

    const toMember = await getMember(user.id);
    if (!toMember) {
        await interaction.editReply({ content: `${user.username} has not used Coinz before.` });
        return;
    }

    const totalTrades = await Trade.countDocuments({
        $and: [
            { $or: [{ userId: member.id }, { toUserId: member.id }] },
            { status: { $in: [TradeStatus.PENDING, TradeStatus.WAITING_FOR_CONFIRMATION] } },
            { expiresAt: { $gt: new Date() } },
        ],
    });

    if (totalTrades >= 3) {
        await interaction.editReply({
            content: `You or ${user.username} have too many active trades. Check your active trades using \`/trade list\` and close any trades using \`/trade view <trade-id>\` and then pressing the close button.`,
        });
        return;
    }

    await client.cooldown.setCooldown(interaction.user.id, COOLDOWN_KEY, 60 * 60 * 12); // 12 hours

    let tradeId = '';
    do {
        tradeId = generateRandomString(8);
    } while (await Trade.exists({ tradeId }));

    await interaction.editReply({
        content: `Trade created with ${user.username}. Add items to the trade using \`/trade view trade-id:${tradeId}\`.`,
    });

    const trade = new Trade({
        tradeId: tradeId,
        userId: member.id,
        toUserId: user.id,
        items: [],
        status: TradeStatus.PENDING,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days
    });
    await trade.save();
}
