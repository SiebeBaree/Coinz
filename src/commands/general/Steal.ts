import { ApplicationCommandOptionType, ChatInputCommandInteraction, Colors, EmbedBuilder } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import User from "../../utils/User";
import Database from "../../utils/Database";
import Item from "../../interfaces/Item";

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
            {
                name: "use-bomb",
                type: ApplicationCommandOptionType.Boolean,
                description: "Use a bomb to increase your chance of success. Default: true",
                required: false,
            },
        ],
        category: "general",
        extraFields: [
            { name: "How can you steal?", value: "You can steal a maximum of 50% of the wallet of your victim.\nYou have a 35% chance to successfully steal from someone.\n\nIf you succeed you get 80% of the stolen money and the other 20% is to cover any costs.\nIf you fail you are punished and need to pay up to 40% of the victems wallet.", inline: false },
        ],
        cooldown: 86400,
    };

    private readonly bomb: Item;
    constructor(bot: Bot, file: string) {
        super(bot, file);

        const bomb = this.client.items.getById("bomb");
        if (!bomb) {
            throw new Error("Bomb item not found.");
        }

        this.bomb = bomb;
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const victim = interaction.options.getUser("user", true);
        const bombActivated = interaction.options.getBoolean("use-bomb", false) ?? true;

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

        const bombInInventory = this.client.items.hasInInventory(this.bomb.itemId, member);
        if (!bombInInventory && bombActivated) {
            await interaction.reply({ content: `You don't have a <:${this.bomb.itemId}:${this.bomb.emoteId}> **${this.bomb.name}** to use.`, ephemeral: true });
            return;
        }

        await interaction.deferReply();
        const victimMember = await Database.getMember(victim.id);

        if (victimMember.wallet <= 0) {
            await interaction.editReply({ content: `**${victim.tag}** doesn't have any money to steal.` });
            return;
        }

        const padlockInInventory = this.client.items.hasInInventory("padlock", victimMember);

        let chance = 0.35;
        if (padlockInInventory) chance -= 0.10;
        if (bombInInventory) chance += 0.05;
        if (victimMember.premium.active && victimMember.premium.tier === 2) chance -= 0.10;

        const memberWon = Math.random() < chance;
        const amount = Math.floor(Math.random() * (Math.floor(member.wallet * (memberWon ? 0.5 : 0.4)) - 0 + 1) + 0);

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Steal from ${victim.tag}`, iconURL: victim.displayAvatarURL() })
            .setColor(memberWon ? Colors.Green : Colors.Red)
            .setDescription(`You ${memberWon ? "stole" : "tried to steal, but failed and lost"} :coin: **${amount}** from **${victim.tag}**.`)
            .setFooter({ text: this.client.config.embed.footer });
        await interaction.editReply({ embeds: [embed] });

        if (bombActivated) {
            await this.client.items.removeItem(this.bomb.itemId, member);
        }

        if (memberWon) {
            await User.addMoney(interaction.user.id, Math.floor(amount * 0.8));
            await User.removeMoney(victim.id, amount, true);

            if (victimMember.notifications.includes("steal")) {
                try {
                    const dmChannel = await victim.createDM();
                    await dmChannel.send({ content: `**${interaction.user.tag}** stole :coin: **${amount}** from you.` });
                    await victim.deleteDM();
                } catch {
                    // Ignore
                }
            }
        } else {
            if (padlockInInventory && Math.random() <= 0.25) {
                await this.client.items.removeItem("padlock", victimMember);
            }

            await User.removeMoney(interaction.user.id, amount, true);
        }
    }
}