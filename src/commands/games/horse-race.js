const Command = require('../../structures/Command.js');
const { EmbedBuilder, Colors, ApplicationCommandOptionType } = require('discord.js');

class HorseRace extends Command {
    info = {
        name: "horse-race",
        description: "Bet on the fastest horse to earn money.",
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
                name: 'horse',
                type: ApplicationCommandOptionType.Integer,
                description: 'The horse you want to bet on.',
                required: true,
                min_value: 1,
                max_value: 5
            }
        ],
        category: "games",
        extraFields: [],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 300,
        enabled: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const bet = interaction.options.getInteger('bet');
        const horseNr = interaction.options.getInteger('horse');

        if (bet > data.user.wallet) {
            await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            return await interaction.reply({ content: `You don't have :coin: ${bet} in your wallet.`, ephemeral: true });
        }

        // setup variable
        data.bet = bet;
        data.userWon = false;
        data.stoppedGame = false;
        data.horses = Array(5).fill(10);
        data.status = "Racing...";
        data.horseNr = horseNr;

        const createEmbed = (data) => {
            const embed = new EmbedBuilder()
                .setTitle(`Horse Race`)
                .setColor(data.color || bot.config.embed.color)
                .setDescription(`:moneybag: **Bet:** :coin: ${data.bet}\n:1234: **Your Horse:** \`${data.horseNr}\`\n:hourglass: **Status:** ${data.status}\n\n**1.** ${"-".repeat(data.horses[0])}:horse_racing:\n**2.** ${"-".repeat(data.horses[1])}:horse_racing:\n**3.** ${"-".repeat(data.horses[2])}:horse_racing:\n**4.** ${"-".repeat(data.horses[3])}:horse_racing:\n**5.** ${"-".repeat(data.horses[4])}:horse_racing:`)
            return embed;
        }

        await interaction.reply({ embeds: [createEmbed(data)] });

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
        await wait(await updateStatus(interaction, data), 1500);
    }
}

module.exports = HorseRace;