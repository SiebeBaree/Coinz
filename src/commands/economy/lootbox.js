import Command from '../../structures/Command.js'
import { EmbedBuilder, ApplicationCommandOptionType } from 'discord.js'
import { randomNumber } from '../../lib/helpers.js'
import lootboxes from '../../assets/lootboxes.json' assert { type: 'json' }

export default class extends Command {
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
            }
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
        return await interaction.reply({ content: `Sorry, invalid arguments. Please try again.\nIf you don't know how to use this command use \`/help command ${this.info.name}\`.`, ephemeral: true });
    }

    async execList(interaction, data) {
        const name = interaction.options.getString('lootbox-id');

        if (name === null) {
            await interaction.deferReply();
            let lootboxStr = "";

            const lootboxKeys = Object.keys(lootboxes);
            for (let i = 0; i < lootboxKeys.length; i++) {
                const lootbox = lootboxes[lootboxKeys[i]];
                let icon = `<:${lootboxKeys[i]}:${lootbox.emoteId}>`;
                lootboxStr += `${icon} **${lootbox.name}** (ID: \`${lootboxKeys[i]}\`) ― <:ticket:1032669959161122976> ${lootbox.price}\n\n`;
            }

            if (lootboxStr !== "") lootboxStr = "\n\n" + lootboxStr;
            const embed = new EmbedBuilder()
                .setTitle('List of Lootboxes')
                .setColor(bot.config.embed.color)
                .setDescription(`:toolbox: **Lootboxes are bought using tickets.**\n:gem: **Use** \`/premium\` **to get more information.**${lootboxStr}`)
                .setFooter({ text: "Get more info using /lootbox list <lootbox-id>" });

            return await interaction.editReply({ embeds: [embed] });
        } else {
            const lootbox = lootboxes[name.toLowerCase()];
            if (!lootbox) return await interaction.reply({ content: 'This lootbox doesn\'t exist! Use \`/lootbox list\` to get a list with all lootboxes.', ephemeral: true });

            await interaction.deferReply();
            const promises = lootbox.loot.map(async (lootItem) => {
                if (["Coins", "Tickets"].includes(lootItem.itemId)) {
                    return `<:${lootItem.emoteName}:${lootItem.emoteId}> **${lootItem.amount}** ${lootItem.itemId}`;
                } else {
                    const item = await bot.database.fetchItem(lootItem.itemId);
                    return `<:${lootItem.itemId}:${item.emoteId}> **${lootItem.amount}x** ${item.name}`;
                }
            });

            Promise.all(promises)
                .then(results => {
                    const embed = new EmbedBuilder()
                        .setTitle(lootbox.name)
                        .setColor(bot.config.embed.color)
                        .setThumbnail(`https://cdn.discordapp.com/emojis/${lootbox.emoteId}.${lootbox.animated ? "gif" : "png"}`)
                        .addFields(
                            { name: 'Price', value: `<:ticket:1032669959161122976> ${lootbox.price}`, inline: false },
                            { name: 'Possible Loot', value: results.join("\n"), inline: false }
                        )

                    return interaction.editReply({ embeds: [embed] });
                }).catch();
        }
    }

    async execOpen(interaction, data) {
        await interaction.reply({ content: 'You can\'t open lootboxes at the moment. You can still collect them and open them later...', ephemeral: true });
    }

    async getRandomItem(loot) {
        let item;

        for (let i = 0; i < loot.length; i++) {
            const random = randomNumber(1, 1000);
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