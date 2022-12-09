import Command from '../../structures/Command.js'
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import Member from '../../models/Member.js'

const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setLabel("Top.gg")
        .setStyle(ButtonStyle.Link)
        .setEmoji("<:topgg:990540015853506590>")
        .setURL("https://top.gg/bot/938771676433362955/vote"),
    new ButtonBuilder()
        .setLabel("Discordbotlist.com")
        .setStyle(ButtonStyle.Link)
        .setEmoji("<:dbl:990540323967103036>")
        .setURL("https://discordbotlist.com/bots/coinz/upvote")
)

export default class extends Command {
    info = {
        name: "daily",
        description: "Claim your daily reward.",
        options: [],
        category: "economy",
        extraFields: [],
        cooldown: 0,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    defaultReward = 10;
    maxDays = 50;
    dailyStreakMoney = 3;
    premiumStreakMoney = 5;

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        if (this.getDayOfYear(new Date()) === this.getDayOfYear(data.user.lastStreak)) {
            return await interaction.reply({ content: ":x: You have already claimed your daily reward today.", ephemeral: true });
        }
        await interaction.deferReply();

        let alertMsg = "";
        if (!this.checkDailyStreak(data.user.lastStreak)) {
            alertMsg = "\n\n**You have lost your streak.**";
            data.user.streak = 0;
        }

        const premiumUser = await bot.database.fetchPremium(interaction.user.id, false);
        const streakReward = this.calculateReward(data.user.streak, premiumUser.premium);

        await Member.updateOne({ id: interaction.member.id }, {
            $inc: { wallet: streakReward },
            $set: { lastStreak: new Date(), streak: data.user.streak + 1 }
        });

        const embed = new EmbedBuilder()
            .setColor(bot.config.embed.color)
            .setDescription(`:moneybag: **You claimed your daily reward!**${alertMsg}\n\n**Daily Reward:** :coin: ${this.defaultReward}\n**Daily Streak:** :coin: ${streakReward - this.defaultReward} for a \`${data.user.streak} ${data.user.streak === 1 ? "day" : "days"}\` streak\n**Total:** :coin: ${streakReward}\n\n*Get better daily rewards with **Coinz Premium**. Go to the [**store**](https://coinzbot.xyz/store) to learn more.*\n*If you want more money consider voting. Use the buttons below to vote!*`)
        await interaction.editReply({ embeds: [embed], components: [row] });
    }

    checkDailyStreak(previousStreak) {
        if (previousStreak.getFullYear() === 1970) return true;

        const isLeapYear = previousStreak.getFullYear() % 4 === 0;
        const now = this.getDayOfYear(new Date());

        let lastStreak = this.getDayOfYear(previousStreak);
        lastStreak = lastStreak >= (isLeapYear ? 366 : 365) ? 0 : lastStreak;
        return now - lastStreak >= 0 && now - lastStreak <= 2;
    }

    getDayOfYear(date) {
        return Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    }

    calculateReward(days, isPremium = false) {
        days = days > this.maxDays ? this.maxDays : days;
        return this.defaultReward + (days * (isPremium ? this.premiumStreakMoney : this.dailyStreakMoney));
    }
}