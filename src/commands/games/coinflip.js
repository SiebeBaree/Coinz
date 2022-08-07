const Command = require('../../structures/Command.js');
const { EmbedBuilder, ApplicationCommandOptionType, Colors } = require('discord.js');

class Coinflip extends Command {
    info = {
        name: "coinflip",
        description: "Flip a coin and guess on what side it's going to land.",
        options: [
            {
                name: 'bet',
                type: ApplicationCommandOptionType.Integer,
                description: 'The bet you want to place.',
                required: true,
                min_value: 50,
                max_value: 5000
            },
            {
                name: 'coin-side',
                type: ApplicationCommandOptionType.String,
                description: 'The side of the coin you thinks it\'s going to land on. < HEAD or TAILS >',
                required: true,
                choices: [
                    {
                        name: "HEAD",
                        value: "HEAD"
                    },
                    {
                        name: "TAILS",
                        value: "TAILS"
                    }
                ]
            }
        ],
        category: "games",
        extraFields: [],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 300,
        enabled: true,
        guildRequired: false,
        memberRequired: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const bet = interaction.options.getInteger('bet');

        if (bet > data.user.wallet) {
            await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            return await interaction.editReply({ content: `You don't have :coin: ${bet} in your wallet.` });
        }

        const side = interaction.options.getString('coin-side');
        const randomNumber = bot.tools.randomNumber(0, 1);
        const sideLanded = randomNumber === 0 ? "HEAD" : "TAILS";

        const newEmbed = new EmbedBuilder()
            .setAuthor({ name: `Coinflip`, iconURL: `${interaction.member.displayAvatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(sideLanded === side ? Colors.Green : Colors.Red)
            .setFooter({ text: bot.config.embed.footer })
            .setDescription(`:coin: **You chose:** ${side}\n:moneybag: **Your Bet:** :coin: ${bet}\n\n**The coin landed on:** ${sideLanded}\n${side === sideLanded ? "**You won:** :coin: " + parseInt(bet * 1.5) : "**You lost:** :coin: " + bet}`)
            .setThumbnail(sideLanded === "HEAD" ? "https://cdn.coinzbot.xyz/games/coinflip/coin-head.png" : "https://cdn.coinzbot.xyz/games/coinflip/coin-tail.png")
        await interaction.editReply({ embeds: [newEmbed] });

        if (sideLanded === side) {
            await bot.tools.addMoney(interaction.member.id, parseInt(bet * 0.5));
        } else {
            await bot.tools.takeMoney(interaction.member.id, bet);
        }
    }
}

module.exports = Coinflip;