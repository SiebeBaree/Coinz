const { MessageEmbed } = require('discord.js');
const guildUserSchema = require('../../database/schemas/guildUsers');

module.exports.execute = async (client, interaction, data) => {
    let amount = interaction.options.getInteger('amount');
    if (amount > data.guildUser.bank) return interaction.reply({ content: `You don't have that much in your bank. You only have :coin: ${data.guildUser.bank}.`, ephemeral: true });

    await guildUserSchema.updateOne({ guildId: interaction.guildId, userId: interaction.member.id }, {
        $inc: {
            wallet: amount,
            bank: -amount
        }
    });

    const embed = new MessageEmbed()
        .setAuthor({ name: `Withdrawn Money`, iconURL: `${interaction.member.displayAvatarURL() || client.config.embed.defaultIcon}` })
        .setColor(client.config.embed.color)
        .setDescription(`Successfully withdrawn :coin: ${amount} from your bank.`)
        .addFields(
            { name: 'New Wallet Balance', value: `:coin: ${data.guildUser.wallet + amount}`, inline: true },
            { name: 'New Bank Balance', value: `:coin: ${data.guildUser.bank - amount}`, inline: true }
        )
    await interaction.reply({ embeds: [embed] });
}

module.exports.help = {
    name: "withdraw",
    description: "Withdraw money from your bank to your wallet.",
    options: [
        {
            name: 'amount',
            type: 'INTEGER',
            description: 'Enter an amount that you want to withdraw.',
            required: true,
            min_value: 1
        }
    ],
    category: "economy",
    extraFields: [],
    memberPermissions: [],
    botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    ownerOnly: false,
    cooldown: 3,
    enabled: true
}