const Command = require('../../structures/Command.js');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const MemberModel = require('../../models/Member');

class Deposit extends Command {
    info = {
        name: "deposit",
        description: "Deposit money from your wallet to your bank account.",
        options: [
            {
                name: 'amount',
                type: ApplicationCommandOptionType.Integer,
                description: 'Enter an amount that you want to deposit.',
                required: true,
                min_value: 1
            }
        ],
        category: "economy",
        extraFields: [],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 0,
        enabled: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        let amount = interaction.options.getInteger('amount');
        if (amount > data.user.wallet) return interaction.reply({ content: `You don't have that much in your wallet. You only have :coin: ${data.user.wallet}.`, ephemeral: true });

        await MemberModel.updateOne({ id: interaction.member.id }, {
            $inc: {
                wallet: -amount,
                bank: amount
            }
        });

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Deposited Money`, iconURL: `${interaction.member.displayAvatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(bot.config.embed.color)
            .setDescription(`Successfully deposited :coin: ${amount} to your bank.`)
            .addFields(
                { name: 'New Wallet Balance', value: `:coin: ${data.user.wallet - amount}`, inline: true },
                { name: 'New Bank Balance', value: `:coin: ${data.user.bank + amount}`, inline: true }
            )
        await interaction.reply({ embeds: [embed] });
    }
}

module.exports = Deposit;