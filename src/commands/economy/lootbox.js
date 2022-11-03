const Command = require('../../structures/Command.js');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const lootboxes = require("../../assets/lootboxes.json");

class Lootbox extends Command {
    info = {
        name: "lootbox",
        description: "Open or buy a lootbox to get awesome rewards.",
        options: [
            {
                name: 'list',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Get a list of all available lootboxes.',
                options: [
                    {
                        name: 'lootbox-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The name of the lootbox you want to open.',
                        required: false
                    }
                ]
            },
            {
                name: 'open',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Spin the lucky wheel!',
                options: [
                    {
                        name: 'lootbox-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The name of the lootbox you want to open.',
                        required: true
                    }
                ]
            },
            {
                name: 'buy',
                type: ApplicationCommandOptionType.Subcommand,
                description: 'Buy a new lootbox.',
                options: [
                    {
                        name: 'lootbox-id',
                        type: ApplicationCommandOptionType.String,
                        description: 'The name of the lootbox you want to buy.',
                        required: true
                    },
                    {
                        name: 'amount',
                        type: ApplicationCommandOptionType.Integer,
                        description: 'The amount of lootboxes you want to buy. | default: 1.',
                        required: false,
                        min_value: 1,
                        max_value: 10
                    }
                ]
            },
        ],
        category: "economy",
        extraFields: [],
        cooldown: 0,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        if (interaction.options.getSubcommand() === "list") return await this.execList(interaction, data);
        if (interaction.options.getSubcommand() === "open") return await this.execOpen(interaction, data);
        if (interaction.options.getSubcommand() === "buy") return await this.execBuy(interaction, data);
        return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help ${this.info.name}\`.`, ephemeral: true });
    }

    async execList(interaction, data) {
        const name = interaction.options.getString('lootbox-id');

        if (name === null) {
            await interaction.deferReply();
            let lootboxStr = "";

            for (const lootboxIndex in this.lootboxIds) {
                const lootbox = this.lootboxIds[lootboxIndex];
                let icon = `<:${lootbox}:${lootboxes[lootbox].emoteId}>`;
                lootboxStr += `${icon} **${lootbox}** ― :tickets: ${lootboxes[lootbox].price}\n> ${lootboxes[lootbox].description}\n\n`;
            }

            if (lootboxStr !== "") lootboxStr = "\n\n" + lootboxStr;
            const embed = new EmbedBuilder()
                .setTitle('List of Lootboxes')
                .setColor(bot.config.embed.color)
                .setDescription(`Lootboxes are bought using tickets. Use </premium:0> to get more information..${lootboxStr}`)
                .setFooter({ text: "Get more info using /lootbox list <lootbox-id>" });

            return await interaction.editReply({ embeds: [embed] });
        } else {
            const lootbox = lootboxes[name.toLowerCase()];
            if (!lootbox) return await interaction.reply({ content: 'This lootbox doesn\'t exist! Use </lootbox list:0> to get a list with all lootboxes.', ephemeral: true });

            await interaction.deferReply();
            const promises = lootbox.loot.map(async ({ itemId, chance }) => {
                const item = await bot.database.fetchItem(itemId);
                return `<:${itemId}:${item.emoteId}> **${item.name}** - ${chance}% chance`;
            });

            Promise.all(promises)
                .then(results => {
                    const embed = new EmbedBuilder()
                        .setTitle(`Lootbox: ${name.toLowerCase()}`)
                        .setColor(bot.config.embed.color)
                        .setThumbnail(`https://cdn.discordapp.com/emojis/${lootbox.emoteId}.${lootbox.animated ? "gif" : "png"}`)
                        .setDescription(`> ${lootbox.description}`)
                        .addFields(
                            { name: 'Price', value: `:tickets: ${lootbox.price}`, inline: false },
                            { name: 'Possible Loot', value: results.join("\n"), inline: false }
                        )

                    return interaction.editReply({ embeds: [embed] });
                }).catch();
        }
    }

    async execOpen(interaction, data) {
        const name = interaction.options.getString('lootbox-id');
        const lootbox = lootboxes[name.toLowerCase()];
        if (!lootbox) return await interaction.reply({ content: 'This lootbox doesn\'t exist! Use </lootbox list:0> to get a list with all lootboxes.', ephemeral: true });

        if (data.user.lootboxes === undefined) data.user.lootboxes = [];
        const lootboxUser = data.user.lootboxes.find(l => l.itemId === name.toLowerCase());
        if (lootboxUser === null) return await interaction.reply({ content: `You don't own this lootbox. Please buy this lootbox using \`/lootbox buy ${name.toLowerCase()} [amount]\``, ephemeral: true });

        await interaction.deferReply();
        const item = await getRandomItem(lootbox.loot);
    }

    async execBuy(interaction, data) {

    }

    async getRandomItem(loot) {
        let item;

        for (let i = 0; i < loot.length; i++) {
            const random = bot.tools.randomNumber(1, 1000);
            if (random <= loot[i].chance) {
                item = loot[i];
                break;
            }
        }

        if (item === undefined) item = loot[0];
        const shopItem = await bot.database.fetchItem(item.itemId);
        return {
            ...shopItem,
            amount: item.amount || 1
        };
    }
}

module.exports = Lootbox;