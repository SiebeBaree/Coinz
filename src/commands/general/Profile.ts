import { ActionRowBuilder, ApplicationCommandOptionType, ChatInputCommandInteraction, ColorResolvable, ComponentType, EmbedBuilder, StringSelectMenuBuilder, User } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IInvestment, IMember } from "../../models/Member";
import Database from "../../utils/Database";
import InventoryItem from "../../interfaces/InventoryItem";
import UserUtil from "../../utils/User";
import Achievement from "../../utils/Achievement";
import Cooldown from "../../models/Cooldown";

interface ICalulatedObject {
    value: number;
    items: number;
    initialValue?: number;
}

export default class extends Command implements ICommand {
    readonly info = {
        name: "profile",
        description: "Get your or another user's Coinz profile. You can see detailed information here.",
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

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction) {
        const selectedUser = interaction.options.getUser("user") || interaction.user;

        const selectedUserData = await Database.getMember(selectedUser.id);
        selectedUserData.profileColor = selectedUserData.premium.active ? selectedUserData.profileColor : this.client.config.embed.color;

        const inventory = this.calculateInventoryValue(selectedUserData.inventory);
        const investments = await this.calculateInvestmentsValue(selectedUserData.stocks);
        let selectedOption = "profile";

        const workJob = selectedUserData.job === "" ? "Unemployed" : selectedUserData.job;
        let businessJob = "Not working at a business.";

        if (selectedUserData.business !== "") {
            const business = await Database.getBusiness(selectedUserData.business);

            businessJob = selectedUserData.id === business.ownerId ? "CEO of " : "Working at ";
            businessJob += business ? business.name : " a business";
        }

        const message = await interaction.editReply({ embeds: [this.createProfileEmbed(selectedUser, selectedUserData, inventory, investments, workJob, businessJob)], components: [...this.createSelectMenu(selectedOption)] });
        const collector = message.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, max: 5, time: 90_000, componentType: ComponentType.StringSelect });

        collector.on("collect", async (i) => {
            if (i.customId !== "profile") return;
            selectedOption = i.values[0];
            let embed;

            switch (selectedOption) {
                case "cooldowns":
                    embed = await this.createCooldownEmbed(selectedUser, selectedUserData.profileColor || this.client.config.embed.color);
                    break;
                default:
                    embed = this.createProfileEmbed(selectedUser, selectedUserData, inventory, investments, workJob, businessJob);
                    break;
            }

            if (embed !== undefined) await i.update({ embeds: [embed], components: [...this.createSelectMenu(selectedOption)] });
        });

        collector.on("end", async () => {
            await interaction.editReply({ components: [...this.createSelectMenu(selectedOption, true)] });
        });
    }

    calculateInventoryValue(inventory: InventoryItem[]): ICalulatedObject {
        const returnObj = { value: 0, items: 0 };

        for (const invItem of inventory) {
            const item = this.client.items.getById(invItem.itemId);
            if (!item) continue;

            returnObj.value += item.sellPrice ?? 0;
            returnObj.items += invItem.amount;
        }

        return returnObj;
    }

    async calculateInvestmentsValue(investments: IInvestment[]): Promise<ICalulatedObject> {
        const returnObj = { value: 0, items: 0, initialValue: 0 };

        for (const investment of investments) {
            const item = await Database.getInvestment(investment.ticker);
            if (!item) continue;

            returnObj.items += Math.round(+investment.amount.toString());
            returnObj.value += +item.price.toString() * +investment.amount.toString();
            returnObj.initialValue += investment.buyPrice;
        }

        return returnObj;
    }

    createProfileEmbed(user: User, userData: IMember, inventory: ICalulatedObject, stocks: ICalulatedObject, workJob: string, businessJob: string): EmbedBuilder {
        const createProgressBar = (current: number): string => {
            const progress = Math.round(current / 10);
            const bar = [];

            bar.push(progress === 0 ? "<:bar_start0:1054825378688020601>" : "<:bar_start1:1054825380055371866>");
            for (let i = 2; i <= 9; i++) {
                bar.push(progress < i ? "<:bar_mid0:1054825371146657903>" : "<:bar_mid1:1054825377157087254>");
            }
            bar.push(progress < 10 ? "<:bar_end0:1054825373801644093>" : "<:bar_end1:1054825376087547995>");

            return bar.join("");
        };

        const expireTimestamp = userData.premium.expires > Math.floor(Date.now() / 1000) ? userData.premium.expires : 0;
        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s profile ${userData.displayedBadge === "" ? "" : `<:${userData.displayedBadge}:${Achievement.getById(userData.displayedBadge)?.emoji}>`}`)
            .setColor(<ColorResolvable>(userData.profileColor || this.client.config.embed.color))
            .setThumbnail(user.displayAvatarURL() || this.client.config.embed.icon)
            .addFields(
                { name: "Experience", value: `:beginner: **Level:** \`${UserUtil.getLevel(userData.experience)}\`\n:game_die: **Next Level:** \`${userData.experience % 100}%\`\n${createProgressBar(userData.experience % 100)}`, inline: false },
                { name: "Premium Status", value: userData.premium.active && expireTimestamp > 0 ? `:star: **Premium:** :white_check_mark:\n:hourglass: **Premium Expires:** <t:${expireTimestamp}:D>\n` : ":star: **Premium:** :x:", inline: false },
                { name: "Balance", value: `:dollar: **Wallet:** :coin: ${userData.wallet}\n:bank: **Bank:** :coin: ${userData.bank} / ${userData.bankLimit}\n:moneybag: **Net Worth:** :coin: ${userData.wallet + userData.bank}\n:credit_card: **Tickets:** <:ticket:1032669959161122976> ${userData.tickets || 0}\n:gem: **Inventory Worth:** \`${inventory.items} items\` valued at :coin: ${inventory.value}`, inline: false },
                { name: "Investment Portfolio", value: `:dollar: **Worth:** :coin: ${stocks.value}\n:credit_card: **Amount:** ${stocks.items}\n:moneybag: **Invested:** :coin: ${stocks.initialValue}`, inline: false },
                { name: "Misc", value: `:briefcase: **Current Job:** ${workJob}\n:office: **Business:** ${businessJob}\n:sparkles: **Daily Streak:** ${userData.streak - 1 > 0 ? userData.streak - 1 : 0} days\n:seedling: **Farm:** ${userData.plots.length} plots`, inline: false },
                { name: "Badges (Achievements)", value: `${userData.badges.length <= 0 ? "None" : userData.badges.map((id) => `<:${id}:${Achievement.getById(id)?.emoji}>`).join(" ")}`, inline: false },
            );
        return embed;
    }

    async createCooldownEmbed(user: User, profileColor: string): Promise<EmbedBuilder> {
        const cooldowns = await Cooldown.find({ id: user.id });

        let cooldownStr = "";
        if (cooldowns) {
            let cooldownsAmount = 0;
            const maxCooldowns = 25;

            const now = Math.floor(Date.now() / 1000);
            if (cooldowns.length <= 0) {
                for (let i = 0; i < cooldowns.length; i++) {
                    if (cooldowns[i].expires > now) {
                        if (cooldownsAmount <= maxCooldowns) {
                            cooldownStr += `**${cooldowns[i].command}:** <t:${cooldowns[i].expires}:R>\n`;
                            cooldownsAmount++;
                        } else {
                            break;
                        }
                    }
                }
            }

            if (cooldowns.length > maxCooldowns) cooldownStr += `and \`${cooldowns.length - maxCooldowns}\` more cooldowns...`;
        }

        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s cooldowns`)
            .setColor(<ColorResolvable>(profileColor || this.client.config.embed.color))
            .setDescription(cooldownStr || "There are no cooldowns found for this user.");
        return embed;
    }

    createSelectMenu(selectedOption: string, isDisabled = false): ActionRowBuilder<StringSelectMenuBuilder>[] {
        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("profile")
                    .setPlaceholder("The interaction has ended")
                    .addOptions([
                        {
                            label: "Profile",
                            value: "profile",
                            description: "View the profile of the user.",
                            emoji: "👤",
                            default: selectedOption === "profile",
                        },
                        {
                            label: "Cooldowns",
                            value: "cooldowns",
                            description: "View the cooldowns of the user.",
                            emoji: "⏱️",
                            default: selectedOption === "cooldowns",
                        },
                    ])
                    .setDisabled(isDisabled),
            );
        return [row];
    }
}