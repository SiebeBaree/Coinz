import process from 'node:process';
import { Events } from 'discord.js';
import type { Event } from '../domain/Event';
import { getMember } from '../lib/database';
import UserStats from '../models/userStats';
import { msToTime } from '../utils';
import logger from '../utils/logger';

export default {
    name: Events.InteractionCreate,
    once: false,
    async execute(client, interaction) {
        if (interaction.isChatInputCommand()) {
            if (!interaction.guild || !interaction.guild.available || interaction.user.bot) return;

            const command = client.commands.get(interaction.commandName);
            if (!command || command.data.enabled === false) {
                throw new Error(`Command '${interaction.commandName}' not found.`);
            }

            if (process.env.NODE_ENV === 'production') {
                const cooldown = await client.cooldown.getCooldown(interaction.user.id, command.data.name);
                if (cooldown) {
                    await interaction.reply({
                        content: `Please wait ${msToTime(
                            Math.abs(Number.parseInt(cooldown, 10) - Math.floor(Date.now() / 1_000)) * 1_000,
                        )} before using this command again.`,
                        ephemeral: true,
                    });
                    return;
                }
            }

            if (command.data.deferReply === true) {
                await interaction.deferReply();
            }

            const member = await getMember(interaction.user.id, true);
            if (member.banned) {
                const banText = `You are banned from using this bot. If you think this ban is unjustified, please join our [discord server](${client.config.supportServer}).`;

                if (command.data.deferReply === true) {
                    await interaction.editReply({
                        content: banText,
                    });
                } else {
                    await interaction.reply({
                        content: banText,
                        ephemeral: true,
                    });
                }

                return;
            }

            if ((command.data.premium ?? 0) > member.premium) {
                const premiumText = `This command is only for Coinz Plus or Pro subscribers. To gain access to this command, please visit the [**webshop**](${client.config.website}/premium).`;

                if (command.data.deferReply === true) {
                    await interaction.editReply({
                        content: premiumText,
                    });
                } else {
                    await interaction.reply({
                        content: premiumText,
                        ephemeral: true,
                    });
                }

                return;
            }

            if (process.env.NODE_ENV === 'production') {
                let cooldownTime =
                    command.data.cooldown === undefined || command.data.cooldown === 0
                        ? member.premium > 0
                            ? client.config.cooldown.premium
                            : client.config.cooldown.default
                        : command.data.cooldown;

                if (member.premium >= 2 && command.data.category === 'games') cooldownTime = 240;
                await client.cooldown.setCooldown(interaction.user.id, command.data.name, cooldownTime);
            }

            try {
                await command.execute(client, interaction, member);

                await UserStats.updateOne(
                    { id: interaction.user.id },
                    { $inc: { 'dailyActivity.totalCommands': 1 } },
                    { upsert: true },
                );

                await client.achievement.sendAchievementMessage(
                    interaction,
                    interaction.user.id,
                    client.achievement.getById('touch_grass'),
                );
                await client.achievement.sendAchievementMessage(
                    interaction,
                    interaction.user.id,
                    client.achievement.getById('no_life'),
                );
            } catch (error) {
                logger.error((error as Error).stack ?? (error as Error).message);

                const errorMsg = `There was an error while executing this command! Please try again.\nIf this keeps happening please join our [support server](<${client.config.supportServer}>).`;
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: errorMsg });
                } else {
                    await interaction.reply({ content: errorMsg, ephemeral: true });
                }
            }
        }
    },
} satisfies Event<Events.InteractionCreate>;
