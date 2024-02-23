import { ApplicationCommandOptionType, Colors, EmbedBuilder } from 'discord.js';
import type { Command } from '../../domain/Command';
import { getMember } from '../../lib/database';
import { getLevel } from '../../utils';
import { addMoney, removeMoney } from '../../utils/money';

export default {
    data: {
        name: 'steal',
        description: 'Steal money from another user.',
        category: 'general',
        cooldown: 86400,
        options: [
            {
                name: 'user',
                type: ApplicationCommandOptionType.User,
                description: 'The user to steal from.',
                required: true,
            },
        ],
        extraFields: [
            {
                name: 'How can you steal?',
                value: 'You can steal a maximum of 50% of the wallet of your victim.\nYou have a 35% chance to successfully steal from someone.\n\nIf you succeed you get 80% of the stolen money and the other 20% is to cover any costs.\nIf you fail you are punished and need to pay up to 40% of the victems wallet.',
                inline: false,
            },
        ],
    },
    async execute(client, interaction, member) {
        if (getLevel(member.experience) < 12) {
            await interaction.reply('You need to be at least level 12 to steal money from someone.');
            await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
            return;
        }

        const victim = interaction.options.getUser('user', true);

        if (victim.id === interaction.user.id || victim.bot) {
            await interaction.reply('You cannot steal from yourself or a bot.');
            await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
            return;
        }

        const victimMember = await getMember(victim.id);
        if (victimMember.wallet < 1) {
            await interaction.reply('You cannot steal from someone who has no money.');
            await client.cooldown.deleteCooldown(interaction.user.id, this.data.name);
            return;
        }

        const victimHasPadlock = client.items.hasInInventory('padlock', member);

        let chance = 0.35;
        if (victimHasPadlock) chance -= 0.1;

        const memberWon = Math.random() < chance;
        const amount = Math.floor(Math.random() * (Math.floor(member.wallet * (memberWon ? 0.5 : 0.4)) - 0 + 1) + 0);

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Steal from ${victim.tag}`, iconURL: victim.displayAvatarURL() })
            .setColor(memberWon ? Colors.Green : Colors.Red)
            .setDescription(
                `You ${memberWon ? 'stole' : 'tried to steal, but failed and lost'} :coin: **${amount}** from **${
                    victim.tag
                }**.`,
            )
            .setFooter({ text: client.config.embed.footer });
        await interaction.reply({ embeds: [embed] });

        if (victimHasPadlock && Math.random() <= 0.2) {
            await client.items.removeItem('padlock', victimMember);
        }

        if (memberWon) {
            await addMoney(interaction.user.id, Math.floor(amount * 0.8));
            await removeMoney(victim.id, amount);

            if (victimMember.notifications.includes('steal')) {
                try {
                    const dmChannel = await victim.createDM();
                    await dmChannel.send({
                        content: `**${interaction.user.tag}** stole :coin: **${amount}** from you.`,
                    });
                    await victim.deleteDM();
                } catch {
                    // Ignore
                }
            }
        } else {
            await removeMoney(interaction.user.id, amount);
        }
    },
} satisfies Command;
