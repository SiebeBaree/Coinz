const { EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command.js');
const MemberModel = require('../../models/Member');

class Daily extends Command {
    info = {
        name: "daily",
        description: "Claim your daily reward.",
        options: [],
        category: "economy",
        extraFields: [],
        cooldown: 82800,
        enabled: true,
        memberRequired: true,
        deferReply: true
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
            await MemberModel.updateOne({ id: interaction.member.id }, {
                $inc: {
                    wallet: streakReward,
                    streak: 0
                },
                $set: {
                    lastStreak: parseInt(Date.now() / 1000)
                }
            });

            return await interaction.editReply({ content: `You lost your streak and now get a normal reward of :coin: ${streakReward}.` });
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

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Daily`, iconURL: interaction.member.displayAvatarURL() || bot.config.embed.defaultIcon })
            .setColor(bot.config.embed.color)
            .setDescription(`:moneybag: **You claimed your daily reward!**\n\n**Daily Reward:** :coin: ${this.defaultReward}\n**Streak Reward:** :coin: ${streakReward - this.defaultReward} for a \`${data.user.streak + 1} ${data.user.streak + 1 === 1 ? "day" : "days"}\` streak\n**Total:** :coin: ${streakReward}\n\n:shushing_face: *Psss, if you want more money consider voting. Use* </vote:993095062726647810> *for more information!*`)
        await interaction.editReply({ embeds: [embed] });
    }
}

module.exports = Daily;