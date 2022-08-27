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
                type: ApplicationCommandOptionType.String,
                description: 'Enter an amount that you want to deposit.',
                required: true
            }
        ],
        category: "economy",
        extraFields: [
            { name: "Amount Formatting", value: "You can use formatting to make it easier to use big numbers.\n\n__For Example:__\n~~1000~~ **1K**\n~~1000000~~ **1M**\n~~1300~~ **1.3K**\nUse `all` or `max` to use the maximum money you have.", inline: false }
        ],
        cooldown: 0,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const amountStr = interaction.options.getString('amount');

        let amount = 0;
        if (["all", "max"].includes(amountStr.toLowerCase())) {
            if (data.user.wallet <= 0) return await interaction.reply({ content: `You don't have any money in your wallet.`, ephemeral: true });
            amount = data.user.wallet;
        } else {
            amount = bot.tools.extractNumber(amountStr);
            if (amount <= 0) return await interaction.reply({ content: `You need to deposit at least :coin: 1.`, ephemeral: true });
            if (amount > data.user.wallet) return await interaction.reply({ content: `You don't have that much in your wallet. You only have :coin: ${data.user.wallet}.`, ephemeral: true });
        }
        await interaction.deferReply();

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
        await interaction.editReply({ embeds: [embed] });
    }
}

module.exports = Deposit;