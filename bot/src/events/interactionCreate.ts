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

            const cooldown = await client.cooldown.getCooldown(interaction.user.id, command.data.name);
            if (cooldown) {
                await interaction.reply({
                    content: `Please wait ${msToTime(
                        Math.abs(Number.parseInt(cooldown, 10) - Math.floor(Date.now() / 1_000)) * 1_000,
                    )} seconds before using this command again.`,
                    ephemeral: true,
                });
                return;
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

            if (process.env.NODE_ENV === 'production') {
                const cooldownTime =
                    command.data.cooldown === undefined || command.data.cooldown === 0
                        ? client.config.cooldown.default
                        : command.data.cooldown;
                await client.cooldown.setCooldown(interaction.user.id, command.data.name, cooldownTime);
            }

            try {
                await command.execute(client, interaction, member);

                let userStats = await UserStats.findOne({ id: interaction.user.id });
                if (!userStats) userStats = new UserStats({ id: interaction.user.id });
                userStats.dailyActivity.totalCommands++;
                await userStats.save();

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
