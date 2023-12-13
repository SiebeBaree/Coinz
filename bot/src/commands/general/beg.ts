import type { Command } from '../../domain/Command';
import UserStats from '../../models/userStats';
import { getLevel, getRandomNumber } from '../../utils';
import { addExperience, addMoney } from '../../utils/money';

export default {
    data: {
        name: 'beg',
        description: 'Do you really need to beg for money?',
        category: 'general',
        cooldown: 600,
    },
    async execute(_, interaction, member) {
        if (getLevel(member.experience) > 20) {
            await interaction.reply(
                'You are too experienced to beg for money. This command is only for users below level 20.',
            );
            return;
        }

        if (getRandomNumber(1, 100) <= 75) {
            const money = getRandomNumber(15, 50);
            const experience = await addExperience(member);
            await interaction.reply(
                `You begged for money and got :coin: **${money}**. You also gained **${experience} XP**.`,
            );

            await addMoney(member.id, money);
            await UserStats.updateOne({ id: interaction.user.id }, { $inc: { totalEarned: money } }, { upsert: true });
        } else {
            await interaction.reply('You begged for money but no one gave you any.');
        }
    },
} satisfies Command;
