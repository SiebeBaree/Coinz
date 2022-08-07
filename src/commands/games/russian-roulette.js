const Command = require('../../structures/Command.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ApplicationCommandOptionType, Colors } = require('discord.js');

class RussianRoulette extends Command {
    info = {
        name: "russian-roulette",
        description: "Be lucky and don't die with russian roulette.",
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

        // initialize variables
        data.bet = bet;
        data.gameFinished = false;
        data.playerWon = null;
        data.gun = [false, false, false, false, false, true]; // if random generator fails always take last bullet
        data.gun[bot.tools.randomNumber(0, data.gun.length - 1)] = true; // put a bullet in a slot
        data.slot = 0; // the current slot of the gun
        data.multiplier = 0;

        const interactionMessage = await interaction.reply({ content: this.getContent(data), embeds: [this.createEmbed(data)], components: [this.setButtons(true)], fetchReply: true });
        data = this.calcBullets(data);
        await bot.tools.timeout(2000);
        await interaction.editReply({ content: this.getContent(data), embeds: [this.createEmbed(data)], components: [this.setButtons(data.gameFinished)] });
        if (data.gameFinished) return await this.endGame(interaction, data);

        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { max: 7, idle: 10000 });

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();

            if (!data.gameFinished) {
                if (interactionCollector.customId === 'rr_shoot') {
                    data.playerWon = null;
                    await interaction.editReply({ content: this.getContent(data), embeds: [this.createEmbed(data)], components: [this.setButtons(true)] });
                    data = this.calcBullets(data);
                    await bot.tools.timeout(2000);
                    await interaction.editReply({ content: this.getContent(data), embeds: [this.createEmbed(data)], components: [this.setButtons(data.gameFinished)] });
                } else if (interactionCollector.customId === 'rr_stop') {
                    data.gameFinished = true;
                    await interaction.editReply({ content: this.getContent(data), embeds: [this.createEmbed(data)], components: [this.setButtons(data.gameFinished)] });
                }

                await this.endGame(interaction, data);
            }
        });

        collector.on('end', async (interactionCollector) => {
            if (!data.gameFinished) {
                data.gameFinished = true;

                await this.endGame(interaction, data);
                await interaction.editReply({ content: this.getContent(data), embeds: [this.createEmbed(data)], components: [this.setButtons(data.gameFinished)] });
            }
        });
    }

    createEmbed(data) {
        let color = bot.config.embed.color;
        if (data.playerWon === true) color = Colors.Green;
        else if (data.playerWon === false) color = Colors.Red;

        const embed = new EmbedBuilder()
            .setTitle(`Russian Roulette`)
            .setColor(color)
            .setDescription("You have a 1/6 chance of shooting the gun with a bullet in the chamber.\n\n:boom: `Shoot` ― **shoot the gun.**\n:no_entry: `Stop` ― **end the game.**")
            .addFields(
                { name: 'Bet Mulitplier', value: `${data.multiplier}x`, inline: true },
                { name: 'Profit', value: `:coin: ${parseInt(data.multiplier * data.bet)}`, inline: true }
            )
        return embed;
    }

    setButtons(isDisabled = false) {
        let row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("rr_shoot")
                .setLabel("Shoot")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("rr_stop")
                .setLabel("Stop")
                .setStyle(ButtonStyle.Success)
                .setDisabled(isDisabled)
        );
        return row;
    };

    calcBullets(data) {
        if (data.gun[data.slot]) {
            data.playerWon = false;
            data.gameFinished = true;
        } else {
            data.multiplier += 0.5
            data.playerWon = true;
        }

        if (data.slot >= 5) data.gameFinished = true;
        else data.slot++;
        return data;
    }

    getContent(data) {
        if (data.playerWon === null) return ":hourglass_flowing_sand: **Shooting the gun...**";
        if (data.gameFinished && data.playerWon) return ":money_with_wings: **GG! You did not die this game!**";
        return data.playerWon ? ":tada: **You lived! Your multiplier has increased.**" : ":skull: **You died... You lost your bet.**";
    }

    async endGame(interaction, data) {
        if (data.gameFinished) {
            if (data.playerWon) {
                await bot.tools.addMoney(interaction.member.id, parseInt(data.bet * data.multiplier));
            } else {
                await bot.tools.takeMoney(interaction.member.id, data.bet);
            }
        }
    }
}

module.exports = RussianRoulette;