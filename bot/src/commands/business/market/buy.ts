import { EmbedBuilder, type ChatInputCommandInteraction, Colors } from 'discord.js';
import type Bot from '../../../domain/Bot';
import { Positions, type BusinessData, MarketStatus } from '../../../lib/types';
import Business from '../../../models/business';
import Market from '../../../models/market';

export default async function buy(client: Bot, interaction: ChatInputCommandInteraction, data: BusinessData) {
    if (data.employee.position < Positions.Manager) {
        await interaction.reply({
            content: 'You need to be a manager or higher to buy items from the global market.',
            ephemeral: true,
        });
        return;
    }

    const listingId = interaction.options.getString('listing-id', true);

    const listing = await Market.findOne({ listingId: listingId });
    if (!listing) {
        await interaction.reply({ content: 'The listing you are trying to buy does not exist.', ephemeral: true });
        return;
    }

    const item = client.business.getById(listing.itemId);
    if (!item) {
        await interaction.reply({ content: 'The item you are trying to buy does not exist.', ephemeral: true });
        return;
    } else if (listing.status !== MarketStatus.Listed) {
        await interaction.reply({
            content: 'The listing you are trying to buy is no longer available.',
            ephemeral: true,
        });
        return;
    } else if (listing.pricePerUnit * listing.quantity > data.business.balance) {
        await interaction.reply({
            content: `Your business does not have enough money to buy this ${client.business.getItemString(item, listing.quantity)}.`,
            ephemeral: true,
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle('Item Bought')
        .setDescription(
            `You have successfully bought ${client.business.getItemString(item, listing.quantity)} for :coin: ${listing.pricePerUnit * listing.quantity}.`,
        )
        .setColor(Colors.Green);
    await interaction.reply({ embeds: [embed] });

    await Market.updateOne({ listingId: listingId }, { status: MarketStatus.Sold, soldTo: data.business.name });

    const itemInInventory = client.business.getInventoryItem(listing.itemId, data.business.inventory);
    if (itemInInventory) {
        await Business.updateOne(
            { name: data.business.name, 'inventory.itemId': listing.itemId },
            {
                $inc: {
                    balance: -(listing.pricePerUnit * listing.quantity),
                    'inventory.$.amount': listing.quantity,
                },
            },
        );
    } else {
        await Business.updateOne(
            { name: data.business.name },
            {
                $inc: { balance: -(listing.pricePerUnit * listing.quantity) },
                $push: { inventory: { itemId: item.itemId, amount: listing.quantity } },
            },
        );
    }
}
