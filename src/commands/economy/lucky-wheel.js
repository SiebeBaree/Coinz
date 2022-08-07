const Command = require('../../structures/Command.js');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const items = require('../../assets/lootTables/luckyWheel.json').rewards;
const MemberModel = require('../../models/Member');

class LuckyWheel extends Command {
    info = {
        name: "lucky-wheel",
        description: "Spin the lucky wheel and get awesome rewards",
        options: [
            {
                name: 'rewards',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get a list with the possible loot of a spin.',
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
                        description: 'How many spins you want to do in 1 command.',
                        required: false,
                        min_value: 1,
                        max_value: 15
                    }
                ]
            }
        ],
        category: "economy",
        extraFields: [],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 0,
        enabled: true,
        guildRequired: false,
        memberRequired: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        if (interaction.options.getSubcommand() === "rewards") return await this.execRewards(interaction, data);
        if (interaction.options.getSubcommand() === "spin") return await this.execSpin(interaction, data);
        return await interaction.editReply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${this.info.name}\`.` });
    }

    async execRewards(interaction, data) {
        const spinsLeft = data.user.spins === undefined ? 0 : data.user.spins;

        let rewardsTxt = "";
        for (let i = 0; i < items.length; i++) {
            const parsedItem = items[i].split('-');

            if (parsedItem[0] === "money") {
                rewardsTxt += `Money: :coin: ${parsedItem[1]}\n`;
            } else {
                const item = await bot.database.fetchItem(parsedItem[0]);
                rewardsTxt += `**${parsedItem[1]}x** ${item.name} <:${item.itemId}:${item.emoteId}>\n`;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`Lucky Wheel Rewards`)
            .setColor(bot.config.embed.color)
            .setDescription(`:gift: **To spin the wheel, please vote for Coinz using the** \`/vote\` **command.**\n:warning: **You get 1 free spin per vote!**\n:star: **You have ${spinsLeft}x ${spinsLeft === 1 ? "spin" : "spins"} left.**`)
            .setFooter({ text: bot.config.embed.footer })
            .addFields(
                { name: `Rewards`, value: `${rewardsTxt}`, inline: false }
            )

        await interaction.editReply({ embeds: [embed] });
    }

    async execSpin(interaction, data) {
        const amount = interaction.options.getInteger('amount') || 1;

        if (data.user.spins === undefined || data.user.spins <= 0) {
            return await interaction.editReply({ content: `You don't have any spins left. If you want to spin the lucky wheel, consider voting (\`/vote\`). You get 1x free spin for each vote.` });
        } else if (data.user.spins < amount) {
            return await interaction.editReply({ content: `You only have ${data.user.spins} spins left.` });
        }

        const preEmbed = new EmbedBuilder()
            .setAuthor({ name: `${interaction.member.displayName || interaction.member.username}'s Lucky Wheel`, iconURL: `${interaction.member.displayAvatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(bot.config.embed.color)
            .setDescription(`:gift: **Currently spinning the wheel!**`)
            .setFooter({ text: bot.config.embed.footer })
            .setImage(`https://cdn.coinzbot.xyz/games/extra/luckywheel.gif`)

        await interaction.editReply({ embeds: [preEmbed] });
        await bot.tools.timeout(3000);

        const loot = bot.tools.getRandomLoot(items, amount || 1);
        let mappedLoot = loot.reduce((cnt, cur) => (cnt[cur] = cnt[cur] + 1 || 1, cnt), {});
        let keys = Object.keys(mappedLoot);

        let rewardsTxt = "";
        let totalPrice = 0;
        let bonus = 0;

        for (let i = 0; i < keys.length; i++) {
            const parsedItem = keys[i].split('-');

            if (parsedItem[0] === "money") {
                bonus += parseInt(parsedItem[1]);
            } else {
                const item = await bot.database.fetchItem(parsedItem[0]);
                totalPrice += item.sellPrice * parseInt(parsedItem[1]);
                rewardsTxt += `${mappedLoot[keys[i]] * parseInt(parsedItem[1])}x ${item.name} <:${item.itemId}:${item.emoteId}>\n`;
                await bot.tools.addItem(interaction.member.id, item.itemId, mappedLoot[keys[i]] * parseInt(parsedItem[1]), data.user.inventory);
            }
        }

        if (rewardsTxt === "") rewardsTxt = "You got no extra loot. You only got money.";
        let bonusTxt = bonus === 0 ? "" : `\n:moneybag: **You also got a :coin: ${bonus} bonus!**`;

        await MemberModel.updateOne(
            { id: interaction.member.id },
            { $inc: { spins: -amount, wallet: bonus } }
        );

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
}

module.exports = LuckyWheel;