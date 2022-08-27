const Command = require('../../structures/Command.js');
const { EmbedBuilder, Colors, ApplicationCommandOptionType } = require('discord.js');

class HorseRace extends Command {
    info = {
        name: "horse-race",
        description: "Bet on the fastest horse to earn money.",
        options: [
            {
                name: 'bet',
                type: ApplicationCommandOptionType.String,
                description: 'The bet you want to place.',
                required: true,
                min_length: 2,
                max_length: 4
            },
            {
                name: 'horse',
                type: ApplicationCommandOptionType.Integer,
                description: 'The horse you want to bet on.',
                required: true,
                min_value: 1,
                max_value: 3
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
            bet = data.user.wallet > 5000 ? 5000 : data.user.wallet;
        } else {
            bet = bot.tools.checkBet(betStr, data.user);

            if (!Number.isInteger(bet)) {
                await interaction.reply({ content: bet, ephemeral: true });
                return await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            }
        }
        await interaction.deferReply();
        const horseNr = interaction.options.getInteger('horse');

        // setup variable
        data.bet = bet;
        data.userWon = false;
        data.stoppedGame = false;
        data.horses = Array(3).fill(10);
        data.status = "Racing...";
        data.horseNr = horseNr;

        const createEmbed = (data) => {
            const embed = new EmbedBuilder()
                .setTitle(`Horse Race`)
                .setColor(data.color || bot.config.embed.color)
                .setDescription(`:moneybag: **Bet:** :coin: ${data.bet}\n:1234: **Your Horse:** \`${data.horseNr}\`\n:hourglass: **Status:** ${data.status}\n\n**1.** ${"-".repeat(data.horses[0])}:horse_racing:\n**2.** ${"-".repeat(data.horses[1])}:horse_racing:\n**3.** ${"-".repeat(data.horses[2])}:horse_racing:`)
            return embed;
        }

        await interaction.editReply({ embeds: [createEmbed(data)] });

        // this is a recursive function. Please be careful if you want to edit this function.
        // If you don't know what your doing you might end up with a infinite loop.
        var updateStatus = async function (interaction, data) {
            return async function () {
                data.horses[bot.tools.randomNumber(0, 4)]--;
                data.horses[bot.tools.randomNumber(0, 4)]--;

                for (let i = 0; i < data.horses.length; i++) {
                    if (data.horses[i] <= 0) {
                        if (data.horses[i] < 0) data.horses[i] = 0;

                        if (i + 1 === horseNr) {
                            data.userWon = true;
                            data.stoppedGame = true;
                            break;
                        } else {
                            // no break because 2 horses could be winning at the same time
                            data.userWon = false;
                            data.stoppedGame = true;
                        }
                    }
                }

                // returning in this function also stops the command
                if (data.userWon && data.stoppedGame) {
                    await bot.tools.addMoney(interaction.member.id, parseInt(data.bet * 4));
                    data.color = Colors.Green;
                    data.status = `Your horse won!\n:money_with_wings: **Profit:** :coin: ${parseInt(data.bet * 3)}`;
                    return await interaction.editReply({ embeds: [createEmbed(data)] });
                } else if (!data.userWon && data.stoppedGame) {
                    await bot.tools.takeMoney(interaction.member.id, data.bet);
                    data.color = Colors.Red;
                    data.status = "You lost your money...";
                    return await interaction.editReply({ embeds: [createEmbed(data)] });
                }

                await interaction.editReply({ embeds: [createEmbed(data)] });
                setTimeout(await updateStatus(interaction, data), 1500);
            }
        }

        const wait = (func, timeToDelay) => new Promise((resolve) => setTimeout(func, timeToDelay));
        await wait(await updateStatus(interaction, data), 2000);
    }
}

module.exports = HorseRace;