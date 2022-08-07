const Command = require('../../structures/Command.js');
const { Colors, ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class Crash extends Command {
    info = {
        name: "crash",
        description: "Are you fast enough to sell before the market crashes?",
        options: [
            {
                name: 'bet',
                type: ApplicationCommandOptionType.Integer,
                description: 'The bet you want to place.',
                required: true,
                min_value: 50,
                max_value: 5000
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

        if (bet > data.user.wallet) {
            await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            return await interaction.reply({ content: `You don't have :coin: ${bet} in your wallet.`, ephemeral: true });
        }

        // setup variable
        let userWon = false;
        let profit = -parseInt(bet * 0.2);
        let multiplier = 0.8;
        let stoppedGame = false;

        const createEmbed = (multiplier, profit, color = undefined) => {
            const embed = new EmbedBuilder()
                .setTitle(`Crash`)
                .setColor(color || bot.config.embed.color)
                .setDescription("Every 1.5 seconds the multiplier goes up by 0.1x.\nEvery time this happens you have 20% chance to lose all money.\nTo claim the profits, press the sell button.")
                .addFields(
                    { name: 'Multiplier', value: `${Math.round(multiplier * 10) / 10}x`, inline: true },
                    { name: 'Profit', value: `:coin: ${profit}`, inline: true }
                )
            return embed;
        }

        const setButton = (buttonIsDisabled = false) => {
            let row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("crash_stop")
                    .setLabel("Sell")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(buttonIsDisabled),
            );
            return row;
        };

        const interactionMessage = await interaction.reply({ embeds: [createEmbed(multiplier, profit - bet)], components: [setButton()], fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { time: 20000 })

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();
            userWon = true;
            stoppedGame = true;
        });

        collector.on('end', async (interactionCollector) => {
            if (!stoppedGame) {
                await interaction.editReply({ components: [setButton(true)] });
                stoppedGame = true; // stop the game but keep the current userWon variable
            }
        });

        // this is a recursive function. Please be careful if you want to edit this function.
        // If you don't know what your doing you might end up with a infinite loop
        var updateStatus = async function (interaction, multiplier, profit) {
            return async function () {
                // returning in this function also stops the command
                if (userWon && stoppedGame) {
                    await bot.tools.addMoney(interaction.member.id, Math.floor(profit * multiplier) - bet);
                    return await interaction.editReply({ embeds: [createEmbed(multiplier, Math.floor(profit * multiplier) - bet, Colors.Green)], components: [setButton(true)] });
                } else if (!userWon && stoppedGame) {
                    await bot.tools.takeMoney(interaction.member.id, bet);
                    return await interaction.editReply({ embeds: [createEmbed(multiplier, -bet, Colors.Red)], components: [setButton(true)] });
                }

                multiplier = Math.round((multiplier + 0.1) * 10) / 10;
                await interaction.editReply({ embeds: [createEmbed(multiplier, Math.floor(profit * multiplier) - bet)] });
                if (bot.tools.commandPassed(20)) {
                    userWon = false;
                    stoppedGame = true;
                }

                setTimeout(await updateStatus(interaction, multiplier, profit), 1500);
            }
        }

        const wait = (func, timeToDelay) => new Promise((resolve) => setTimeout(func, timeToDelay));
        await wait(await updateStatus(interaction, multiplier, profit), 1500);
    }
}

module.exports = Crash;