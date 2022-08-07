const Command = require('../../structures/Command.js');
const { EmbedBuilder, ApplicationCommandOptionType, ComponentType } = require('discord.js');
const ItemModel = require('../../models/Item');

class Inventory extends Command {
    info = {
        name: "inventory",
        description: "View your or someone's inventory.",
        options: [
            {
                name: 'user',
                type: ApplicationCommandOptionType.User,
                description: 'Get the inventory of another user.',
                required: false
            }
        ],
        category: "economy",
        extraFields: [],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 0,
        enabled: true,
        guildRequired: false,
        memberRequired: false
    };

    itemsPerPage = 10;

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        await interaction.deferReply();
        const member = interaction.options.getUser('user') || interaction.member;

        const memberData = await bot.database.fetchMember(member.id);
        if (memberData.inventory.length <= 0 && member.id === interaction.member.id) return await interaction.editReply({ content: `You don't have anything in your inventory.` });
        if (memberData.inventory.length <= 0) return await interaction.editReply({ content: `This user doesn't have anything in his inventory.` });

        let category = "all";
        let invItems = await this.getItems(memberData.inventory, category);
        let maxPages = Math.ceil(invItems.length / this.itemsPerPage);
        let currentPage = 0;

        let invStr = this.createInventory(invItems, currentPage);
        const interactionMessage = await interaction.editReply({ embeds: [this.createInvEmbed(member, invStr, currentPage, maxPages)], components: [bot.tools.categoriesSelectMenu(category), bot.tools.pageButtons(currentPage, maxPages)], fetchReply: true });
        const collector = bot.tools.createMessageComponentCollector(interactionMessage, interaction, { max: 20, idle: 15000, time: 60000 });

        collector.on('collect', async (interactionCollector) => {
            if (interactionCollector.componentType === ComponentType.Button) {
                if (interactionCollector.customId === 'toLastPage') currentPage = maxPages - 1;
                else if (interactionCollector.customId === 'toFirstPage') currentPage = 0;
                else if (interactionCollector.customId === 'toNextPage') currentPage++;
                else if (interactionCollector.customId === 'toPreviousPage') currentPage--;
            } else if (interactionCollector.componentType === ComponentType.SelectMenu) {
                category = interactionCollector.values[0];
                invItems = await this.getItems(memberData.inventory, category);
                maxPages = Math.ceil(invItems.length / this.itemsPerPage);
                currentPage = 0;
            }

            invStr = this.createInventory(invItems, currentPage);
            await interactionCollector.deferUpdate();
            await interaction.editReply({ embeds: [this.createInvEmbed(member, invStr, currentPage, maxPages)], components: [bot.tools.categoriesSelectMenu(category), bot.tools.pageButtons(currentPage, maxPages)] });
        });

        collector.on('end', async (interactionCollector) => {
            await interaction.editReply({ components: [bot.tools.categoriesSelectMenu("", true), bot.tools.pageButtons(currentPage, maxPages, true)] });
        });
    }

    async getItems(inventory, category = "all") {
        let items = [];

        for (let invItem in inventory) {
            let item = await ItemModel.findOne({ itemId: inventory[invItem].itemId });
            item.quantity = inventory[invItem].quantity; // Add quantity to item
            if (item != null && (category === "all" || item.category === category.toLowerCase())) items.push(item);
        }

        return items;
    }

    createInventory(item, currentPage) {
        let invStr = "";

        for (let i = 0; i < item.length; i++) {
            if (i >= currentPage * this.itemsPerPage && i < currentPage * this.itemsPerPage + this.itemsPerPage) {
                let icon = item[i].emoteId === "" ? ':x:' : `<:${item[i].itemId}:${item[i].emoteId}>`;
                invStr += `${icon} **${item[i].name}** ― ${item[i].quantity}\n**ID:** \`${item[i].itemId}\`\n\n`
            }
        }
        return invStr;
    }

    createInvEmbed(member, desc, currentPage, maxPages) {
        if (desc.trim() === "") desc = "Nothing found. Please buy or earn items.";
        let embed = new EmbedBuilder()
            .setAuthor({ name: `${member.displayName || member.username}'s inventory`, iconURL: `${member.displayAvatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(bot.config.embed.color)
            .setFooter({ text: `/${this.info.name} list [item-id] to get more info about an item. ─ Page ${currentPage + 1} of ${maxPages}.` })
            .setDescription(desc)
        return embed;
    }
}

module.exports = Inventory;