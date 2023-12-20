import type { Command } from '../../domain/Command';
import { addMoney } from '../../utils/money';

export default {
    data: {
        name: 'weekly',
        description: 'Claim your weekly reward!',
        category: 'general',
        premium: 1,
        cooldown: 604800,
    },
    async execute(_, interaction, member) {
        await interaction.editReply({ content: "You have collected your weekly reward of :coin: 750." });
        await addMoney(member.id, 750);
    },
} satisfies Command;
