import { EmbedBuilder, type ChatInputCommandInteraction, type ColorResolvable } from 'discord.js';
import type Bot from '../../../domain/Bot';
import { Positions, type BusinessData } from '../../../lib/types';
import Business from '../../../models/business';

export default async function supply(client: Bot, interaction: ChatInputCommandInteraction, data: BusinessData) {
    if (data.employee.position < Positions.Manager) {
        await interaction.reply({
            content: 'You need to be a manager or higher to buy supplies.',
            ephemeral: true,
        });
        return;
    }

    const itemIdOrName = interaction.options.getString('item', true);
    const amount = interaction.options.getNumber('amount') ?? 1;
    const item = client.business.getById(itemIdOrName) ?? client.business.getByName(itemIdOrName);

    if (!item) {
        await interaction.reply({ content: 'The item you are trying to buy does not exist.', ephemeral: true });
        return;
    } else if (item.producable) {
        await interaction.reply({
            content: `You cannot supply factory items. Use \`/market list ${item.itemId}\` to get a list of items you can buy.`,
            ephemeral: true,
        });
        return;
    } else if (amount < 1) {
        await interaction.reply({
            content: `You need to buy at least ${client.business.getItemString(item, 1)}.`,
            ephemeral: true,
        });
        return;
    } else if (amount > 1000) {
        await interaction.reply({
            content: `You can only buy up to ${client.business.getItemString(item, 1000)} at once.`,
            ephemeral: true,
        });
        return;
    } else if (item.price * amount > data.business.balance) {
        await interaction.reply({
            content: `You do not have enough money to buy ${client.business.getItemString(item, amount)}.`,
            ephemeral: true,
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle('Supply Purchase')
        .setColor(client.config.embed.color as ColorResolvable)
        .setDescription(
            `You have bought ${client.business.getItemString(item, amount)} for :coin: ${item.price * amount}`,
        );
    await interaction.reply({ embeds: [embed] });

    const inventoryItem = client.business.getInventoryItem(item.itemId, data.business.inventory);
    if (inventoryItem) {
        await Business.updateOne(
            { name: data.business.name, 'inventory.itemId': item.itemId },
            {
                $inc: {
                    'inventory.$.amount': amount,
                    balance: -item.price * amount,
                },
            },
        );
    } else {
        await Business.updateOne(
            { name: data.business.name },
            {
                $inc: { balance: -item.price * amount },
                $push: {
                    inventory: { itemId: item.itemId, amount },
                },
            },
        );
    }
}
