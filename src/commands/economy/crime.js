const Command = require('../../structures/Command.js');
const lootTable = require('../../assets/lootTables/crime.json');
const { EmbedBuilder } = require('discord.js');

class Crime extends Command {
    info = {
        name: "crime",
        description: "Commit a crime and get the chance to become rich...",
        options: [],
        category: "economy",
        extraFields: [],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 900,
        enabled: true,
        guildRequired: false,
        memberRequired: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        let key = this.randomKey();

        if (key === "fail") {
            const moneyLost = bot.tools.randomNumber(100, 500);
            await bot.tools.takeMoney(interaction.member.id, moneyLost, true);
            return await interaction.editReply({ content: `You got caught during your criminal activities. You had to go to jail but already paid bail of :coin: ${moneyLost}.` });
        }

        let loot = this.getLoot(key);
        let mappedLoot = loot.reduce((cnt, cur) => (cnt[cur] = cnt[cur] + 1 || 1, cnt), {});
        let keys = Object.keys(mappedLoot);

        let lootText = "";
        let totalPrice = 0;
        for (let i = 0; i < keys.length; i++) {
            const item = await bot.database.fetchItem(keys[i]);
            totalPrice += item.sellPrice;
            lootText += `${mappedLoot[keys[i]]}x ${item.name} <:${item.itemId}:${item.emoteId}>\n`;
            await bot.tools.addItem(interaction.member.id, item.itemId, mappedLoot[keys[i]], data.user.inventory);
        }

        const moneyWon = bot.tools.randomNumber(1, 300);
        await bot.tools.addMoney(interaction.member.id, moneyWon);

        const embed = new EmbedBuilder()
            .setTitle("Crime")
            .setColor(bot.config.embed.color)
            .setDescription(`:detective: **You robbed a house and stole some items.**\n:moneybag: **You can sell the items for :coin: ${totalPrice}.**\n:gem: **Sell items using** \`/shop sell <item-id> [amount]\``)
            .addFields(
                { name: 'Loot', value: `${lootText || "You almost got caught! But now you don't have any loot :("}`, inline: false }
            )
        await interaction.editReply({ embeds: [embed] });
    }

    randomKey() {
        const keys = Object.keys(lootTable);
        let randomNumber = bot.tools.randomNumber(1, 1000);
        randomNumber = randomNumber / 10.0;

        let totalChance = 0;
        for (let i = 0; i < keys.length; i++) {
            if (randomNumber < totalChance + lootTable[keys[i]].chance) return keys[i];
            totalChance += lootTable[keys[i]].chance;
        }
        return keys[0];
    }

    getLoot(key) {
        let allLoot = lootTable[key].loot;
        if (key === "legendary") return allLoot[bot.tools.randomNumber(0, allLoot.length - 1)];

        let itemCount = bot.tools.randomNumber(2, 6);
        let loot = [];
        for (let i = 0; i < itemCount; i++) {
            loot.push(allLoot[bot.tools.randomNumber(0, allLoot.length - 1)]);
        }

        // To make sure at least 1 item is returned.
        return loot === [] ? [allLoot[0]] : loot;
    }
}

module.exports = Crime;