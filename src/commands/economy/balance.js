import Command from '../../structures/Command.js'
import {
    EmbedBuilder,
    ApplicationCommandOptionType,
    ActionRowBuilder,
    ButtonStyle,
    ButtonBuilder,
    ComponentType,
} from 'discord.js'
import Member from '../../models/Member.js'

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
        let memberData = await bot.database.fetchMember(member.id);

        if (member.id !== interaction.user.id) return await interaction.editReply({ embeds: [this.getEmbed(member, memberData, "none")] });
        let priceToIncrease = this.calculateBankLimitPrice(memberData.bankLimit);
        let hasEnoughMoney = memberData.wallet >= priceToIncrease;
        let interactionFinished = false;

        const message = await interaction.editReply({
            embeds: [this.getEmbed(member, memberData, priceToIncrease, hasEnoughMoney)],
            components: [this.getButton(hasEnoughMoney)],
            fetchReply: true
        });

        const filter = (i) => i.user.id === member.id;
        const collector = message.createMessageComponentCollector({ filter, max: 10, idle: 20_000, componentType: ComponentType.Button });

        collector.on('collect', async (i) => {
            if (i.customId === 'balance_add-limit' && !interactionFinished) {
                memberData = await bot.database.fetchMember(member.id);

                let logBL = memberData.bankLimit;

                priceToIncrease = this.calculateBankLimitPrice(memberData.bankLimit);
                hasEnoughMoney = memberData.wallet >= priceToIncrease;
                memberData.wallet -= priceToIncrease;
                memberData.bankLimit *= 2;
                bot.logger.log(`${interaction.user.id} (${interaction.user.tag}) increased their bank limit from ${logBL} to ${memberData.bankLimit} for ${priceToIncrease} coins.`);

                if (!hasEnoughMoney) return await i.reply({ content: ':x: You do not have enough money in your wallet to increase your bank limit.', ephemeral: true });
                await Member.updateOne({ id: member.id }, { $inc: { wallet: -priceToIncrease }, $set: { bankLimit: memberData.bankLimit } });

                priceToIncrease = this.calculateBankLimitPrice(memberData.bankLimit);
                hasEnoughMoney = memberData.wallet >= priceToIncrease;

                if (!hasEnoughMoney) interactionFinished = true;
                await i.update({
                    embeds: [this.getEmbed(member, memberData, priceToIncrease, hasEnoughMoney)],
                    components: [this.getButton(hasEnoughMoney)],
                });
            }
        });

        collector.on('end', async (collected) => {
            interactionFinished = true;
            await interaction.editReply({ components: [this.getButton(hasEnoughMoney, true)] });
        });
    }

    calculateBankLimitPrice(bankLimit) {
        return Math.ceil(bankLimit * 0.7);
    }

    getEmbed(member, memberData, priceToIncrease, hasEnoughMoney) {
        const embed = new EmbedBuilder()
            .setAuthor({ name: `${member.displayName || member.username}'s balance`, iconURL: `${member.displayAvatarURL() || bot.config.embed.defaultIcon}` })
            .setColor(bot.config.embed.color)
            .addFields({ name: 'Balance', value: `:dollar: **Wallet:** :coin: ${memberData.wallet}\n:bank: **Bank:** :coin: ${memberData.bank} / ${memberData.bankLimit || 7500}\n:moneybag: **Net Worth:** :coin: ${memberData.wallet + memberData.bank}\n<:ticket:1032669959161122976> **Tickets:** <:ticket:1032669959161122976> ${memberData.tickets || 0}`, inline: true })

        if (priceToIncrease !== "none") {
            embed.setDescription(hasEnoughMoney ?
                `:white_check_mark: **You can increase your bank limit to \`${memberData.bankLimit * 2}\` for :coin: ${priceToIncrease}**.` :
                `:x: **You need :coin: ${priceToIncrease > memberData.wallet ? priceToIncrease - memberData.wallet : 1} to increase your bank limit to \`${memberData.bankLimit * 2}\`.**`
            )
        }

        return embed;
    }

    getButton(hasEnoughMoney, disabled = false) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('balance_add-limit')
                    .setLabel('Increase Bank Limit')
                    .setEmoji('🪙')
                    .setStyle(hasEnoughMoney ? ButtonStyle.Success : ButtonStyle.Danger)
                    .setDisabled(!hasEnoughMoney || disabled)
            )
        return row;
    }
}