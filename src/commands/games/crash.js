import Command from '../../structures/Command.js'
import {
    EmbedBuilder,
    ApplicationCommandOptionType,
    Colors,
    ActionRowBuilder,
    ButtonStyle,
    ButtonBuilder
} from 'discord.js'
import { checkBet, commandPassed } from '../../lib/helpers.js'
import { createMessageComponentCollector } from '../../lib/embed.js'
import { addMoney, addRandomExperience, takeMoney } from '../../lib/user.js'

export default class extends Command {
    info = {
        name: "crash",
        description: "Are you fast enough to sell before the market crashes?",
        options: [
            {
                name: 'bet',
                type: ApplicationCommandOptionType.String,
                description: 'The bet you want to place.',
                required: true,
                min_length: 2,
                max_length: 6
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
            bet = checkBet(betStr, data.user);

            if (!Number.isInteger(bet)) {
                await interaction.reply({ content: bet, ephemeral: true });
                return await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            }
        }
        await interaction.deferReply();

        // setup variable
        let userWon = false;
        let profit = bet;
        let multiplier = 0.8;
        let stoppedGame = false;

        const createEmbed = (multiplier, profit, color = undefined) => {
            const embed = new EmbedBuilder()
                .setTitle(`Crash`)
                .setColor(color || bot.config.embed.color)
                .setDescription("Every 2 seconds the multiplier goes up by 0.2x.\nEvery time this happens you have 20% chance to lose all money.\nTo claim the profits, press the sell button.")
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

        const interactionMessage = await interaction.editReply({ embeds: [createEmbed(multiplier, (profit * 0.8) - bet)], components: [setButton()], fetchReply: true });
        const collector = createMessageComponentCollector(interactionMessage, interaction, { time: 20000 })

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
                    await addRandomExperience(interaction.member.id);
                    await addMoney(interaction.member.id, Math.floor(profit * multiplier) - bet);
                    return await interaction.editReply({ embeds: [createEmbed(multiplier, Math.floor(profit * multiplier) - bet, Colors.Green)], components: [setButton(true)] });
                } else if (!userWon && stoppedGame) {
                    await takeMoney(interaction.member.id, bet);
                    return await interaction.editReply({ embeds: [createEmbed(multiplier, -bet, Colors.Red)], components: [setButton(true)] });
                }

                multiplier = Math.round((multiplier + 0.1) * 10) / 10;
                await interaction.editReply({ embeds: [createEmbed(multiplier, Math.floor(profit * multiplier) - bet)] });
                if (commandPassed(20)) {
                    userWon = false;
                    stoppedGame = true;
                }

                setTimeout(await updateStatus(interaction, multiplier, profit), 2000);
            }
        }

        const wait = (func, timeToDelay) => new Promise((resolve) => setTimeout(func, timeToDelay));
        await wait(await updateStatus(interaction, multiplier, profit), 2000);
    }
}