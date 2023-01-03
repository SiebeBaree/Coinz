import { ApplicationCommandOptionType, ChatInputCommandInteraction, Colors, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import User from "../../utils/User";
import Database from "../../utils/Database";

export default class extends Command implements ICommand {
    readonly info = {
        name: "steal",
        description: "Steal money from another user.",
        options: [
            {
                name: "user",
                type: ApplicationCommandOptionType.User,
                description: "The user to steal from.",
                required: true,
            },
        ],
        category: "general",
        extraFields: [
            { name: "How can you steal?", value: "You can steal a maximum of 50% of the wallet of your victim.\nYou have a 35% chance to successfully steal from someone.\n\nIf you succeed you get 80% of the stolen money and the other 20% is to cover any costs.\nIf you fail you are punished and need to pay up to 40% of the victems wallet.", inline: false },
        ],
        cooldown: 86400,
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const victim = interaction.options.getUser("user", true);

        if (victim.bot || victim.id === interaction.user.id) {
            await interaction.reply({ content: "You can't steal from a bot or yourself.", ephemeral: true });
            return;
        }

        if (member.wallet <= 0) {
            await interaction.reply({ content: "You don't have any money to steal.", ephemeral: true });
            return;
        }

        if (User.getLevel(member.experience) < 15) {
            await interaction.reply({ content: "You need to be level 15 to steal.", ephemeral: true });
            return;
        }

        await interaction.deferReply();
        const victemMember = await Database.getMember(victim.id);

        if (victemMember.wallet <= 0) {
            await interaction.editReply({ content: `**${victim.tag}** doesn't have any money to steal.` });
            return;
        }

        const memberWon = Math.random() < 0.35;
        const amount = Math.floor(Math.random() * (Math.floor(member.wallet * (memberWon ? 0.5 : 0.4)) - 0 + 1) + 0);

        if (memberWon) {
            await User.addMoney(interaction.user.id, Math.floor(amount * 0.8));
            await User.removeMoney(victim.id, amount);
        } else {
            await User.removeMoney(interaction.user.id, amount);
        }

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Steal from ${victim.tag}`, iconURL: victim.displayAvatarURL() })
            .setColor(memberWon ? Colors.Green : Colors.Red)
            .setDescription(`You ${memberWon ? "stole" : "tried to steal, but failed and lost"} **${amount}** from **${victim.tag}**.`)
            .setFooter({ text: this.client.config.embed.footer });
        await interaction.editReply({ embeds: [embed] });
    }
}