import Command from '../../structures/Command.js'
import {
    EmbedBuilder,
    ApplicationCommandOptionType,
    Colors
} from 'discord.js'
import { checkBet, randomNumber, timeout } from '../../lib/helpers.js'
import { addMoney, takeMoney } from '../../lib/user.js'

export default class extends Command {
    info = {
        name: "roulette",
        description: "Play a game of roulette.",
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
                name: 'space',
                type: ApplicationCommandOptionType.String,
                description: 'For more information on this, visit /help roulette',
                required: true
            }
        ],
        category: "games",
        extraFields: [
            { name: "Bet Formatting", value: "You can use formatting to make it easier to use big numbers.\n\n__For Example:__\n~~1000~~ **1K**\n~~1300~~ **1.3K**\nUse `all` or `max` to use a maximum of :coin: 5000.", inline: false },
            { name: 'Space Multiplier', value: '[x36] Straight (1, 2, 3, ..., 36)\n[x3] 1-12, 13-24, 25-36\n[x3] 1st, 2nd, 3rd\n[x2] 1-18, 19-36\n[x 2] Odd, Even\n[x2] red, black', inline: false }
        ],
        image: "https://cdn.coinzbot.xyz/games/roulette/table.png",
        cooldown: 300,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    redColors = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const betStr = interaction.options.getString('bet');
        let bet = 50;

        if (["all", "max"].includes(betStr.toLowerCase())) {
            if (data.user.wallet <= 0) return await interaction.reply({ content: `You don't have any money in your wallet.`, ephemeral: true });
            bet = data.user.wallet > 5000 ? 5000 : data.user.wallet;
        } else {
            bet = checkBet(betStr, data.user);

            if (!Number.isInteger(bet)) {
                await interaction.reply({ content: bet, ephemeral: true });
                return await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            }
        }
        await interaction.deferReply();
        const space = interaction.options.getString('space');

        // initialize variables
        data.bet = bet;
        data.userSpace = space.toLowerCase();
        data.playerWon = false;
        data.ball = randomNumber(0, 36);
        data.multiplier = 1;
        data = this.playerWon(data);
        data.color = this.redColors.includes(data.ball) ? "red" : "black";
        if (data.space === -1) return await interaction.editReply({ content: `That is not a valid space. Please check all spaces with \`/help command ${this.info.name}\`.` });

        if (data.playerWon) {
            await addMoney(interaction.member.id, parseInt(data.bet * (data.multiplier - 1)));
        } else {
            await takeMoney(interaction.member.id, data.bet);
        }

        const embed = new EmbedBuilder()
            .setTitle(`Roulette`)
            .setColor(bot.config.embed.color)
            .setDescription("Spinning the wheel...")
            .setImage("https://media3.giphy.com/media/26uf2YTgF5upXUTm0/giphy.gif");

        await interaction.editReply({ embeds: [embed] });
        await timeout(5000);
        await interaction.editReply({ embeds: [this.createEmbed(data)] });
    }

    createEmbed(data) {
        let color = Colors.Green;
        if (!data.playerWon) color = Colors.Red;

        const embed = new EmbedBuilder()
            .setTitle(`Roulette`)
            .setColor(color)
            .addFields(
                { name: 'Ball', value: `The ball landed on **${data.color} ${data.ball}**`, inline: false },
                { name: 'Multiplier', value: `${data.multiplier}x`, inline: true },
                { name: 'Profit', value: `:coin: ${data.playerWon ? parseInt(data.multiplier * data.bet - data.bet) : -data.bet}`, inline: true }
            )
        return embed;
    }

    playerWon(data) {
        switch (data.userSpace) {
            case 'red':
                data.playerWon = this.redColors.includes(data.ball);
                data.multiplier = 2;
                break;
            case 'black':
                data.playerWon = !this.redColors.includes(data.ball);
                data.multiplier = 2;
                break;
            case 'odd':
                data.playerWon = data.ball % 2 === 1;
                data.multiplier = 2;
                break;
            case 'even':
                data.playerWon = data.ball % 2 === 0;
                data.multiplier = 2;
                break;
            case '1st':
                data.playerWon = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(data.ball);
                data.multiplier = 3;
                break;
            case '2nd':
                data.playerWon = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].includes(data.ball);
                data.multiplier = 3;
                break;
            case '3rd':
                data.playerWon = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].includes(data.ball);
                data.multiplier = 3;
                break;
            case '1-12':
                data.playerWon = data.ball >= 1 && data.ball <= 12;
                data.multiplier = 3;
                break;
            case '13-24':
                data.playerWon = data.ball >= 13 && data.ball <= 24;
                data.multiplier = 3;
                break;
            case '25-36':
                data.playerWon = data.ball >= 25 && data.ball <= 36;
                data.multiplier = 3;
                break;
            case '1-18':
                data.playerWon = data.ball >= 1 && data.ball <= 18;
                data.multiplier = 2;
                break;
            case '19-36':
                data.playerWon = data.ball >= 19 && data.ball <= 36;
                data.multiplier = 2;
                break;
            default:
                data.multiplier = 1;
                data.space = -1;
                break;
        }

        if (data.space === -1) {
            try {
                data.playerWon = data.ball === parseInt(data.userSpace);
                data.multiplier = 36;
                data.space = 0;
            } catch (e) { }
        }
        return data;
    }
}