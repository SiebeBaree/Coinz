import Command from '../../structures/Command.js'
import {
    EmbedBuilder,
    ApplicationCommandOptionType,
    Colors,
    ActionRowBuilder,
    ButtonStyle,
    ButtonBuilder
} from 'discord.js'
import { checkBet, randomNumber } from '../../lib/helpers.js'
import { createMessageComponentCollector } from '../../lib/embed.js'
import { addMoney, addRandomExperience, takeMoney } from '../../lib/user.js'

export default class extends Command {
    info = {
        name: "rock-paper-scissors",
        description: "Play rock paper scissors againt the bot",
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

    hand = {
        "Rock": {
            name: "Rock",
            emote: ":rock:",
            weakness: "Paper"
        },
        "Paper": {
            name: "Paper",
            emote: ":page_facing_up:",
            weakness: "Scissors"
        },
        "Scissors": {
            name: "Scissors",
            emote: ":scissors:",
            weakness: "Rock"
        }
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const betStr = interaction.options.getString('bet');
        let bet = 50;

        if (["all", "max"].includes(betStr.toLowerCase())) {
            if (data.user.wallet <= 0) return await interaction.reply({ content: `You don't have any money in your wallet.`, ephemeral: true });

            if (data.premium.isPremium) {
                bet = data.user.wallet > 10000 ? 10000 : data.user.wallet;
            } else {
                bet = data.user.wallet > 5000 ? 5000 : data.user.wallet;
            }
        } else {
            bet = checkBet(betStr, data.user, data.premium.isPremium);

            if (!Number.isInteger(bet)) {
                await interaction.reply({ content: bet, ephemeral: true });
                return await bot.cooldown.removeCooldown(interaction.member.id, this.info.name);
            }
        }
        await interaction.deferReply();

        // initialize variables
        data.bet = bet;
        data.gameFinished = false;
        data.playerWon = 0;
        data.multiplier = 0;
        data.playerHand = null;
        data.botHand = null;

        const interactionMessage = await interaction.editReply({ embeds: [this.createEmbed(data)], components: [this.setButtons(false, true)], fetchReply: true });
        const collector = createMessageComponentCollector(interactionMessage, interaction, { idle: 15000, max: 30000 });

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();

            if (!data.gameFinished) {
                if (interactionCollector.customId === 'rps_stop') {
                    data.gameFinished = true;
                    data.desc = `You stopped the game. You won :coin: ${parseInt(data.bet * data.multiplier - data.bet)}`;
                } else if (interactionCollector.customId.startsWith('rps_')) {
                    data.playerHand = interactionCollector.customId.replace('rps_', '');
                    data.botHand = this.getHand();

                    data.playerWon = this.playerWon(data.playerHand, data.botHand);
                    if (data.playerWon == 1) {
                        data.desc = "**You won against the bot!**\n\nPress `STOP` to stop the game and collect your profit.";
                        data.multiplier++;
                    } else if (data.playerWon === 2) {
                        data.desc = "**Tie!**\n\nPress `STOP` to stop the game and collect your profit.";
                    }
                }

                if (!data.gameFinished) data.gameFinished = (data.playerWon === 0) ? true : false;

                if (data.gameFinished) {
                    if (data.playerWon === 0) {
                        data.desc = "**You lost!** Better luck next time!";
                        await takeMoney(interaction.member.id, data.bet);
                    } else {
                        await addRandomExperience(interaction.member.id);
                        await addMoney(interaction.member.id, parseInt(data.bet * data.multiplier - data.bet));
                    }
                }

                await interaction.editReply({ embeds: [this.createEmbed(data)], components: [this.setButtons(data.gameFinished)] });
            }
        });

        collector.on('end', async (interactionCollector) => {
            if (!data.gameFinished) {
                data.gameFinished = true;

                if (data.playerWon === 0) {
                    await takeMoney(interaction.member.id, data.bet);
                } else {
                    await addMoney(interaction.member.id, parseInt(data.bet * data.multiplier - data.bet));
                }

                await interaction.editReply({ embeds: [this.createEmbed(data)], components: [this.setButtons(true)] });
            }
        });
    }

    createEmbed(data) {
        const embed = new EmbedBuilder()
            .setTitle(`Rock Paper Scissors`)
            .setColor(data.playerWon === 1 ? Colors.Green : data.playerWon === 0 ? Colors.Red : bot.config.embed.color)
            .setDescription(data.desc === undefined ? "Please select one of the buttons below." : data.desc)
            .addFields(
                { name: 'Your Hand', value: `${data.playerHand || "Not Yet Chosen"}`, inline: true },
                { name: 'Bot\'s Hand', value: `${data.botHand || "Not Yet Chosen"}`, inline: true },
                { name: 'Multiplier', value: `${data.playerWon === false ? 0 : data.multiplier}x`, inline: true },
                { name: 'Profit', value: `:coin: ${parseInt(data.bet * (data.playerWon === 0 ? 1 : data.multiplier)) - data.bet}`, inline: true }
            )
        return embed;
    }

    setButtons(isDisabled = false, disableStop = false) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("rps_Rock")
                .setLabel("Rock")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("rps_Paper")
                .setLabel("Paper")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("rps_Scissors")
                .setLabel("Scissors")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("rps_stop")
                .setLabel("Stop")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(isDisabled || disableStop)
        );
        return row;
    };

    getHand() {
        return ["Rock", "Paper", "Scissors"][randomNumber(0, 2)];
    }

    playerWon(playerHand, botHand) {
        if (playerHand === botHand) return 2;
        return this.hand[playerHand].weakness === botHand ? 0 : 1;
    }
}