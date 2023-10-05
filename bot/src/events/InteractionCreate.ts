import { Interaction } from "discord.js";
import IEvent from "../domain/IEvent";
import Bot from "../domain/Bot";
import Database from "../lib/Database";
import Utils from "../lib/Utils";
import UserStats from "../models/UserStats";

export default class InteractionCreate implements IEvent {
    public readonly name = "interactionCreate";
    public readonly once = false;

    async execute(client: Bot, interaction: Interaction) {
        if (interaction.isChatInputCommand()) {
            if (!interaction.guild || !interaction.guild.available) return;
            if (interaction.user.bot) return;

            const command = client.commands.get(interaction.commandName);
            if (!command || command.info.enabled === false || (command.info.adminServerOnly && interaction.guildId !== client.config.adminServerId)) return;

            const cooldown = await client.cooldown.getCooldown(interaction.user.id, command.info.name);
            if (cooldown) {
                await interaction.reply({ content: `Please wait ${Utils.msToTime(Math.abs(parseInt(cooldown) - Math.floor(Date.now() / 1000)) * 1000)} seconds before using this command again.`, ephemeral: true });
                return;
            }

            if (command.info.deferReply) await interaction.deferReply();
            const member = await Database.getMember(interaction.user.id, true);

            if (member.banned) {
                await interaction.reply({ content: `You are banned from using this bot. If you think this ban is unjustified, please join our [discord server](${client.config.supportServer}).`, ephemeral: true });
                return;
            }

            if (process.env.NODE_ENV === "production") {
                const cooldownTime = command.info.cooldown === undefined || command.info.cooldown === 0 ? client.config.cooldown.default : command.info.cooldown;
                await client.cooldown.setCooldown(interaction.user.id, command.info.name, cooldownTime);
            }

            try {
                await command.execute(interaction, member);

                let userStats = await UserStats.findOne({ id: interaction.user.id });
                if (!userStats) userStats = new UserStats({ id: interaction.user.id });
                userStats.dailyActivity.totalCommands++;
                await userStats.save();

                await client.achievement.sendAchievementMessage(interaction, interaction.user.id, client.achievement.getById("touch_grass"));
                await client.achievement.sendAchievementMessage(interaction, interaction.user.id, client.achievement.getById("no_life"));
            } catch (error) {
                client.logger.error((error as Error).stack || (error as Error).message);

                const errorMsg = `There was an error while executing this command! Please try again.\nIf this keeps happening please join our [support server](<${client.config.supportServer}>).`;
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: errorMsg });
                } else {
                    await interaction.reply({ content: errorMsg, ephemeral: true });
                }
            }
        }
    }
}