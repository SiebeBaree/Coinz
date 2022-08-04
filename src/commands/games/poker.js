const Command = require('../../structures/Command.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Colors, ApplicationCommandOptionType } = require('discord.js');
const { deck } = require('../../assets/deck.json');

class Poker extends Command {
    info = {
        name: "poker",
        description: "Play a game of video poker.",
        options: [
            {
                name: 'bet',
                type: ApplicationCommandOptionType.Integer,
                description: 'The bet you want to place.',
                required: true,
                min_value: 50
            }
        ],
        usage: "<bet>",
        category: "games",
        extraFields: [{ name: 'Multipliers', value: '[x100] Royal Flush\n[x50] Straight Flush\n[x25] Four of a Kind\n[x9] Full House\n[x6] Flush\n[x4] Straight\n[x3] Three of a Kind\n[x2] Two Pairs', inline: false }],
        image: "https://i.imgur.com/0FTZa3d.png",
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
        data.playerWon = false;
        data.multiplier = 1;
        data.hand = [];
        data.deck = deck;
        data.pickedCards = [];

        await interaction.deferReply();
        data = this.startGame(data);
        const interactionMessage = await interaction.editReply({ embeds: [this.createEmbed(data)], components: this.setButtons(data.hand, data.gameFinished), fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { time: 60000 });

        collector.on('collect', async (interactionCollector) => {
            await interactionCollector.deferUpdate();
            if (!data.gameFinished) {
                if (interactionCollector.customId === 'poker_continue') {
                    data = this.changeCards(data);
                    data.gameFinished = true;
                } else if (interactionCollector.customId.startsWith("poker")) {
                    data = this.pressButton(data, interactionCollector.customId);
                }

                if (data.gameFinished) data = await this.endGame(interaction, data);
                await interaction.editReply({ embeds: [this.createEmbed(data)], components: this.setButtons(data.hand, data.gameFinished) });
            }
        });

        collector.on('end', async (interactionCollector) => {
            if (!data.gameFinished) {
                data = this.changeCards(data);
                data.gameFinished = true;
                data = await this.endGame(interaction, data);
                await interaction.editReply({ embeds: [this.createEmbed(data)], components: this.setButtons(data.hand, true) });
            }
        });
    }

    createEmbed(data) {
        let color = bot.config.embed.color;
        if (data.playerWon && data.gameFinished) color = Colors.Green;
        else if (!data.playerWon && data.gameFinished) color = Colors.Red;

        const embed = new EmbedBuilder()
            .setTitle(`Poker`)
            .setColor(color)
            .setDescription(":lock: **Press the buttons below to hold cards.**\n:white_check_mark: **Press** `Continue` **to reshuffle all unlocked cards.**")
            .addFields({ name: 'Your Hand', value: `${this.getCards(data.hand)}`, inline: false })
        return embed;
    }

    setButtons(hand, isDisabled = false) {
        let cardRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("poker_1")
                .setLabel("Card 1")
                .setStyle(hand[0].locked ? ButtonStyle.Danger : ButtonStyle.Success)
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("poker_2")
                .setLabel("Card 2")
                .setStyle(hand[1].locked ? ButtonStyle.Danger : ButtonStyle.Success)
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("poker_3")
                .setLabel("Card 3")
                .setStyle(hand[2].locked ? ButtonStyle.Danger : ButtonStyle.Success)
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("poker_4")
                .setLabel("Card 4")
                .setStyle(hand[3].locked ? ButtonStyle.Danger : ButtonStyle.Success)
                .setDisabled(isDisabled),
            new ButtonBuilder()
                .setCustomId("poker_5")
                .setLabel("Card 5")
                .setStyle(hand[4].locked ? ButtonStyle.Danger : ButtonStyle.Success)
                .setDisabled(isDisabled)
        );

        let continueRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("poker_continue")
                .setLabel("Continue")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(isDisabled)
        );

        return [cardRow, continueRow];
    };

    getCards(cards) {
        let str = "";
        for (let i = 0; i < cards.length; i++) str += `<:${cards[i].name}:${cards[i].emoteId}> `;
        return str;
    }

    getPrice(bet, multiplier) {
        return parseInt(bet * (multiplier - 1)); // -1 because you already spend money on your bet
    }

    checkHand(data) {
        data.playerWon = true
        if (this.checkRoyalFlush(data.hand)) {
            data.multiplier = 100;
            data.handName = "Royal Flush";
        } else if (this.checkStraightFlush(data.hand)) {
            data.multiplier = 50;
            data.handName = "Straight Flush";
        } else if (this.checkFourOfAKind(data.hand)) {
            data.multiplier = 25;
            data.handName = "Four of a Kind";
        } else if (this.checkFullHouse(data.hand)) {
            data.multiplier = 9;
            data.handName = "Full House";
        } else if (this.checkFlush(data.hand)) {
            data.multiplier = 6;
            data.handName = "Flush";
        } else if (this.checkStraight(data.hand)) {
            data.multiplier = 4;
            data.handName = "Straight";
        } else if (this.checkThreeOfAKind(data.hand)) {
            data.multiplier = 3;
            data.handName = "Three of a Kind";
        } else if (this.checkTwoPairs(data.hand)) {
            data.multiplier = 2;
            data.handName = "Two Pairs";
        } else {
            data.playerWon = false;
        }
        return data;
    }

    checkSequential(hand) {
        let values = [];
        for (let i = 0; i < hand.length; i++) {
            values.push(hand[i].value);
        }
        values = values.sort(function (a, b) { return a - b });

        let previousValue = values[0];
        for (let i = 1; i < values.length; i++) {
            if (previousValue + 1 !== values[i]) return false;
            previousValue = values[i];
        }
        return true;
    }

    getDuplicates(hand) {
        let duplicates = [];
        for (let i = 0; i < hand.length; i++) {
            let changedValue = false;
            for (let j = 0; j < duplicates.length; j++) {
                if (duplicates[j].value === hand[i].value) {
                    duplicates[j].amount += 1;
                    changedValue = true;
                }
            }
            if (!changedValue) duplicates.push({ value: hand[i].value, amount: 1 });
        }
        return duplicates;
    }

    checkRoyalFlush(hand) {
        let suit = hand[0].name.charAt(hand[0].name.length - 1);
        let requiredValues = [10, 11, 12, 13, 14];

        for (let i = 0; i < hand.length; i++) {
            if (!requiredValues.includes(hand[i].value) || hand[i].name.charAt(hand[i].name.length - 1) !== suit) return false;
        }
        return true;
    }

    checkStraightFlush(hand) {
        if (!this.checkSequential(hand)) return false;
        let suit = hand[0].name.charAt(hand[0].name.length - 1);

        for (let i = 0; i < hand.length; i++) {
            if (hand[i].name.charAt(hand[i].name.length - 1) !== suit) return false;
        }
        return true;
    }

    checkFourOfAKind(hand) {
        let duplicates = this.getDuplicates(hand);

        for (let i = 0; i < duplicates.length; i++) {
            if (duplicates[i].amount === 4) return true;
        }
        return false;
    }

    checkFullHouse(hand) {
        let duplicates = this.getDuplicates(hand);
        let fullHouseCount = 0;

        for (let i = 0; i < duplicates.length; i++) {
            if (duplicates[i].amount === 3) fullHouseCount += 3;
            if (duplicates[i].amount === 2) fullHouseCount += 2;
        }
        return fullHouseCount === 5;
    }

    checkFlush(hand) {
        let suit = hand[0].name.charAt(hand[0].name.length - 1);

        for (let i = 0; i < hand.length; i++) {
            if (hand[i].name.charAt(hand[i].name.length - 1) !== suit) return false;
        }
        return true;
    }

    checkStraight(hand) {
        return this.checkSequential(hand);
    }

    checkThreeOfAKind(hand) {
        let duplicates = this.getDuplicates(hand);

        for (let i = 0; i < duplicates.length; i++) {
            if (duplicates[i].amount === 3) return true;
        }
        return false;
    }

    checkTwoPairs(hand) {
        let duplicates = this.getDuplicates(hand);
        let pairsCount = 0;

        for (let i = 0; i < duplicates.length; i++) {
            if (duplicates[i].amount === 2) pairsCount++;
        }
        return pairsCount === 2;
    }

    startGame(data) {
        for (let i = 0; i < 5; i++) {
            let card = data.deck[0];
            do {
                card = data.deck[bot.tools.randomNumber(0, data.deck.length - 1)];
            } while (data.pickedCards.includes(card));
            data.pickedCards.push(card);
            card.locked = false;
            data.hand.push(card);
        }
        return data;
    }

    changeCards(data) {
        for (let i = 0; i < data.hand.length; i++) {
            if (!data.hand[i].locked) {
                let card = data.deck[0];
                do {
                    card = data.deck[bot.tools.randomNumber(0, data.deck.length - 1)];
                } while (data.pickedCards.includes(card));
                data.pickedCards.push(card);
                data.hand[i] = card;
            }
        }
        return data;
    }

    pressButton(data, buttonName) {
        try {
            let buttonIndex = parseInt(buttonName.charAt(buttonName.length - 1));
            data.hand[buttonIndex - 1].locked = !data.hand[buttonIndex - 1].locked;
        } catch (e) {
            bot.logger.error(`Tried to convert buttonIndex to integer but failed. (File: src/commands/games/poker.js | buttonName: ${buttonName} )`);
        }
        return data;
    }

    async endGame(interaction, data) {
        data = this.checkHand(data);

        if (data.playerWon) {
            await bot.tools.addMoney(interaction.member.id, getPrice(data.bet, data.multiplier));
        } else {
            await bot.tools.takeMoney(interaction.member.id, data.bet);
        }

        await interaction.followUp({ content: data.playerWon ? `GG! You got a **${data.handName}** and won :coin: ${parseInt(data.bet * data.multiplier)}!` : `:sob: You got nothing and lost :coin: ${data.bet}.` });
        return data;
    }
}

module.exports = Poker;