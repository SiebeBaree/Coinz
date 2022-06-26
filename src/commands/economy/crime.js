const { MessageEmbed } = require('discord.js');

// Placeholders for sentences:
// %money% ==> The money the user got from crime
// %crimename% ==> The name of the crime the user comitted

const crimes = [
    {
        name: "House Robbery",
        icon: "",
        index: 1,
        sentences: [
            "You found %money% during your criminal activity"
        ],
        lootTable: {
            "fail": {
                "chance": 60,
                "loot": []
            },
            "common": {
                "chance": 20,
                "loot": ["shoe", "doll", "mirror", "lamp"]
            },
            "uncommon": {
                "chance": 13,
                "loot": ["hunting_rifle", "padlock"]
            },
            "rare": {
                "chance": 5.9,
                "loot": ["phone", "playstation"]
            },
            "super_rare": {
                "chance": 1,
                "loot": ["gold", "bomb"]
            },
            "legendary": {
                "chance": 0.1,
                "loot": ["diamond", "trophy"]
            }
        },
        enabled: true
    },
    {
        name: "Fraud",
        icon: "",
        index: 2,
        lootTable: {},
        enabled: false
    },
    {
        name: "Bank Robbery",
        icon: "",
        index: 3,
        lootTable: {},
        enabled: false
    }
]

function randomKey(client, lootTable) {
    const keys = Object.keys(lootTable);
    let randomNumber = client.tools.randomNumber(1, 1000);
    randomNumber = randomNumber / 10.0;

    let totalChance = 0;
    for (let i = 0; i < keys.length; i++) {
        if (randomNumber < totalChance + lootTable[keys[i]].chance) return keys[i];
        totalChance += lootTable[keys[i]].chance;
    }
    return keys[0];
}

function getLoot(client, key, lootTable) {
    let allLoot = lootTable[key].loot;
    if (key === "legendary") return allLoot[client.tools.randomNumber(0, allLoot.length - 1)];

    let itemCount = client.tools.randomNumber(3, 10);
    let loot = [];
    for (let i = 0; i < itemCount; i++) {
        loot.push(allLoot[client.tools.randomNumber(0, allLoot.length - 1)]);
    }

    // To make sure at least 1 item is returned.
    return loot === [] ? [allLoot[0]] : loot;
}

module.exports.execute = async (client, interaction, data) => {
    let randomCrime = crimes[0]; // Soon => crimes[client.tools.randomNumber(0, crimes.length)];
    let key = randomKey(client, randomCrime.lootTable);

    if (key === "fail") {
        const moneyLost = client.tools.randomNumber(50, 1200);
        await client.tools.removeMoney(interaction.guildId, interaction.member.id, moneyLost, true);
        return await interaction.reply({ content: `You got caught during your criminal activities. You had to go to jail but already paid bail of :coin: ${moneyLost}.` });
    }

    await interaction.deferReply();
    let loot = getLoot(client, key, randomCrime.lootTable);
    let lootText = "";

    let mappedLoot = loot.reduce((cnt, cur) => (cnt[cur] = cnt[cur] + 1 || 1, cnt), {});
    let keys = Object.keys(mappedLoot);

    for (let i = 0; i < keys.length; i++) {
        const item = await client.database.fetchItem(keys[i]);
        lootText += `${mappedLoot[keys[i]]}x ${item.name} <:${item.itemId}:${item.emoteId}>\n`;
        await client.tools.giveItem(interaction, data, item.itemId, mappedLoot[keys[i]]);
    }

    const moneyWon = client.tools.randomNumber(1, 300);
    if (lootText === "") lootText = "You almost got caught! But now you don't have any loot :(";
    let sentence = randomCrime.sentences[0, randomCrime.sentences.length - 1];

    // Adding placeholders
    sentence = sentence.replace("%money%", `:coin: ${moneyWon}`);
    sentence = sentence.replace("%crimename%", randomCrime.name);

    await client.tools.addMoney(interaction.guildId, interaction.member.id, moneyWon);

    const embed = new MessageEmbed()
        .setTitle("Crime")
        .setColor(client.config.embed.color)
        .setDescription(sentence)
        .addField('Loot', `${lootText}`, false)
    await interaction.editReply({ embeds: [embed] });
}

module.exports.help = {
    name: "crime",
    description: "Commit a crime and get the chance to become rich...",
    options: [],
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 3600,
    enabled: true
}