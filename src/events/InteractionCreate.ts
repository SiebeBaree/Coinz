import { Interaction } from "discord.js";
import IEvent from "../interfaces/IEvent";
import Member from "../models/Member";
import Bot from "../structs/Bot";
import Cooldown from "../utils/Cooldown";
import Database from "../utils/Database";
import Helpers from "../utils/Helpers";

export default class InteractionCreate implements IEvent {
    public readonly name = "interactionCreate";

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

            if (process.env.NODE_ENV === "production") {
                const cooldownTime = command.info.cooldown === undefined || command.info.cooldown === 0
                    ? (member.premium.active
                        ? client.config.premiumTimeout
                        : client.config.defaultTimeout)
                    : command.info.cooldown;

                await Cooldown.setCooldown(interaction.user.id, command.info.name, cooldownTime);
            }

            if (command.info.isPremium && !member.premium.active) {
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

            try {
                await command.execute(interaction, member);
                await Member.updateOne({ id: interaction.user.id }, { $inc: { "stats.commandsExecuted": 1 } });
            } catch (error) {
                client.logger.error((error as Error).stack || (error as Error).message);

                if (interaction.replied) {
                    await interaction.editReply({ content: "There was an error while executing this command!" });
                } else {
                    await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
                }
            }
        }
    }
}