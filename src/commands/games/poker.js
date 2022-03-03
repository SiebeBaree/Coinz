const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { deck } = require('../../data/games/deck.json');

function createEmbed(client, data) {
    let color = client.config.embed.color;
    if (data.playerWon && data.gameFinished) color = "GREEN";
    else if (!data.playerWon && data.gameFinished) color = "RED";

    const embed = new MessageEmbed()
        .setTitle(`Poker`)
        .setColor(color)
        .setDescription(":lock: **Press the buttons below to hold cards.**\n:white_check_mark: **Press** `Continue` **to reshuffle all unlocked cards.**")
        .addField('Your Hand', `${getCards(data.hand)}`, false)
    return embed;
}

function setButtons(hand, isDisabled = false) {
    let cardRow = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("poker_1")
            .setLabel("Card 1")
            .setStyle(hand[0].locked ? "DANGER" : "SUCCESS")
            .setDisabled(isDisabled),
        new MessageButton()
            .setCustomId("poker_2")
            .setLabel("Card 2")
            .setStyle(hand[1].locked ? "DANGER" : "SUCCESS")
            .setDisabled(isDisabled),
        new MessageButton()
            .setCustomId("poker_3")
            .setLabel("Card 3")
            .setStyle(hand[2].locked ? "DANGER" : "SUCCESS")
            .setDisabled(isDisabled),
        new MessageButton()
            .setCustomId("poker_4")
            .setLabel("Card 4")
            .setStyle(hand[3].locked ? "DANGER" : "SUCCESS")
            .setDisabled(isDisabled),
        new MessageButton()
            .setCustomId("poker_5")
            .setLabel("Card 5")
            .setStyle(hand[4].locked ? "DANGER" : "SUCCESS")
            .setDisabled(isDisabled)
    );

    let continueRow = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("poker_continue")
            .setLabel("Continue")
            .setStyle("PRIMARY")
            .setDisabled(isDisabled)
    );

    return [cardRow, continueRow];
};

function getCards(cards) {
    let str = "";
    for (let i = 0; i < cards.length; i++) str += `<:${cards[i].name}:${cards[i].emoteId}> `;
    return str;
}

function getPrice(bet, multiplier) {
    return parseInt(bet * (multiplier - 1)); // -1 because you already spend money on your bet
}

function checkHand(data) {
    data.playerWon = true
    if (checkRoyalFlush(data.hand)) {
        data.multiplier = 100;
        data.handName = "Royal Flush";
    } else if (checkStraightFlush(data.hand)) {
        data.multiplier = 50;
        data.handName = "Straight Flush";
    } else if (checkFourOfAKind(data.hand)) {
        data.multiplier = 25;
        data.handName = "Four of a Kind";
    } else if (checkFullHouse(data.hand)) {
        data.multiplier = 9;
        data.handName = "Full House";
    } else if (checkFlush(data.hand)) {
        data.multiplier = 6;
        data.handName = "Flush";
    } else if (checkStraight(data.hand)) {
        data.multiplier = 4;
        data.handName = "Straight";
    } else if (checkThreeOfAKind(data.hand)) {
        data.multiplier = 3;
        data.handName = "Three of a Kind";
    } else if (checkTwoPairs(data.hand)) {
        data.multiplier = 2;
        data.handName = "Two Pairs";
    } else {
        data.playerWon = false;
    }
    return data;
}

function checkSequential(hand) {
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

function getDuplicates(hand) {
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

function checkRoyalFlush(hand) {
    let suit = hand[0].name.charAt(hand[0].name.length - 1);
    let requiredValues = [10, 11, 12, 13, 14];

    for (let i = 0; i < hand.length; i++) {
        if (!requiredValues.includes(hand[i].value) || hand[i].name.charAt(hand[i].name.length - 1) !== suit) return false;
    }
    return true;
}

function checkStraightFlush(hand) {
    if (!checkSequential(hand)) return false;
    let suit = hand[0].name.charAt(hand[0].name.length - 1);
    console.log(suit)

    for (let i = 0; i < hand.length; i++) {
        if (hand[i].name.charAt(hand[i].name.length - 1) !== suit) return false;
    }
    return true;
}

function checkFourOfAKind(hand) {
    let duplicates = getDuplicates(hand);

    for (let i = 0; i < duplicates.length; i++) {
        if (duplicates[i].amount === 4) return true;
    }
    return false;
}

function checkFullHouse(hand) {
    let duplicates = getDuplicates(hand);
    let fullHouseCount = 0;

    for (let i = 0; i < duplicates.length; i++) {
        if (duplicates[i].amount === 3) fullHouseCount += 3;
        if (duplicates[i].amount === 2) fullHouseCount += 2;
    }
    return fullHouseCount === 5;
}

function checkFlush(hand) {
    let suit = hand[0].name.charAt(hand[0].name.length - 1);

    for (let i = 0; i < hand.length; i++) {
        if (hand[i].name.charAt(hand[i].name.length - 1) !== suit) return false;
    }
    return true;
}

function checkStraight(hand) {
    return checkSequential(hand);
}

function checkThreeOfAKind(hand) {
    let duplicates = getDuplicates(hand);

    for (let i = 0; i < duplicates.length; i++) {
        if (duplicates[i].amount === 3) return true;
    }
    return false;
}

function checkTwoPairs(hand) {
    let duplicates = getDuplicates(hand);
    let pairsCount = 0;

    for (let i = 0; i < duplicates.length; i++) {
        if (duplicates[i].amount === 2) pairsCount++;
    }
    return pairsCount === 2;
}

function startGame(client, data) {
    for (let i = 0; i < 5; i++) {
        let card = data.deck[0];
        do {
            card = data.deck[client.tools.randomNumber(0, data.deck.length - 1)];
        } while (data.pickedCards.includes(card));
        data.pickedCards.push(card);
        card.locked = false;
        data.hand.push(card);
    }
    return data;
}

function changeCards(client, data) {
    for (let i = 0; i < data.hand.length; i++) {
        if (!data.hand[i].locked) {
            let card = data.deck[0];
            do {
                card = data.deck[client.tools.randomNumber(0, data.deck.length - 1)];
            } while (data.pickedCards.includes(card));
            data.pickedCards.push(card);
            data.hand[i] = card;
        }
    }
    return data;
}

function pressButton(client, data, buttonName) {
    try {
        let buttonIndex = parseInt(buttonName.charAt(buttonName.length - 1));
        data.hand[buttonIndex - 1].locked = !data.hand[buttonIndex - 1].locked;
    } catch (e) {
        client.logger.error(`Tried to convert buttonIndex to integer but failed. (File: src/commands/games/poker.js | buttonName: ${buttonName} )`);
    }
    return data;
}

async function endGame(client, interaction, data) {
    data = checkHand(data);

    if (data.playerWon) {
        await client.tools.addMoney(interaction.guildId, interaction.member.id, getPrice(data.bet, data.multiplier));
    } else {
        await client.tools.removeMoney(interaction.guildId, interaction.member.id, data.bet);
    }

    await interaction.followUp({ content: data.playerWon ? `GG! You got a **${data.handName}** and won :coin: ${parseInt(data.bet * data.multiplier)}!` : `:sob: You got nothing and lost :coin: ${data.bet}.` });
    return data;
}

module.exports.execute = async (client, interaction, data) => {
    const bet = interaction.options.getInteger('bet');
    if (bet > data.guildUser.wallet) {
        await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, data.cmd.help.name);
        return interaction.reply({ content: `You don't have :coin: ${bet} in your wallet.`, ephemeral: true });
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
    data = startGame(client, data);
    await interaction.editReply({ embeds: [createEmbed(client, data)], components: setButtons(data.hand, data.gameFinished) });
    const interactionMessage = await interaction.fetchReply();

    const filter = async (i) => {
        if (i.member.id === interaction.member.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (interactionCollector) => {
        await interactionCollector.deferUpdate();
        if (!data.gameFinished) {
            if (interactionCollector.customId === 'poker_continue') {
                data = changeCards(client, data);
                data.gameFinished = true;
            } else if (interactionCollector.customId.startsWith("poker")) {
                data = pressButton(client, data, interactionCollector.customId);
            }

            if (data.gameFinished) data = await endGame(client, interaction, data);
            await interaction.editReply({ embeds: [createEmbed(client, data)], components: setButtons(data.hand, data.gameFinished) });
        }
    })

    collector.on('end', async (interactionCollector) => {
        if (!data.gameFinished) {
            data = changeCards(client, data);
            data.gameFinished = true;
            data = await endGame(client, interaction, data);
            await interaction.editReply({ embeds: [createEmbed(client, data)], components: setButtons(data.hand, true) });
        }
    })
}

module.exports.help = {
    name: "poker",
    description: "Play a game of video poker.",
    options: [
        {
            name: 'bet',
            type: 'INTEGER',
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
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    ownerOnly: false,
    cooldown: 900,
    enabled: true
}