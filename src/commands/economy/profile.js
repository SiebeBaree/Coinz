const Command = require('../../structures/Command.js');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const CooldownModel = require("../../models/Cooldown");
const idAchievements = require('../../assets/achievements.json');

class Profile extends Command {
    info = {
        name: "profile",
        description: "Get your or another user's Coinz profile. You can see detailed information here.",
        options: [
            {
                name: 'user',
                type: ApplicationCommandOptionType.User,
                description: 'Get the profile of another user.',
                required: false
            }
        ],
        category: "economy",
        extraFields: [],
        cooldown: 0,
        enabled: true,
        memberRequired: false,
        deferReply: false
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const member = interaction.options.getUser('user') || interaction.member;
        if (member.bot) return await interaction.reply({ content: 'That user is a bot. You can only check the profile of a real person.', ephemeral: true });

        await interaction.deferReply();
        const memberData = await bot.database.fetchMember(member.id);

        const inventory = await this.calcInventory(memberData.inventory);
        const stocks = await this.calcInvestments(memberData.stocks);

        let job = memberData.job === "" ? "None" : memberData.job;
        if (memberData.job.startsWith("business")) job = "Working at a company";
        if (memberData.job === "business") job = "Company CEO";

        let cooldownsAmount = 0;
        let totalCooldowns = 0;
        const cooldowns = await CooldownModel.find({ id: member.id });
        let cooldownStr = "";

        const now = parseInt(Date.now() / 1000);

        for (let i = 0; i < cooldowns.length; i++) {
            if (cooldowns[i].expiresOn > now) {
                totalCooldowns++;
                if (cooldownsAmount <= 10) {
                    cooldownStr += `**${cooldowns[i].command}:** ${bot.tools.msToTime(cooldowns[i].expiresOn * 1000 - Date.now())}\n`;
                    cooldownsAmount++;
                }
            }
        }

        if (totalCooldowns > 10) {
            cooldownStr += `and \`${totalCooldowns - cooldownsAmount}\` more cooldowns...`;
        } else if (cooldownStr === "") {
            cooldownStr = "There are no cooldowns found for this user.";
        }

        const displayedBadge = memberData.displayedBadge === undefined || memberData.displayedBadge === "" ? "" : ` <:${memberData.displayedBadge}:${idAchievements[memberData.displayedBadge]}>`;

        let badgesStr = "";
        const badges = memberData.badges === undefined ? [] : memberData.badges;
        for (let i = 0; i < badges.length; i++) {
            badgesStr += `<:${badges[i]}:${idAchievements[badges[i]]}> `;
        }

        const embed = new EmbedBuilder()
            .setTitle(`${member.displayName || member.username}'s profile${displayedBadge}`)
            .setColor(bot.config.embed.color)
            .setThumbnail(member.displayAvatarURL() || bot.config.embed.defaultIcon)
            .addFields(
                { name: 'Balance', value: `:dollar: **Wallet:** :coin: ${memberData.wallet}\n:credit_card: **Bank:** :coin: ${memberData.bank}\n:moneybag: **Net Worth:** :coin: ${memberData.wallet + memberData.bank}\n:gem: **Inventory Worth:** \`${inventory.totalItems} items\` valued at :coin: ${inventory.value}`, inline: false },
                { name: 'Investment Portfolio', value: `:dollar: **Worth:** :coin: ${stocks.currentWorth}\n:credit_card: **Amount of Stocks:** ${parseInt(stocks.totalStocks)} stocks\n:moneybag: **Invested:** :coin: ${stocks.initialWorth}`, inline: false },
                { name: 'Misc', value: `:briefcase: **Current Job:** ${job}\n:sparkles: **Streak:** ${memberData.streak} days\n:no_entry: **Banned:** No`, inline: false },
                { name: 'Badges (Achievements)', value: `${badgesStr === "" ? "None" : badgesStr}`, inline: false },
                { name: 'Cooldowns', value: `${cooldownStr}`, inline: false }
            )
        await interaction.editReply({ embeds: [embed] });
    }

    async calcInventory(inv = []) {
        let inventory = { value: 0, totalItems: 0 };

        for (let i = 0; i < inv.length; i++) {
            const item = await bot.database.fetchItem(inv[i].itemId);
            inventory.value += parseInt(item.sellPrice * inv[i].quantity);
            inventory.totalItems += inv[i].quantity;
        }

        return inventory;
    }

    async calcInvestments(investments = []) {
        let stocks = { currentWorth: 0, totalStocks: 0, initialWorth: 0 };

        for (let i = 0; i < investments.length; i++) {
            const item = await bot.database.fetchStock(investments[i].ticker);
            stocks.currentWorth += parseInt(item.price * investments[i].quantity);
            stocks.totalStocks += investments[i].quantity;
            stocks.initialWorth += investments[i].buyPrice;
        }

        return stocks;
    }
}

module.exports = Profile;