import { ApplicationCommandOptionType, ChatInputCommandInteraction, ColorResolvable, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Member, { IMember } from "../../models/Member";
import loot from "../../assets/luckyWheel.json";
import Helpers from "../../utils/Helpers";
import Achievement from "../../utils/Achievement";
import User from "../../utils/User";

type RewardsItem = {
    itemId: string;
    amount: number;
}

export default class extends Command implements ICommand {
    private readonly ticketPrice = 15;
    private readonly maxSpins = 50;
    private readonly lootTable: string;

    readonly info = {
        name: "lucky-wheel",
        description: "Spin the lucky wheel and get awesome rewards",
        options: [
            {
                name: "info",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Get more info about the possible loot or spin prices.",
                options: [],
            },
            {
                name: "spin",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Spin the lucky wheel!",
                options: [
                    {
                        name: "amount",
                        type: ApplicationCommandOptionType.Integer,
                        description: "How many spins you want to do at once. | default: 1.",
                        required: false,
                        min_value: 1,
                        max_value: this.maxSpins,
                    },
                ],
            },
            {
                name: "buy",
                type: ApplicationCommandOptionType.Subcommand,
                description: "Buy more spins for the lucky wheel.",
                options: [
                    {
                        name: "amount",
                        type: ApplicationCommandOptionType.Integer,
                        description: "How many spins you want to buy. | default: 1.",
                        required: false,
                        min_value: 1,
                        max_value: this.maxSpins,
                    },
                ],
            },
        ],
        category: "general",
    };

    private readonly achievement;

    constructor(bot: Bot, file: string) {
        super(bot, file);

        this.achievement = Achievement.getById("feeling_lucky");
        const rewards: string[] = [];
        const keys = Object.keys(loot);

        for (let i = 0; i < keys.length; i++) {
            if (keys[i].startsWith("money")) {
                rewards.push(`:coin: **${loot[keys[i] as keyof typeof loot]}**`);
            } else if (keys[i].startsWith("tickets")) {
                rewards.push(`**${loot[keys[i] as keyof typeof loot]}x** <:ticket:1032669959161122976> Tickets`);
            } else {
                const item = this.client.items.getById(keys[i]);
                if (!item) continue;

                rewards.push(`**${loot[keys[i] as keyof typeof loot]}x** <:${item.itemId}:${item.emoteId}> ${item.name}`);
            }
        }

        this.lootTable = rewards.join("\n");
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        switch (interaction.options.getSubcommand()) {
            case "info":
                await this.getInfo(interaction, member);
                break;
            case "spin":
                await this.getSpin(interaction, member);
                break;
            case "buy":
                await this.getBuy(interaction, member);
                break;
            default:
                await interaction.reply({ content: this.client.config.embed.color, ephemeral: true });
        }
    }

    private async getInfo(interaction: ChatInputCommandInteraction, member: IMember) {
        const embed = new EmbedBuilder()
            .setTitle("Lucky Wheel")
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription(`:gift: **</lucky-wheel buy:1005435550884442193> or </vote:993095062726647810> to get more spins!**\n:moneybag: **Wheel Spins cost <:ticket:1032669959161122976> ${this.ticketPrice} per spin.**\n:warning: **You get 1 free spin per vote and double spins in the weekend.**\n:gem: **Premium users always get double spins, more info [here](https://coinzbot.xyz/store).**\n:star: **You have ${member.spins}x ${member.spins === 1 ? "spin" : "spins"} left**`)
            .setFooter({ text: this.client.config.embed.footer })
            .addFields({ name: "Possible Loot", value: this.lootTable, inline: true });
        await interaction.reply({ embeds: [embed] });
    }

    private async getSpin(interaction: ChatInputCommandInteraction, member: IMember) {
        const amount = interaction.options.getInteger("amount") ?? 1;
        if (member.spins < amount) {
            await interaction.reply({ content: `You don't have enough spins! You have ${member.spins}x ${member.spins === 1 ? "spin" : "spins"} left.`, ephemeral: true });
            return;
        }

        const loadingEmbed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.user.username}'s Lucky Wheel`, iconURL: interaction.user.displayAvatarURL() })
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription(":gear: **Spinning the wheel...**")
            .setFooter({ text: this.client.config.embed.footer })
            .setImage("https://cdn.coinzbot.xyz/v3/bot/luckywheel.gif");
        await interaction.reply({ embeds: [loadingEmbed] });
        await Helpers.getTimeout(3_500);

        const rewardItems = this.getLoot(amount);
        let earnedCoins = 0;
        let earnedTickets = 0;
        let totalValue = 0;

        const rewardsStr = rewardItems.map(async (rItem) => {
            if (rItem.itemId.startsWith("money")) {
                earnedCoins += rItem.amount;
                return;
            } else if (rItem.itemId.startsWith("tickets")) {
                earnedTickets += rItem.amount;
                return;
            } else {
                const item = this.client.items.getById(rItem.itemId);
                if (!item) return;
                totalValue += item.sellPrice ? item.sellPrice * rItem.amount : 0;
                await this.client.items.addItem(rItem.itemId, member, rItem.amount);
                return `**${rItem.amount}x** <:${item.itemId}:${item.emoteId}> ${item.name}`;
            }
        }).join("\n") || "No rewards :(";

        await Member.updateOne({ userId: interaction.user.id }, {
            $inc: { spins: -amount, coins: earnedCoins, tickets: earnedTickets, "stats.luckyWheelSpins": amount },
        });

        await User.sendAchievementMessage(interaction, interaction.user.id, this.achievement);

        const bonusTxt = earnedCoins > 0 || earnedTickets > 0 ? "\n:moneybag: **You also got :coin: ${money} and <:ticket:1032669959161122976> ${tickets} extra!**" : "";
        const embed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.user.username}'s Lucky Wheel`, iconURL: interaction.user.displayAvatarURL() })
            .setColor(<ColorResolvable>this.client.config.embed.color)
            .setDescription(`:tada: **You spun the lucky wheel ${amount} time${amount === 1 ? "" : "s"}.**\n:gem: **Your rewards are :coin: ${totalValue} worth.**${bonusTxt}`)
            .setFooter({ text: this.client.config.embed.footer })
            .addFields({ name: `Rewards (${amount} spin${amount === 1 ? "" : "s"})`, value: rewardsStr, inline: true });
        await interaction.editReply({ embeds: [embed] });
        await this.client.items.checkForDuplicates(member);
    }

    private async getBuy(interaction: ChatInputCommandInteraction, member: IMember) {
        const amount = interaction.options.getInteger("amount") ?? 1;
        const price = amount * this.ticketPrice;

        if (member.tickets < price) {
            await interaction.reply({ content: `You don't have enough <:ticket:1032669959161122976> **tickets**! You only have ${member.tickets}x <:ticket:1032669959161122976> **tickets**.`, ephemeral: true });
            return;
        }

        await Member.updateOne({ userId: interaction.user.id }, {
            $inc: { spins: amount, tickets: -price },
        });
        await interaction.reply({ content: `You bought ${amount} spin${amount === 1 ? "" : "s"} for <:ticket:1032669959161122976> ${price}.` });
    }

    private getLoot(amount: number): RewardsItem[] {
        const rewards: RewardsItem[] = [];
        const keys = Object.keys(rewards);

        for (let i = 0; i < amount; i++) {
            const itemId = keys[Math.floor(Math.random() * keys.length)];

            // check if itemId already is in rewards
            const index = rewards.findIndex((r) => r.itemId === itemId);

            if (index !== -1) {
                rewards[index].amount += loot[itemId as keyof typeof loot];
            } else {
                rewards.push({
                    itemId,
                    amount: loot[itemId as keyof typeof loot],
                });
            }
        }

        return rewards;
    }
}