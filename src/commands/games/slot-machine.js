const Command = require('../../structures/Command.js');
const { EmbedBuilder, Colors, ApplicationCommandOptionType } = require('discord.js');

class SlotMachine extends Command {
    info = {
        name: "slot-machine",
        description: "Try your luck on the slot machines.",
        options: [
            {
                name: 'bet',
                type: ApplicationCommandOptionType.Integer,
                description: 'The bet you want to place.',
                required: true,
                min_value: 50
            }
        ],
        category: "games",
        extraFields: [
            { name: 'Multipliers', value: '[1x] :100:\n[2.5x] :moneybag:\n[3x] :dollar:\n[4x] :gem:\n[6x] :first_place:', inline: false }
        ],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 300,
        enabled: true
    };

    spinningEmote = "<a:spinning_slots:949712124165365810>";

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
        data.bet = bet;
        data.userWon = true;
        data.slot = [Array(3).fill(this.spinningEmote), Array(3).fill(this.spinningEmote), Array(3).fill(this.spinningEmote)];
        data.index = 0;
        data.status = "Spinning...";
        data.emotes = {
            ":100:": 1,
            ":moneybag:": 2.5,
            ":dollar:": 3,
            ":gem:": 4,
            ":first_place:": 6
        };
        data.keys = Object.keys(data.emotes);

        const createEmbed = (data) => {
            const embed = new EmbedBuilder()
                .setTitle(`Slot Machine`)
                .setColor(data.color || bot.config.embed.color)
                .setDescription(`:moneybag: **Bet:** :coin: ${data.bet}\n:hourglass: **Status:** ${data.status}\n\n${getSlots(data.slot)}`)
            return embed;
        }

        const getSlots = (slot) => {
            let slotStr = "";

            for (let i = 0; i < slot.length; i++) {
                for (let j = 0; j < slot[i].length; j++) {
                    slotStr += `${slot[i][j]}${j < slot[i].length - 1 ? " | " : ""}${(j === slot[i].length - 1 && i === Math.floor(slot.length / 2)) ? " :arrow_left:" : ""}`;
                }
                slotStr += "\n";
            }

            return slotStr;
        }

        await interaction.reply({ embeds: [createEmbed(data)] });

        // this is a recursive function. Please be careful if you want to edit this function.
        // If you don't know what your doing you might end up with a infinite loop.
        var updateStatus = async function (interaction, data) {
            return async function () {
                for (let i = 0; i < data.slot[0].length; i++) {
                    data.slot[i][data.index] = data.keys[bot.tools.randomNumber(0, data.keys.length - 1)];
                }

                data.index++;
                if (data.index < data.slot.length) {
                    await interaction.editReply({ embeds: [createEmbed(data)] });
                    setTimeout(await updateStatus(interaction, data), 2000);
                } else {
                    let referenceEmote = data.slot[1][0];
                    for (let i = 1; i < data.slot[1].length; i++) {
                        if (data.slot[1][i] !== referenceEmote) {
                            data.userWon = false;
                        }
                    }

                    if (data.userWon) {
                        let betMultiplier = data.emotes[referenceEmote];
                        data.status = `You won :coin: ${Math.round(data.bet * betMultiplier)}.`;
                        data.color = Colors.Green;
                        await bot.tools.addMoney(interaction.member.id, Math.round(data.bet * betMultiplier));
                    } else {
                        data.status = `You lost :coin: ${data.bet}.`;
                        data.color = Colors.Red;
                        await bot.tools.takeMoney(interaction.member.id, data.bet);
                    }
                    return await interaction.editReply({ embeds: [createEmbed(data)] });
                }
            }
        }

        const wait = (func, timeToDelay) => new Promise((resolve) => setTimeout(func, timeToDelay));
        await wait(await updateStatus(interaction, data), 2000);
    }
}

module.exports = SlotMachine;