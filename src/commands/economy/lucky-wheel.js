import Command from '../../structures/Command.js'
import { EmbedBuilder, ApplicationCommandOptionType } from 'discord.js'
import { timeout, getRandomLoot } from '../../lib/helpers.js'
import { addItem } from '../../lib/user.js'
import MemberModel from '../../models/Member.js'
import Stats from '../../models/Stats.js'
import luckyWheelJson from '../../assets/loot/luckyWheel.json' assert { type: "json" }
const items = luckyWheelJson.rewards;

export default class extends Command {
    info = {
        name: "lucky-wheel",
        description: "Spin the lucky wheel and get awesome rewards",
        options: [
            {
                name: 'info',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get more info about the possible loot or spin prices.',
                options: []
            },
            {
                name: 'spin',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Spin the lucky wheel!',
                options: [
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Integer,
                        description: 'How many spins you want to do in 1 command. | default: 1.',
                        required: false,
                        min_value: 1,
                        max_value: 20
                    }
                ]
            },
            {
                name: 'buy',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Buy more spins for the lucky wheel.',
                options: [
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Integer,
                        description: 'How many spins you want to buy. | default: 1.',
                        required: false,
                        min_value: 1,
                        max_value: 20
                    }
                ]
            }
        ],
        category: "economy",
        extraFields: [],
        cooldown: 0,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    ticketPrice = 10;

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        if (interaction.options.getSubcommand() === "info") return await this.execInfo(interaction, data);
        if (interaction.options.getSubcommand() === "spin") return await this.execSpin(interaction, data);
        if (interaction.options.getSubcommand() === "buy") return await this.execBuy(interaction, data);
        return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help command ${this.info.name}\`.`, ephemeral: true });
    }

    async execInfo(interaction, data) {
        await interaction.deferReply();
        const spinsLeft = data.user.spins === undefined ? 0 : data.user.spins;

        let rewardsTxt = "";
        for (let i = 0; i < items.length; i++) {
            const parsedItem = items[i].split('-');

            if (parsedItem[0] === "money") {
                rewardsTxt += `Money: :coin: ${parsedItem[1]}\n`;
            } else if (parsedItem[0] === "tickets") {
                rewardsTxt += `**${parsedItem[1]}x** Tickets <:ticket:1032669959161122976> \n`;
            } else {
                const item = await bot.database.fetchItem(parsedItem[0]);
                rewardsTxt += `**${parsedItem[1]}x** ${item.name} <:${item.itemId}:${item.emoteId}>\n`;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`Lucky Wheel Rewards`)
            .setColor(bot.config.embed.color)
            .setDescription(`:gift: **</lucky-wheel buy:1005435550884442193> or </vote:993095062726647810> to get more spins!**\n:moneybag: **Wheel Spins cost <:ticket:1032669959161122976> ${this.ticketPrice} per spin.**\n:warning: **You get 1 free spin per vote and double spins in the weekend.**\n:gem: **Premium users always get double spins, more info [here](https://coinzbot.xyz/store).**\n:star: **You have ${spinsLeft}x ${spinsLeft === 1 ? "spin" : "spins"} left**`)
            .setFooter({ text: bot.config.embed.footer })
            .addFields(
                { name: `Possible Rewards`, value: `${rewardsTxt}`, inline: false }
            )

        await interaction.editReply({ embeds: [embed] });
    }

    async execSpin(interaction, data) {
        const amount = interaction.options.getInteger('amount') || 1;

        if (data.user.spins === undefined || data.user.spins <= 0) {
            return await interaction.reply({ content: `You don't have any spins left. If you want to spin the lucky wheel, consider voting (</vote:993095062726647810>). You get 1x free spin for each vote and double spins in the weekend.`, ephemeral: true });
        } else if (data.user.spins < amount) {
            return await interaction.reply({ content: `You only have ${data.user.spins} spins left.`, ephemeral: true });
        }
        await interaction.deferReply();

        const preEmbed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.member.displayName || interaction.member.username}'s Lucky Wheel`, iconURL: `${interaction.member.displayAvatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(bot.config.embed.color)
            .setDescription(`:gift: **Currently spinning the wheel!**`)
            .setFooter({ text: bot.config.embed.footer })
            .setImage(`https://cdn.coinzbot.xyz/games/extra/luckywheel.gif`)

        await interaction.editReply({ embeds: [preEmbed] });
        await timeout(3000);

        const loot = getRandomLoot(items, amount || 1);
        let mappedLoot = loot.reduce((cnt, cur) => (cnt[cur] = cnt[cur] + 1 || 1, cnt), {});
        let keys = Object.keys(mappedLoot);

        let rewardsTxt = "";
        let totalPrice = 0;
        let money = 0;
        let tickets = 0;

        for (let i = 0; i < keys.length; i++) {
            const parsedItem = keys[i].split('-');

            if (parsedItem[0] === "money") {
                money += parseInt(parsedItem[1]);
            } else if (parsedItem[0] === "tickets") {
                tickets += parseInt(parsedItem[1]);
            } else {
                const item = await bot.database.fetchItem(parsedItem[0]);
                totalPrice += item.sellPrice * parseInt(parsedItem[1]);
                rewardsTxt += `${mappedLoot[keys[i]] * parseInt(parsedItem[1])}x ${item.name} <:${item.itemId}:${item.emoteId}>\n`;
                await addItem(interaction.member.id, item.itemId, mappedLoot[keys[i]] * parseInt(parsedItem[1]), data.user.inventory);
            }
        }

        if (rewardsTxt === "") rewardsTxt = "You got no extra loot. You only got money and/or tickets.";
        let bonusTxt = money === 0 && tickets === 0 ? "" : `\n:moneybag: **You also got :coin: ${money} and <:ticket:1032669959161122976> ${tickets} extra!**`;

        await MemberModel.updateOne(
            { id: interaction.member.id },
            { $inc: { spins: -amount, wallet: money, tickets: tickets } }
        );

        await Stats.updateOne(
            { id: interaction.member.id },
            { $inc: { luckyWheelSpins: amount } },
            { upsert: true }
        );

        const userStats = await Stats.findOne({ id: interaction.member.id });
        if (userStats.luckyWheelSpins >= 50 && !data.user.badges.includes("feeling_lucky")) {
            await MemberModel.updateOne(
                { id: interaction.member.id },
                { $push: { badges: "feeling_lucky" } }
            );
        }

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.member.displayName || interaction.member.username}'s Lucky Wheel`, iconURL: `${interaction.member.displayAvatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(bot.config.embed.color)
            .setDescription(`:tada: **You spinned the lucky wheel ${amount} ${amount === 1 ? "time" : "times"}.**\n:gem: **Your rewards are :coin: ${totalPrice} worth.**${bonusTxt}`)
            .setFooter({ text: bot.config.embed.footer })
            .addFields(
                { name: `Rewards (${amount} ${amount === 1 ? "spin" : "spins"})`, value: `${rewardsTxt}`, inline: false }
            )

        await interaction.editReply({ embeds: [embed] });
    }

    async execBuy(interaction, data) {
        const amount = interaction.options.getInteger('amount') || 1;

        if (data.user.tickets < this.ticketPrice * amount) {
            return await interaction.reply({ content: `You don't have enough tickets. You need <:ticket:1032669959161122976> ${this.ticketPrice * amount} to spin the wheel ${amount} ${amount === 1 ? "time" : "times"}.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        await MemberModel.updateOne(
            { id: interaction.member.id },
            { $inc: { spins: amount, tickets: -this.ticketPrice * amount } }
        );

        await interaction.editReply({ content: `You bought ${amount} ${amount === 1 ? "spin" : "spins"} for <:ticket:1032669959161122976> ${this.ticketPrice * amount}.`, ephemeral: true });
    }
}