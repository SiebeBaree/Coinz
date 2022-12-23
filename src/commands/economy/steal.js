import Command from '../../structures/Command.js'
import {
    EmbedBuilder,
    ApplicationCommandOptionType,
    Colors
} from 'discord.js'
import Member from '../../models/Member.js'
import { addMoney, getLevel, takeMoney } from '../../lib/user.js'

export default class extends Command {
    info = {
        name: "steal",
        description: "Steal money from another user.",
        options: [
            {
                name: 'user',
                type: ApplicationCommandOptionType.User,
                description: 'The user to steal from.',
                required: true
            }
        ],
        category: "economy",
        extraFields: [
            { name: "How can you steal?", value: "You can steal a maximum of 50% of the wallet of your victim.\nYou have a 35% chance to successfully steal from someone.\n\nIf you succeed you get 80% of the stolen money and the other 20% is to cover any costs.\nIf you fail you are punished and need to pay up to 40% of the victems wallet.", inline: false },
        ],
        cooldown: 86400,
        enabled: true,
        memberRequired: true,
        deferReply: false
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        const user = interaction.options.getUser('user');
        if (user.bot) {
            await bot.cooldown.removeCooldown(interaction.user.id, this.info.name);
            return await interaction.reply({ content: 'That user is a bot. You can only steal from of a real person.', ephemeral: true });
        }

        if (user.id === interaction.user.id) {
            await bot.cooldown.removeCooldown(interaction.user.id, this.info.name);
            return await interaction.reply({ content: 'You can\'t steal from yourself...', ephemeral: true });
        }

        if (data.user.wallet <= 0) {
            await bot.cooldown.removeCooldown(interaction.user.id, this.info.name);
            return await interaction.reply({ content: 'You need at least :coin: 0 in your wallet in order to steal from other people.', ephemeral: true });
        }

        if (getLevel(data.user.experience) < 10) {
            await bot.cooldown.removeCooldown(interaction.user.id, this.info.name);
            return await interaction.reply({ content: 'You need to be at least level 10 in order to steal from other people.', ephemeral: true });
        }

        await interaction.deferReply();
        const member = await Member.findOne({ id: user.id });

        if (!member || member.wallet <= 0) {
            await bot.cooldown.removeCooldown(interaction.user.id, this.info.name);
            return await interaction.editReply({ content: 'That user doesn\'t have any money...', ephemeral: true });
        }

        const memberWon = Math.random() >= 0.35;
        const amount = Math.floor(Math.random() * (Math.floor(member.wallet * (memberWon ? 0.5 : 0.4)) - 0 + 1) + 0);

        if (memberWon) {
            await addMoney(interaction.user.id, Math.floor(amount * 0.8));
            await takeMoney(user.id, amount);
        } else {
            await takeMoney(interaction.user.id, amount);
        }

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Steal from ${user.tag}`, iconURL: user.displayAvatarURL() })
            .setColor(memberWon ? Colors.Green : Colors.Red)
            .setDescription(`You ${memberWon ? 'successfully stole' : 'tried to steal, but failed and lost'} :coin: ${memberWon ? Math.floor(amount * 0.8) : amount} from ${user.tag}!`)
            .setFooter({ text: bot.config.embed.footer });
        await interaction.editReply({ embeds: [embed] });
    }
}