import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Member, { IMember } from "../../models/Member";
import User from "../../utils/User";
import Cooldown from "../../utils/Cooldown";
import Achievement from "../../utils/Achievement";

export default class extends Command implements ICommand {
    readonly info = {
        name: "daily",
        description: "Claim your daily reward.",
        options: [],
        category: "general",
        deferReply: true,
    };

    private readonly row: ActionRowBuilder<ButtonBuilder>;
    private readonly defaultReward = 10;
    private readonly maxDays = 50;
    private readonly dailyStreakMoney = 3;
    private readonly premiumStreakMoney = 5;
    private readonly achievement;

    constructor(bot: Bot, file: string) {
        super(bot, file);

        this.achievement = Achievement.getById("keep_on_grinding");
        this.row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setLabel("Top.gg")
                    .setStyle(ButtonStyle.Link)
                    .setEmoji("<:topgg:990540015853506590>")
                    .setURL("https://top.gg/bot/938771676433362955/vote"),
                new ButtonBuilder()
                    .setLabel("Discordbotlist.com")
                    .setStyle(ButtonStyle.Link)
                    .setEmoji("<:dbl:990540323967103036>")
                    .setURL("https://discordbotlist.com/bots/coinz/upvote"),
            );
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        let alertMsg = "";
        if (!this.checkDailyStreak(member.lastStreak)) {
            alertMsg = "\n\n**You have lost your streak.**";
            member.streak = 0;
        } else {
            User.addExperience(interaction.user.id, member.streak > 50 ? 50 : member.streak);
        }

        const streakReward = this.calculateReward(member.streak, member.premium.active);

        const secondsUntilEndOfTheDay = 86400 - Math.floor(Date.now() / 1000) % 86400;
        await Cooldown.setCooldown(interaction.user.id, "daily", secondsUntilEndOfTheDay);

        await Member.updateOne({ id: interaction.user.id }, {
            $inc: { wallet: streakReward, spins: member.premium.active && member.premium.tier === 2 ? 1 : 0 },
            $set: { lastStreak: new Date(), streak: member.streak + 1 },
        });

        await User.sendAchievementMessage(interaction, interaction.user.id, this.achievement);
        const premiumText = member.premium.active ?
            "*Because you are a **Coinz Premium** user you get a* </lucky-wheel spin:1005435550884442193> *for free.*" :
            "*Get better daily rewards with **Coinz Premium**. Go to the [**store**](https://coinzbot.xyz/store) to learn more.*";

        const embed = new EmbedBuilder()
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription(`:moneybag: **You claimed your daily reward!**${alertMsg}\n\n**Daily Reward:** :coin: ${this.defaultReward}\n**Daily Streak:** :coin: ${streakReward - this.defaultReward} for a \`${member.streak} ${member.streak === 1 ? "day" : "days"}\` streak\n**Total:** :coin: ${streakReward}\n**Gained XP:** \`${member.streak > 50 ? 50 : member.streak} XP\`\n\n${premiumText}\n*If you want more money consider voting. Use the buttons below to vote!*`);
        await interaction.editReply({ embeds: [embed], components: [this.row] });
        await User.sendAchievementMessage(interaction, interaction.user.id, this.achievement);
    }

    private checkDailyStreak(previousStreak: Date) {
        if (previousStreak.getFullYear() === 1970) return true;

        const isLeapYear = previousStreak.getFullYear() % 4 === 0;
        const now = this.getDayOfYear(new Date());

        let lastStreak = this.getDayOfYear(previousStreak);
        lastStreak = lastStreak >= (isLeapYear ? 366 : 365) ? 0 : lastStreak;
        return now - lastStreak >= 0 && now - lastStreak <= 2;
    }

    private getDayOfYear(date: Date) {
        return Math.floor((date.getMilliseconds() - new Date(date.getFullYear(), 0, 0).getMilliseconds()) / 1000 / 60 / 60 / 24);
    }

    private calculateReward(days: number, isPremium = false) {
        days = days > this.maxDays ? this.maxDays : days;
        return this.defaultReward + (days * (isPremium ? this.premiumStreakMoney : this.dailyStreakMoney));
    }
}