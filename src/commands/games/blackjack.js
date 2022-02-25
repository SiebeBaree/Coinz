const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const { deck, hiddenCard } = require('../../data/games/deck.json');

function createEmbed(client, data) {
    let desc = ":boom: `Hit` ― **take another card.**\n:no_entry: `Stand` ― **end the game.**\n:money_with_wings: `Double Down` ― **double your bet, hit once, then stand.**";
    if (data.description != undefined) desc = `Result: ${data.description}`;

    const embed = new MessageEmbed()
        .setTitle(`Blackjack`)
        .setColor(data.color || client.config.embed.color)
        .setDescription(desc)
        .addFields(
            { name: 'Your Hand', value: `${getCards(data.playerHand)}\n\n**Value:** ${getValue(data.playerHand)}`, inline: true },
            { name: 'Dealer\'s Hand', value: `${getCards(data.dealerHand)}\n\n**Value:** ${getValue(data.dealerHand)}`, inline: true }
        )
    return embed;
}

function setButtons(isDisabled, doubleDownDisabled = true) {
    let row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId("bj_hit")
            .setLabel("Hit")
            .setStyle("SECONDARY")
            .setDisabled(isDisabled),
        new MessageButton()
            .setCustomId("bj_stand")
            .setLabel("Stand")
            .setStyle("SECONDARY")
            .setDisabled(isDisabled),
        new MessageButton()
            .setCustomId("bj_doubleDown")
            .setLabel("Double Down")
            .setStyle("SECONDARY")
            .setDisabled(isDisabled || doubleDownDisabled)
    );
    return row;
};

function getCards(cards) {
    let str = "";
    for (let i = 0; i < cards.length; i++) str += `<:${cards[i].name}:${cards[i].emoteId}> `;
    if (cards.length <= 1) str += `<:${hiddenCard.name}:${hiddenCard.emoteId}>`;
    return str;
}

function getValue(cards) {
    let value = 0;
    for (let i = 0; i < cards.length; i++) value += cards[i].value;
    return value;
}

function getRandomCard(client) {
    return deck[client.tools.randomNumber(0, deck.length - 1)];
}

function getPrice(bet) {
    return parseInt(bet * 1.5);
}

function checkAces(deck) {
    for (let i = 0; i < deck.length; i++) {
        if (deck[i].value === 11) {
            deck[i].value = 1;
            return deck;
        }
    }
    return false;
}

function checkGameStatus(data) {
    const valuePlayer = getValue(data.playerHand);
    const valueDealer = getValue(data.dealerHand);

    if (valuePlayer > 21) {
        // Check for Aces and set ace value to 1
        let changedDeck = false;
        do {
            changedDeck = false;
            changedDeck = checkAces(data.playerHand);
            if (changedDeck) data.playerHand = changedDeck;
        } while (changedDeck);

        if (getValue(data.playerHand) > 21) {
            data.gameFinished = true;
            data.description = `You bust! You lost :coin: ${data.bet}`;
            data.color = "RED";
        }
    } else if (valueDealer > 21) {
        // Check for Aces and set ace value to 1
        let changedDeck = false;
        do {
            changedDeck = false;
            changedDeck = checkAces(data.dealerHand);
            if (changedDeck) data.dealerHand = changedDeck;
        } while (changedDeck);

        if (getValue(data.dealerHand) > 21) {
            data.gameFinished = true;
            data.playerWon = true;
            data.description = `Dealer bust! You won :coin: ${getPrice(data.bet)}`;
            data.color = "GREEN";
        }
    } else if (valuePlayer === 21 && valueDealer === 21) {
        data.gameFinished = true;
        data.tie = true;
        data.description = `Blackjack Tie! You got your :coin: ${data.bet} back.`;
    } else if (valuePlayer === 21) {
        data.gameFinished = true;
        data.playerWon = true;
        data.description = `Blackjack! You won :coin: ${getPrice(data.bet)}`;
        data.color = "GREEN";
    } else if (valueDealer === 21) {
        data.gameFinished = true;
        data.description = `You lost :coin: ${data.bet}`;
        data.color = "RED";
    } else if (valuePlayer === valueDealer && data.gameFinished) {
        data.description = `Tie! You lost :coin: ${data.bet}`;
        data.color = "RED";
    } else if (valuePlayer > valueDealer && data.gameFinished) {
        data.playerWon = true;
        data.description = `You won :coin: ${getPrice(data.bet)}`;
        data.color = "GREEN";
    } else if (valuePlayer < valueDealer && data.gameFinished) {
        data.description = `You lost :coin: ${data.bet}`;
        data.color = "RED";
    }

    return data;
}

function getDealerCards(client, data) {
    do {
        data.dealerHand.push(getRandomCard(client));
    } while (getValue(data.dealerHand) <= 16);
    data = checkGameStatus(data);
    return data;
}

function startGame(client, data) {
    data.playerHand.push(getRandomCard(client));
    data.playerHand.push(getRandomCard(client));
    data.dealerHand.push(getRandomCard(client));
    data = checkGameStatus(data);
    return data;
}

async function runHit(client, data) {
    if (data.playerHand.length >= 5) data.gameFinished = true;
    data.playerHand.push(getRandomCard(client));
    return data;
}

async function runStand(client, data) {
    data.gameFinished = true;
    return data;
}

module.exports.execute = async (client, interaction, data) => {
    const bet = interaction.options.getInteger('bet');
    if (bet > data.guildUser.wallet) {
        await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, data.cmd.help.name);
        return interaction.reply({ content: `You don't have :coin: ${bet} in your wallet.`, ephemeral: true });
    }
    let disableDoubleDown = data.guildUser.wallet < bet * 2;

    // initialize variables
    data.bet = bet;
    data.gameFinished = false;
    data.playerWon = false;
    data.playerHand = [];
    data.dealerHand = [];

    await interaction.deferReply();
    data = startGame(client, data);
    await interaction.editReply({ embeds: [createEmbed(client, data)], components: [setButtons(data.gameFinished, disableDoubleDown)] });
    const interactionMessage = await interaction.fetchReply();

    const filter = async (i) => {
        if (i.member.id === interaction.member.id) return true;
        await i.reply({ content: `Those buttons are not meant for you.`, ephemeral: true, target: i.member });
        return false;
    }

    const collector = interactionMessage.createMessageComponentCollector({ filter, max: 6, idle: 15000 });

    collector.on('collect', async (interactionCollector) => {
        await interactionCollector.deferUpdate();
        if (!data.gameFinished) {
            if (interactionCollector.customId === 'bj_hit') {
                data = await runHit(client, data);
                disableDoubleDown = true;
            } else if (interactionCollector.customId === 'bj_stand') {
                data = await runStand(client, data);
            } else if (interactionCollector.customId === 'bj_doubleDown' && !disableDoubleDown) {
                data.bet *= 2;
                data = await runHit(client, data);
                data = await runStand(client, data);
            }

            data = checkGameStatus(data);
            if (data.gameFinished) {
                data = getDealerCards(client, data);

                if (data.tie === undefined) {
                    if (data.playerWon) {
                        await client.tools.addMoney(interaction.guildId, interaction.member.id, getPrice(data.bet));
                    } else {
                        await client.tools.removeMoney(interaction.guildId, interaction.member.id, data.bet);
                    }
                }
            }
            await interaction.editReply({ embeds: [createEmbed(client, data)], components: [setButtons(data.gameFinished, disableDoubleDown)] });
        }
    })

    collector.on('end', async (interactionCollector) => {
        if (!data.gameFinished) {
            await client.tools.removeMoney(interaction.guildId, interaction.member.id, data.bet);
            await interaction.editReply({ embeds: [createEmbed(client, data, `You lost :coin: ${data.bet}`, "RED")], components: [setButtons(true)] });
        }
    })
}

module.exports.help = {
    name: "blackjack",
    description: "Play a game of blackjack.",
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
    extraFields: [],
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "READ_MESSAGE_HISTORY"],
    ownerOnly: false,
    cooldown: 900,
    enabled: true
}