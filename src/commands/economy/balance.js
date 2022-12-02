import Command from '../../structures/Command.js'
import { EmbedBuilder, ApplicationCommandOptionType } from 'discord.js'

export default class extends Command {
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
                { name: 'Bank', value: `:coin: ${memberData.bank}/${memberData.bankLimit || 1000}`, inline: true },
                { name: 'Net Worth', value: `:coin: ${memberData.wallet + memberData.bank}`, inline: true },
                { name: 'Tickets', value: `<:ticket:1032669959161122976> ${memberData.tickets || 0}`, inline: true },
            )
        await interaction.editReply({ embeds: [embed] });
    }
}