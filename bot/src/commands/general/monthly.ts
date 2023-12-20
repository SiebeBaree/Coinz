import type { Command } from '../../domain/Command';
import { addMoney } from '../../utils/money';

export default {
    data: {
        name: 'monthly',
        description: 'Claim your monthly reward!',
        category: 'general',
        premium: 2,
        cooldown: 2592000,
    },
    async execute(_, interaction, member) {
        await interaction.editReply({ content: 'You have collected your monthly reward of :coin: 3000.' });
        await addMoney(member.id, 3000);
    },
} satisfies Command;
