const { MessageEmbed } = require('discord.js');
const guildUserSchema = require('../../database/schemas/guildUsers');

module.exports.execute = async (client, interaction, data) => {
    let amount = interaction.options.getInteger('amount');
    if (amount > data.guildUser.wallet) return interaction.reply({ content: `You don't have that much in your wallet. You only have :coin: ${data.guildUser.wallet}.`, ephemeral: true });

    await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
        $inc: {
            wallet: -amount,
            bank: amount
        }
    });

    const embed = new MessageEmbed()
        .setAuthor({ name: `Deposited Money`, iconURL: `${interaction.member.displayAvatarURL() || client.config.embed.defaultIcon}` })
        .setColor(client.config.embed.color)
        .setDescription(`Successfully deposited :coin: ${amount} to your bank.`)
        .addFields(
            { name: 'New Wallet Balance', value: `:coin: ${data.guildUser.wallet - amount}`, inline: true },
            { name: 'New Bank Balance', value: `:coin: ${data.guildUser.bank + amount}`, inline: true }
        )
    await interaction.reply({ embeds: [embed] });
}

module.exports.help = {
    name: "deposit",
    description: "Deposit money from your wallet to your bank account.",
    options: [
        {
            name: 'amount',
            type: 'INTEGER',
            description: 'Enter an amount that you want to deposit.',
            required: true,
            min_value: 1
        }
    ],
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: [],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}