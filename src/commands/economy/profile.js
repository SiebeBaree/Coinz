import Command from '../../structures/Command.js'
import { EmbedBuilder, ApplicationCommandOptionType, ComponentType, ActionRowBuilder, SelectMenuBuilder } from 'discord.js'
import { createMessageComponentCollector } from '../../lib/embed.js'
import Cooldown from '../../models/Cooldown.js'
import idAchievements from '../../assets/achievements.json' assert { type: "json" }

export default class extends Command {
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

        const displayedBadge = memberData.displayedBadge === undefined || memberData.displayedBadge === "" ? "" : ` <:${memberData.displayedBadge}:${idAchievements[memberData.displayedBadge]}>`;

        let badgesStr = "";
        const badges = memberData.badges === undefined ? [] : memberData.badges;
        for (let i = 0; i < badges.length; i++) {
            badgesStr += `<:${badges[i]}:${idAchievements[badges[i]]}> `;
        }

        const message = await interaction.editReply({ embeds: [this.createEmbed(member, memberData, stocks, inventory, job, displayedBadge, badgesStr)], components: [this.createSelectMenu("profile")], fetchReply: true });
        const collector = createMessageComponentCollector(message, interaction, { max: 3, time: 45_000, componentType: ComponentType.StringSelect });

        collector.on('collect', async (i) => {
            await i.deferUpdate();
            const selectedItem = i.values[0];

            if (selectedItem === "profile") {
                await interaction.editReply({ embeds: [this.createEmbed(member, memberData, stocks, inventory, job, displayedBadge, badgesStr)], components: [this.createSelectMenu(selectedItem)] });
            } else if (selectedItem === "cooldowns") {
                await interaction.editReply({ embeds: [await this.createCooldownsEmbed(member)], components: [this.createSelectMenu(selectedItem)] });
            }
        });

        collector.on('end', async (i) => {
            await interaction.editReply({ components: [this.createSelectMenu("profile", true)] });
        });
    }

    createEmbed(member, memberData, stocks, inventory, job, displayedBadge, badgesStr) {
        const embed = new EmbedBuilder()
            .setTitle(`${member.displayName || member.username}'s profile${displayedBadge}`)
            .setColor(bot.config.embed.color)
            .setThumbnail(member.displayAvatarURL() || bot.config.embed.defaultIcon)
            .addFields(
                { name: 'Balance', value: `:dollar: **Wallet:** :coin: ${memberData.wallet}\n:bank: **Bank:** :coin: ${memberData.bank}\n:moneybag: **Net Worth:** :coin: ${memberData.wallet + memberData.bank}\n:credit_card: **Tickets:** <:ticket:1032669959161122976> ${memberData.tickets || 0}\n:gem: **Inventory Worth:** \`${inventory.totalItems} items\` valued at :coin: ${inventory.value}`, inline: false },
                { name: 'Investment Portfolio', value: `:dollar: **Worth:** :coin: ${stocks.currentWorth}\n:credit_card: **Amount:** ${parseInt(stocks.totalStocks)}\n:moneybag: **Invested:** :coin: ${stocks.initialWorth}`, inline: false },
                { name: 'Misc', value: `:briefcase: **Current Job:** ${job}\n:sparkles: **Daily Streak:** ${memberData.streak} days`, inline: false },
                { name: 'Badges (Achievements)', value: `${badgesStr === "" ? "None" : badgesStr}`, inline: false }
            )
        return embed;
    }

    async createCooldownsEmbed(member) {
        const embed = new EmbedBuilder()
            .setTitle(`${member.displayName || member.username}'s cooldowns`)
            .setColor(bot.config.embed.color)
            .setDescription(await this.getCooldowns(member.id))
        return embed;
    }

    createSelectMenu(selectedItem, disabled = false) {
        const row = new ActionRowBuilder()
            .addComponents(
                new SelectMenuBuilder()
                    .setCustomId('profile')
                    .setPlaceholder('The interaction has ended')
                    .addOptions([
                        {
                            label: 'Profile',
                            value: 'profile',
                            description: 'View the profile of the user.',
                            emoji: '👤',
                            default: selectedItem === "profile"
                        },
                        {
                            label: 'Cooldowns',
                            value: 'cooldowns',
                            description: 'View the cooldowns of the user.',
                            emoji: '⏱️',
                            default: selectedItem === "cooldowns"
                        }
                    ])
                    .setDisabled(disabled)
            )
        return row;
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

    async getCooldowns(memberId) {
        let cooldownsAmount = 0;
        let totalCooldowns = 0;
        let cooldownStr = "";

        const cooldowns = await Cooldown.find({ id: memberId });
        const now = parseInt(Date.now() / 1000);

        for (let i = 0; i < cooldowns.length; i++) {
            if (cooldowns[i].expiresOn > now) {
                totalCooldowns++;
                if (cooldownsAmount <= 25) {
                    cooldownStr += `**${cooldowns[i].command}:** <t:${cooldowns[i].expiresOn}:R>\n`;
                    cooldownsAmount++;
                }
            }
        }

        if (totalCooldowns > 25) cooldownStr += `and \`${totalCooldowns - cooldownsAmount}\` more cooldowns...`;
        return cooldownStr || "There are no cooldowns found for this user.";
    }
}