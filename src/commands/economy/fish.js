const { MessageEmbed } = require('discord.js');

const lootTable = {
    "fail": {
        "chance": 30,
        "loot": []
    },
    "common": {
        "chance": 40,
        "loot": ["cod", "salmon", "tuna", "sardine", "trash", "shoe", "socks"]
    },
    "uncommon": {
        "chance": 22,
        "loot": ["jellyfish", "catfish", "lobster", "goldfish"]
    },
    "rare": {
        "chance": 6.9,
        "loot": ["crab", "octopus", "sea_turtle", "squid"]
    },
    "super_rare": {
        "chance": 1,
        "loot": ["blobfish", "starfish", "anglerfish"]
    },
    "legendary": {
        "chance": 0.1,
        "loot": ["diamond", "crown"]
    }
}

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

    let itemCount = client.tools.randomNumber(1, 5);
    let loot = [];
    for (let i = 0; i < itemCount; i++) {
        loot.push(allLoot[client.tools.randomNumber(0, allLoot.length - 1)]);
    }

    // To make sure at least 1 item is returned.
    return loot === [] ? [allLoot[0]] : loot;
}

module.exports.execute = async (client, interaction, data) => {
    if (!await client.tools.userHasItem(data.guildUser.inventory, "fishing_rod")) {
        await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, data.cmd.help.name);
        return await interaction.reply({ content: "You need a fishing rod to use this command. Use `/shop buy item_id:fishing_rod` to buy a fishing rod.", ephemeral: true });
    }

    if (client.tools.randomNumber(1, 100) <= 5) {
        await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, data.cmd.help.name);
        await client.tools.takeItem(interaction, data, "fishing_rod", 1);
        return await interaction.reply({ content: "Oh No! Your Fishing Rod broke... You have to buy a new fishing rod. Use `/shop buy item_id:fishing_rod` to buy a fishing rod." });
    }

    let key = randomKey(client, lootTable);
    if (key === "fail") return await interaction.reply({ content: "You haven't caught any fish today :(" });

    await interaction.deferReply();
    let loot = getLoot(client, key, lootTable);
    let lootText = "";

    let mappedLoot = loot.reduce((cnt, cur) => (cnt[cur] = cnt[cur] + 1 || 1, cnt), {});
    let keys = Object.keys(mappedLoot);

    for (let i = 0; i < keys.length; i++) {
        const item = await client.database.fetchItem(keys[i]);
        lootText += `${mappedLoot[keys[i]]}x ${item.name} <:${item.itemId}:${item.emoteId}>\n`;
        await client.tools.giveItem(interaction, data, item.itemId, mappedLoot[keys[i]]);
    }

    if (lootText === "") lootText = "They got away :(";

    const embed = new MessageEmbed()
        .setTitle("Fish")
        .setColor(client.config.embed.color)
        .setDescription("You caught some fish!")
        .addField('Loot', `${lootText}`, false)
    await interaction.editReply({ embeds: [embed] });
}

module.exports.help = {
    name: "fish",
    description: "Try and catch some fish that you can sell for money.",
    options: [],
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    ownerOnly: false,
    cooldown: 2700,
    enabled: true
}