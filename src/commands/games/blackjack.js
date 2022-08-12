const Command = require('../../structures/Command.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Colors, ApplicationCommandOptionType } = require('discord.js');
const { deck, hiddenCard } = require('../../assets/deck.json');

class Blackjack extends Command {
    info = {
        name: "blackjack",
        description: "Play a game of blackjack.",
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
        cooldown: 300,
        enabled: true,
        memberRequired: true,
        deferReply: false
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
        await interaction.deferReply();
        let disableDoubleDown = data.user.wallet < bet * 2;

        // initialize variables
        data.bet = bet;
        data.gameFinished = false;
        data.playerWon = false;
        data.playerHand = [];
        data.dealerHand = [];

        data = this.startGame(data);
        const interactionMessage = await interaction.editReply({ embeds: [this.createEmbed(data)], components: [this.setButtons(data.gameFinished, disableDoubleDown)], fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { max: 6, idle: 15000 });

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();
            if (!data.gameFinished) {
                if (interactionCollector.customId === 'bj_hit') {
                    data = await this.runHit(data);
                    disableDoubleDown = true;
                } else if (interactionCollector.customId === 'bj_stand') {
                    data = await this.runStand(data);
                } else if (interactionCollector.customId === 'bj_doubleDown' && !disableDoubleDown) {
                    data.bet *= 2;
                    data = await this.runHit(data);
                    data = await this.runStand(data);
                }

                data = this.checkGameStatus(data);
                if (data.gameFinished) {
                    data = this.getDealerCards(data);
                    data = this.checkGameStatus(data);

                    if (data.tie === undefined) {
                        if (data.playerWon) {
                            await bot.tools.addMoney(interaction.member.id, parseInt(this.getPrice(data.bet) - data.bet));
                        } else {
                            await bot.tools.takeMoney(interaction.member.id, data.bet);
                        }
                    }
                }
                await interaction.editReply({ embeds: [this.createEmbed(data)], components: [this.setButtons(data.gameFinished, disableDoubleDown)] });
            }
        });

        collector.on('end', async (interactionCollector) => {
            if (!data.gameFinished) {
                data.gameFinished = true;
                data.desc = `You lost :coin: ${data.bet}`;
                data.color = Colors.Red;
                await bot.tools.takeMoney(interaction.member.id, data.bet);
                await interaction.editReply({ embeds: [this.createEmbed(data)], components: [this.setButtons(true)] });
            }
        });
    }

    createEmbed(data) {
        let desc = ":boom: `Hit` ― **take another card.**\n:no_entry: `Stand` ― **end the game.**\n:money_with_wings: `Double Down` ― **double your bet, hit once, then stand.**";
        if (data.description != undefined) desc = `Result: ${data.description}`;

        const embed = new EmbedBuilder()
            .setTitle(`Blackjack`)
            .setColor(data.color || bot.config.embed.color)
            .setDescription(desc)
            .addFields(
                { name: 'Your Hand', value: `${this.getCards(data.playerHand)}\n\n**Value:** ${this.getValue(data.playerHand)}`, inline: true },
                { name: 'Dealer\'s Hand', value: `${this.getCards(data.dealerHand)}\n\n**Value:** ${this.getValue(data.dealerHand)}`, inline: true }
            )
        return embed;
    }

    setButtons(isDisabled, doubleDownDisabled = true) {
        let row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("bj_hit")
                .setLabel("Hit")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("bj_stand")
                .setLabel("Stand")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("bj_doubleDown")
                .setLabel("Double Down")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(isDisabled || doubleDownDisabled)
        );
        return row;
    };

    getCards(cards) {
        let str = "";
        for (let i = 0; i < cards.length; i++) str += `<:${cards[i].name}:${cards[i].emoteId}> `;
        if (cards.length <= 1) str += `<:${hiddenCard.name}:${hiddenCard.emoteId}>`;
        return str;
    }

    getValue(cards) {
        let value = 0;
        for (let i = 0; i < cards.length; i++) {
            let newValue = cards[i].value;

            if (newValue === 14) {
                newValue = 11;
            } else if (newValue > 10) {
                newValue = 10;
            }

            value += newValue;
        }
        return value;
    }

    getRandomCard() {
        return deck[bot.tools.randomNumber(0, deck.length - 1)];
    }

    getPrice(bet) {
        return parseInt(bet * 1.5);
    }

    checkAces(deck) {
        for (let i = 0; i < deck.length; i++) {
            if (deck[i].value === 14) {
                deck[i].value = 1;
                return deck;
            }
        }
        return false;
    }

    checkGameStatus(data) {
        const valuePlayer = this.getValue(data.playerHand);
        const valueDealer = this.getValue(data.dealerHand);
        data.playerWon = false;

        if (valuePlayer > 21) {
            // Check for Aces and set ace value to 1
            let changedDeck = false;
            do {
                changedDeck = false;
                changedDeck = this.checkAces(data.playerHand);
                if (changedDeck) data.playerHand = changedDeck;
            } while (changedDeck);

            if (this.getValue(data.playerHand) > 21) {
                data.gameFinished = true;
                data.description = `You bust! You lost :coin: ${data.bet}`;
                data.color = Colors.Red;
            }
        } else if (valueDealer > 21) {
            data.gameFinished = true;
            data.playerWon = true;
            data.description = `Dealer bust! You won :coin: ${this.getPrice(data.bet)}`;
            data.color = Colors.Green;
        } else if (valuePlayer === 21 && valueDealer === 21) {
            data.gameFinished = true;
            data.tie = true;
            data.description = `Blackjack Tie! You got your :coin: ${data.bet} back.`;
        } else if (valuePlayer === 21) {
            data.gameFinished = true;
            data.playerWon = true;
            data.description = `Blackjack! You won :coin: ${this.getPrice(data.bet)}`;
            data.color = Colors.Green;
        } else if (valueDealer === 21) {
            data.gameFinished = true;
            data.description = `You lost :coin: ${data.bet}`;
            data.color = Colors.Red;
        } else if (valuePlayer === valueDealer && data.gameFinished) {
            data.description = `Tie! You lost :coin: ${data.bet}`;
            data.color = Colors.Red;
        } else if (valuePlayer > valueDealer && data.gameFinished) {
            data.playerWon = true;
            data.description = `You won :coin: ${this.getPrice(data.bet)}`;
            data.color = Colors.Green;
        } else if (valuePlayer < valueDealer && data.gameFinished) {
            data.description = `You lost :coin: ${data.bet}`;
            data.color = Colors.Red;
        }

        return data;
    }

    getDealerCards(data) {
        do {
            data.dealerHand.push(this.getRandomCard());

            if (this.getValue(data.dealerHand) > 21) {
                let changedDeck = false;
                do {
                    changedDeck = false;
                    changedDeck = this.checkAces(data.dealerHand);
                    if (changedDeck) data.dealerHand = changedDeck;
                } while (changedDeck);
            }
        } while (this.getValue(data.dealerHand) <= 16);

        data = this.checkGameStatus(data);
        return data;
    }

    startGame(data) {
        data.playerHand.push(this.getRandomCard());
        data.playerHand.push(this.getRandomCard());
        data.dealerHand.push(this.getRandomCard());
        data = this.checkGameStatus(data);
        return data;
    }

    async runHit(data) {
        if (data.playerHand.length >= 5) data.gameFinished = true;
        data.playerHand.push(this.getRandomCard());
        return data;
    }

    async runStand(data) {
        data.gameFinished = true;
        return data;
    }
}

module.exports = Blackjack;