const Command = require('../../structures/Command.js');
const MemberModel = require('../../models/Member');

class Daily extends Command {
    info = {
        name: "daily",
        description: "Claim your daily reward.",
        options: [],
        category: "economy",
        extraFields: [],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 82800,
        enabled: true,
        guildRequired: false,
        memberRequired: true
    };

    defaultReward = 15;
    daysOffset = 2;
    dailyStreakCap = 125;
    dailyStreakMoney = 5;

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        let streakReward = this.defaultReward;
        const lastStreakAgo = parseInt(Date.now() / 1000) - data.user.lastStreak;

        if (data.user.lastStreak === 0 || lastStreakAgo <= 86400 * this.daysOffset) {
            streakReward += this.dailyStreakMoney * (data.user.streak + 1);
            streakReward = streakReward > this.dailyStreakCap ? this.dailyStreakCap : streakReward; // cap daily reward at this.dailyStreakCap
        } else {
            await bot.tools.addMoney(interaction.member.id, this.streakReward);
            return await interaction.editReply({ content: `You lost your streak and now get a normal reward of :coin: ${this.streakReward}.` });
        }

        await MemberModel.updateOne({ id: interaction.member.id }, {
            $inc: {
                wallet: streakReward,
                streak: 1
            },
            $set: {
                lastStreak: parseInt(Date.now() / 1000)
            }
        });

        await interaction.editReply({ content: `You claimed your daily reward and got :coin: ${streakReward}. (:coin: ${streakReward - this.defaultReward} for ${data.user.streak + 1} day streak.)` });
    }
}

module.exports = Daily;