import Command from '../../structures/Command.js'
import { EmbedBuilder, ApplicationCommandOptionType, Colors } from 'discord.js'
import { checkBet, randomNumber as randInt } from '../../lib/helpers.js'
import { addMoney, addRandomExperience, takeMoney } from '../../lib/user.js'

export default class extends Command {
    info = {
        name: "coinflip",
        description: "Flip a coin and guess on what side it's going to land.",
        options: [
            {
                name: 'bet',
                type: ApplicationCommandOptionType.String,
                description: 'The bet you want to place.',
                required: true,
                min_length: 2,
                max_length: 6
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
        extraFields: [
            { name: "Bet Formatting", value: "You can use formatting to make it easier to use big numbers.\n\n__For Example:__\n~~1000~~ **1K**\n~~1300~~ **1.3K**\nUse `all` or `max` to use a maximum of :coin: 5000.", inline: false }
        ],
        cooldown: 300,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const betStr = interaction.options.getString('bet');
        let bet = 50;

        if (["all", "max"].includes(betStr.toLowerCase())) {
            if (data.user.wallet <= 0) return await interaction.reply({ content: `You don't have any money in your wallet.`, ephemeral: true });

            if (data.premium.premium) {
                bet = data.user.wallet > 10000 ? 10000 : data.user.wallet;
            } else {
                bet = data.user.wallet > 5000 ? 5000 : data.user.wallet;
            }
        } else {
            bet = checkBet(betStr, data.user, data.premium.premium);

            if (!Number.isInteger(bet)) {
                await interaction.reply({ content: bet, ephemeral: true });
                return await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            }
        }
        await interaction.deferReply();

        const side = interaction.options.getString('coin-side');
        const randomNumber = randInt(0, 1);
        const sideLanded = randomNumber === 0 ? "HEAD" : "TAILS";

        const newEmbed = new EmbedBuilder()
            .setAuthor({ name: `Coinflip`, iconURL: `${interaction.member.displayAvatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(sideLanded === side ? Colors.Green : Colors.Red)
            .setFooter({ text: bot.config.embed.footer })
            .setDescription(`:coin: **You chose:** ${side}\n:moneybag: **Your Bet:** :coin: ${bet}\n\n**The coin landed on:** ${sideLanded}\n${side === sideLanded ? "**Profit:** :coin: " + Math.floor(bet / 3) : "**You lost:** :coin: " + bet}`)
            .setThumbnail(sideLanded === "HEAD" ? "https://cdn.coinzbot.xyz/games/coinflip/coin-head.png" : "https://cdn.coinzbot.xyz/games/coinflip/coin-tail.png")
        await interaction.editReply({ embeds: [newEmbed] });

        if (sideLanded === side) {
            await addRandomExperience(interaction.member.id);
            await addMoney(interaction.member.id, Math.floor(bet / 3));
        } else {
            await takeMoney(interaction.member.id, bet, true);
        }
    }
}