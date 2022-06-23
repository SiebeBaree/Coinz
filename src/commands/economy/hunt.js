const { MessageEmbed } = require('discord.js');

const lootTable = {
    "fail": {
        "chance": 40,
        "loot": []
    },
    "common": {
        "chance": 30,
        "loot": ["fly", "worm", "slug", "ladybug"]
    },
    "uncommon": {
        "chance": 24,
        "loot": ["cow", "pig", "chicken", "bird", "sheep"]
    },
    "rare": {
        "chance": 4.9,
        "loot": ["fox", "rabbit", "duck", "deer"]
    },
    "super_rare": {
        "chance": 1,
        "loot": ["penguin", "bear", "elephant"]
    },
    "legendary": {
        "chance": 0.1,
        "loot": ["dragon"]
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

    let itemCount = client.tools.randomNumber(1, 7);
    let loot = [];
    for (let i = 0; i < itemCount; i++) {
        loot.push(allLoot[client.tools.randomNumber(0, allLoot.length - 1)]);
    }

    // To make sure at least 1 item is returned.
    return loot === [] ? [allLoot[0]] : loot;
}

module.exports.execute = async (client, interaction, data) => {
    if (!await client.tools.userHasItem(data.guildUser.inventory, "hunting_rifle")) {
        await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, data.cmd.help.name);
        return await interaction.reply({ content: "You need a hunting rifle to use this command. Use `/shop buy item_id:hunting_rifle` to buy a hunting rifle.", ephemeral: true });
    }

    if (client.tools.randomNumber(1, 100) <= 4) {
        await client.cooldown.removeCooldown(interaction.guildId, interaction.member.id, data.cmd.help.name);
        await client.tools.takeItem(interaction, data, "hunting_rifle", 1);
        return await interaction.reply({ content: "Oh No! Your Hunting Rifle broke... You have to buy a new hunting rifle. Use `/shop buy item_id:hunting_rifle` to buy a hunting rifle." });
    }

    let key = randomKey(client, lootTable);
    if (key === "fail") return await interaction.reply({ content: "You haven't caught any animals today :(" });

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
        .setTitle("Hunt")
        .setColor(client.config.embed.color)
        .setDescription("You caught some animals!")
        .addField('Loot', `${lootText}`, false)
    await interaction.editReply({ embeds: [embed] });
}

module.exports.help = {
    name: "hunt",
    description: "Hunt for animals and get money selling their meat.",
    options: [],
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 7200,
    enabled: true
}