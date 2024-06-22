import { EmbedBuilder, type ChatInputCommandInteraction, type ColorResolvable } from 'discord.js';
import type Bot from '../../../domain/Bot';
import { Positions, type BusinessData, MarketStatus } from '../../../lib/types';
import Business from '../../../models/business';
import Market from '../../../models/market';
import { generateRandomString } from '../../../utils';

export default async function sell(client: Bot, interaction: ChatInputCommandInteraction, data: BusinessData) {
    if (data.employee.position < Positions.Manager) {
        await interaction.reply({
            content: 'You need to be a manager or higher to sell items from your business.',
            ephemeral: true,
        });
        return;
    }

    const itemId = interaction.options.getString('item', true);
    const amount = interaction.options.getInteger('amount', true);

    const item = client.business.getById(itemId) ?? client.business.getByName(itemId);
    if (!item) {
        await interaction.reply({ content: 'The item you are trying to sell does not exist.', ephemeral: true });
        return;
    } else if (!item.sellable) {
        await interaction.reply({
            content: `You cannot sell ${client.business.getItemString(item)}.`,
            ephemeral: true,
        });
        return;
    }

    const inventoryItem = client.business.getInventoryItem(itemId, data.business.inventory);
    if (!inventoryItem) {
        await interaction.reply({
            content: `Your business does not own ${client.business.getItemString(item)}`,
            ephemeral: true,
        });
        return;
    } else if (inventoryItem.amount < amount) {
        await interaction.reply({
            content: `You do not have enough ${client.business.getItemString(item)} to sell.`,
            ephemeral: true,
        });
        return;
    }

    if (amount < 1) {
        await interaction.reply({
            content: `You need to sell at least ${client.business.getItemString(item, 1)}.`,
            ephemeral: true,
        });
        return;
    } else if (amount > 100) {
        await interaction.reply({
            content: `You can only sell up to ${client.business.getItemString(item, 100)} at once.`,
            ephemeral: true,
        });
        return;
    }

    const sellPrice = interaction.options.getInteger('price', false) ?? item.price;
    if (item.isEndProduct && sellPrice !== item.price) {
        await interaction.reply({
            content: `You cannot change the price of ${client.business.getItemString(item)} because it is an end product.`,
            ephemeral: true,
        });
        return;
    }

    if (sellPrice < item.price * 0.8) {
        await interaction.reply({
            content: `You cannot sell ${client.business.getItemString(item)} for less than 80% of the original price.`,
            ephemeral: true,
        });
        return;
    } else if (sellPrice > item.price * 1.2) {
        await interaction.reply({
            content: `You cannot sell ${client.business.getItemString(item)} for more than 120% of the original price.`,
            ephemeral: true,
        });
        return;
    }

    await interaction.deferReply();

    let listingId = '';
    do {
        listingId = generateRandomString(6);
    } while (await Market.exists({ listingId }));

    if (item.isEndProduct) {
        const embed = new EmbedBuilder()
            .setTitle('Sold item')
            .setColor(client.config.embed.color as ColorResolvable)
            .setDescription(
                `You have sold ${client.business.getItemString(item, amount)} for :coin: ${sellPrice} each. Your business has received a total of :coin: ${amount * sellPrice}.`,
            )
            .setFields([
                { name: 'Item', value: client.business.getItemString(item, amount), inline: true },
                { name: 'Total Price', value: `:coin: ${amount * sellPrice}`, inline: true },
            ]);
        await interaction.editReply({ embeds: [embed] });
    } else {
        const embed = new EmbedBuilder()
            .setTitle('Item listed for sale')
            .setColor(client.config.embed.color as ColorResolvable)
            .setDescription(
                `You have listed ${client.business.getItemString(item, amount)} for :coin: ${sellPrice} each. You will receive a total of :coin: ${amount * sellPrice} once the item is sold.`,
            )
            .setFields([
                { name: 'Listing ID', value: listingId, inline: true },
                { name: 'Item', value: client.business.getItemString(item, amount), inline: true },
                { name: 'Total Price', value: `:coin: ${amount * sellPrice}`, inline: true },
            ]);
        await interaction.editReply({ embeds: [embed] });
    }

    try {
        const market = new Market({
            listingId: listingId,
            businessName: data.business.name,
            itemId: item.itemId,
            pricePerUnit: sellPrice,
            quantity: amount,
            status: item.isEndProduct ? MarketStatus.Sold : MarketStatus.Listed,
        });
        await market.save();
    } catch {
        await interaction.followUp({
            content: 'Something went wrong with your listing, your items have been returned. Please try again.',
            ephemeral: true,
        });
        return;
    }

    if (inventoryItem.amount > amount) {
        await Business.updateOne(
            { name: data.business.name, 'inventory.itemId': itemId },
            {
                $inc: {
                    'inventory.$.amount': -amount,
                    balance: item.isEndProduct ? item.price * amount : 0,
                },
            },
        );
    } else {
        await Business.updateOne(
            { name: data.business.name },
            {
                $inc: { balance: item.isEndProduct ? item.price * inventoryItem.amount : 0 },
                $pull: { inventory: { itemId, amount } },
            },
        );
    }
}
