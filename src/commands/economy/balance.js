const Command = require('../../structures/Command.js');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');

class Balance extends Command {
    info = {
        name: "balance",
        description: "Get your balance or the balance of another user.",
        options: [
            {
                name: 'user',
                type: ApplicationCommandOptionType.User,
                description: 'Get the balance of another user.',
                required: false
            }
        ],
        category: "economy",
        extraFields: [],
        cooldown: 0,
        enabled: true,
        memberRequired: false,
        deferReply: false
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const member = interaction.options.getUser('user') || interaction.member;
        if (member.bot) return await interaction.reply({ content: 'That user is a bot. You can only check the balance of a real person.', ephemeral: true });
        await interaction.deferReply();
        const memberData = await bot.database.fetchMember(member.id);

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${member.displayName || member.username}'s balance`, iconURL: `${member.displayAvatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(bot.config.embed.color)
            .addFields(
                { name: 'Wallet', value: `:coin: ${memberData.wallet}`, inline: true },
                { name: 'Bank', value: `:coin: ${memberData.bank}`, inline: true },
                { name: 'Net Worth', value: `:coin: ${memberData.wallet + memberData.bank}`, inline: true }
            )
        await interaction.editReply({ embeds: [embed] });
    }
}

module.exports = Balance;