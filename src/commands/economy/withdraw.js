const Command = require('../../structures/Command.js');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const MemberModel = require('../../models/Member');

class Withdraw extends Command {
    info = {
        name: "withdraw",
        description: "Withdraw money from your bank to your wallet.",
        options: [
            {
                name: 'amount',
                type: ApplicationCommandOptionType.Integer,
                description: 'Enter an amount that you want to withdraw.',
                required: true,
                min_value: 1
            }
        ],
        category: "economy",
        extraFields: [],
        memberPermissions: [],
        botPermissions: [],
        cooldown: 0,
        enabled: true,
        guildRequired: false,
        memberRequired: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        let amount = interaction.options.getInteger('amount');
        if (amount > data.user.bank) return interaction.editReply({ content: `You don't have that much in your bank. You only have :coin: ${data.user.bank}.` });

        await MemberModel.updateOne({ id: interaction.member.id }, {
            $inc: {
                wallet: amount,
                bank: -amount
            }
        });

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Withdrawn Money`, iconURL: `${interaction.member.displayAvatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(bot.config.embed.color)
            .setDescription(`Successfully withdrawn :coin: ${amount} from your bank.`)
            .addFields(
                { name: 'New Wallet Balance', value: `:coin: ${data.user.wallet + amount}`, inline: true },
                { name: 'New Bank Balance', value: `:coin: ${data.user.bank - amount}`, inline: true }
            )
        await interaction.editReply({ embeds: [embed] });
    }
}

module.exports = Withdraw;