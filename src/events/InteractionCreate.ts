import { Interaction } from "discord.js";
import IEvent from "../interfaces/IEvent";
import Member from "../models/Member";
import Bot from "../structs/Bot";
import Achievement from "../utils/Achievement";
import Cooldown from "../utils/Cooldown";
import Database from "../utils/Database";
import Helpers from "../utils/Helpers";
import User from "../utils/User";

export default class InteractionCreate implements IEvent {
    public readonly name = "interactionCreate";
    private readonly achievement;

    constructor() {
        this.achievement = Achievement.getById("touch_grass");
    }

    async execute(client: Bot, interaction: Interaction) {
        if (interaction.isChatInputCommand()) {
            if (!interaction.guild || !interaction.guild.available) return;
            if (interaction.user.bot) return;

            const command = client.commands.get(interaction.commandName);
            if (!command || command.info.enabled === false) return;
            if (command.info.category === "admin" && interaction.guildId !== client.config.adminServerId) return;

            // Check cooldown
            const cooldown = await Cooldown.getRemainingCooldown(interaction.user.id, command.info.name);
            if (cooldown > 0) {
                await interaction.reply({
                    content: `You can use this command again in ${Helpers.msToTime(cooldown * 1000)}.`,
                    ephemeral: true,
                });
                return;
            }

            if (command.info.deferReply) await interaction.deferReply();
            const member = await Database.getMember(interaction.user.id, true);
            const guild = await Database.getGuild(interaction.guild.id, true);

            if (process.env.NODE_ENV === "production") {
                let cooldownTime = command.info.cooldown === undefined || command.info.cooldown === 0
                    ? (member.premium.active === true
                        ? client.config.premiumTimeout
                        : client.config.defaultTimeout)
                    : command.info.cooldown;

                cooldownTime = command.info.category === "games" && (member.premium.active || guild.premium.active) ? 240 : cooldownTime;
                await Cooldown.setCooldown(interaction.user.id, command.info.name, cooldownTime);
            }

            if (command.info.isPremium && (!member.premium.active || member.premium.tier < command.info.isPremium)) {
                if (!(command.info.isServerUnlocked && guild.premium.active)) {
                    const text = "This command is only available for premium users!\n" +
                        "If you want to use this command, consider buying **Coinz Premium**.\n" +
                        "Go to the [**store**](<https://coinzbot.xyz/store>) to learn more.";

                    if (command.info.deferReply) {
                        await interaction.editReply({ content: text });
                    } else {
                        await interaction.reply({ content: text, ephemeral: true });
                    }
                    return;
                }
            }

            try {
                await command.execute(interaction, member, guild);
                await Member.updateOne({ id: interaction.user.id }, { $inc: { "stats.commandsExecuted": 1 } });
                await User.sendAchievementMessage(interaction, interaction.user.id, this.achievement);
            } catch (error) {
                client.logger.error((error as Error).stack || (error as Error).message);

                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: "There was an error while executing this command! Please try again.\nIf this keeps happening please join our [support server](<https://discord.gg/asnZQwc6kW>)." });
                } else {
                    await interaction.reply({ content: "There was an error while executing this command! Please try again.\nIf this keeps happening please join our [support server](<https://discord.gg/asnZQwc6kW>).", ephemeral: true });
                }
            }
        }
    }
}