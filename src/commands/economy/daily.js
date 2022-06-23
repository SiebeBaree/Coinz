const guildUserSchema = require('../../database/schemas/guildUsers');

const defaultReward = 15;
const daysOffset = 2;

module.exports.execute = async (client, interaction, data) => {
    let streakReward = defaultReward;
    const lastStreakAgo = parseInt(Date.now() / 1000) - data.guildUser.lastStreak;

    if (data.guildUser.lastStreak === 0 || lastStreakAgo <= 86400 * daysOffset) {
        streakReward += 5 * (data.guildUser.streak + 1);
        streakReward = streakReward > 100 ? 100 : streakReward; // cap daily reward at 100
    } else {
        await client.tools.addMoney(interaction.guildId, interaction.member.id, defaultReward);
        return await interaction.reply({ content: `You lost your streak and now get a normal reward of :coin: ${defaultReward}.` });
    }

    await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
        $inc: {
            wallet: streakReward,
            streak: 1
        },
        $set: {
            lastStreak: parseInt(Date.now() / 1000)
        }
    });

    await interaction.reply({ content: `You claimed your daily reward and got :coin: ${streakReward}. (:coin: ${streakReward - defaultReward} for ${data.guildUser.streak + 1} day streak.)` });
}

module.exports.help = {
    name: "daily",
    description: "Claim your daily reward.",
    options: [],
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 86400,
    enabled: true
}