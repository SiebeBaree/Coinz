import { ApplicationCommandOptionType, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from "discord.js";
import Bot from "../../domain/Bot";
import ICommand from "../../domain/ICommand";
import Command from "../../domain/Command";
import { IMember } from "../../models/Member";
import Database from "../../lib/Database";
import UserUtils from "../../lib/UserUtils";
import Utils from "../../lib/Utils";

export default class extends Command implements ICommand {
    readonly info = {
        name: "profile",
        description: "Get your or another user's profile. You can see detailed information here.",
        options: [
            {
                name: "user",
                type: ApplicationCommandOptionType.User,
                description: "Get the profile of another member.",
                required: false,
            },
        ],
        category: "general",
        deferReply: true,
    };

    private readonly FT_TO_M = 3.28084;

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const user = interaction.options.getUser("user") || interaction.user;
        member = user.id === interaction.user.id ? member : await Database.getMember(user.id);

        const inventory = this.calculateInventoryValue(member);
        const investments = await this.calculateInvestments(member);
        const selectedBadge = this.client.achievement.getById(member.displayedBadge);
        const level = UserUtils.getLevel(member.experience);
        const xpUntilNextLevel = UserUtils.getExperience(level) - member.experience;

        const workJob = member.job === "" ? "Unemployed" : member.job;
        let businessJob = "Not working at a business.";

        if (member.business !== "") {
            const business = await Database.getBusiness(member.business);
            const position = business.employees.find((e) => e.userId === user.id);
            businessJob = position && position.role === "ceo" ? "CEO of " : "Working at ";
            businessJob += business ? business.name : " a business";
        }

        let bio = "";
        bio += member.birthday.getTime() > 0 ? `**Age:** ${this.getAge(member.birthday)} years old` : "";
        bio += member.bio.length > 0 ? `\n**Bio:** ${member.bio}` : "";

        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s Profile${selectedBadge ? ` <:${selectedBadge.id}:${selectedBadge.emoji}>` : ""}`)
            .setThumbnail(user.displayAvatarURL())
            .setColor(<ColorResolvable>(member.profileColor || this.client.config.embed.color))
            .setDescription(bio.length > 0 ? bio : null)
            .addFields([
                {
                    name: "Experience",
                    value: `:beginner: **Level:** \`${level}\`\n:game_die: **Next Level:** \`${xpUntilNextLevel}%\`\n${this.createProgressBar(xpUntilNextLevel)}`,
                    inline: false,
                },
                {
                    name: "Balance",
                    value: `:dollar: **Wallet:** :coin: ${member.wallet} (\`${Utils.formatNumber(member.wallet)}\`)\n:bank: **Bank:** :coin: ${member.bank} / ${member.bankLimit} (\`${Utils.formatNumber(member.bank)}/${Utils.formatNumber(member.bankLimit)}\`)\n:moneybag: **Net Worth:** :coin: ${member.wallet + member.bank} (\`${Utils.formatNumber(member.wallet + member.bank)}\`)\n:gem: **Inventory Worth:** \`${inventory.totalItems} items\` valued at :coin: ${inventory.totalValue}`,
                    inline: false,
                },
                {
                    name: "Investment Portfolio",
                    value: `:dollar: **Worth:** :coin: ${Math.round((investments.currentlyWorth + Number.EPSILON) * 100) / 100}\n:credit_card: **Amount:** ${Math.round((investments.totalInvestments + Number.EPSILON) * 100) / 100}x\n:moneybag: **Invested:** :coin: ${investments.buyPrice}`,
                    inline: false,
                },
                {
                    name: "Misc",
                    value: `:briefcase: **Current Job:** ${workJob}\n:office: **Business:** ${businessJob}\n:sparkles: **Daily Streak:** ${member.streak - 1 > 0 ? member.streak - 1 : 0} days\n:seedling: **Farm:** ${member.plots.length} plots\n:evergreen_tree: **Tree Height:** ${member.tree.height ?? 0}ft (${Math.round(member.tree.height / this.FT_TO_M)}m)`,
                    inline: false,
                },
                {
                    name: "Badges (Achievements)",
                    value: `${member.badges.length <= 0 ? "None" : member.badges.map((id) => `<:${id}:${this.client.achievement.getById(id)?.emoji}>`).join(" ")}`,
                    inline: false,
                },
            ]);
        await interaction.editReply({ embeds: [embed] });
    }

    private createProgressBar(current: number): string {
        const progress = Math.round(current / 10);
        const bar = [];

        bar.push(progress === 0 ? "<:bar_start0:1054825378688020601>" : "<:bar_start1:1054825380055371866>");
        for (let i = 2; i <= 9; i++) {
            bar.push(progress < i ? "<:bar_mid0:1054825371146657903>" : "<:bar_mid1:1054825377157087254>");
        }
        bar.push(progress < 10 ? "<:bar_end0:1054825373801644093>" : "<:bar_end1:1054825376087547995>");

        return bar.join("");
    }

    private calculateInventoryValue(member: IMember) {
        let returnObject = {
            totalItems: 0,
            totalValue: 0,
        };

        for (const invItem of member.inventory) {
            const item = this.client.items.getById(invItem.itemId);
            if (!item) continue;

            returnObject.totalItems += invItem.amount;
            returnObject.totalValue += invItem.amount * (item.sellPrice || 0);
        }

        return returnObject;
    }

    private async calculateInvestments(member: IMember) {
        let returnObject = {
            totalInvestments: 0,
            currentlyWorth: 0,
            buyPrice: 0,
        };

        for (const memberInvestment of member.investments) {
            const investment = await this.client.investment.getInvestment(memberInvestment.ticker);
            if (!investment) continue;

            const amount = parseFloat(memberInvestment.amount.toString());
            returnObject.totalInvestments += amount;
            returnObject.currentlyWorth += amount * parseFloat(investment.price);
            returnObject.buyPrice += memberInvestment.buyPrice;
        }

        return returnObject;
    }

    private getAge = (birthday: Date) =>
        new Date().getFullYear() - birthday.getFullYear() - (new Date() < new Date(new Date().getFullYear(), birthday.getMonth(), birthday.getDate()) ? 1 : 0);
}