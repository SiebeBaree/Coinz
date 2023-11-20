import IEvent from "../domain/IEvent";
import Bot from "../domain/Bot";
import { CommandInteractionOption, REST, Routes } from "discord.js";

interface CommandOptions {
    name: string;
    description: string;
    options?: CommandInteractionOption[];
    dm_permission?: boolean;
    default_member_permissions?: string;
}

export default class Ready implements IEvent {
    public readonly name = "ready";
    public readonly once = true;

    async execute(client: Bot) {
        client.logger.debug(`Cluster ${client.cluster?.id} is ready!`);

        // TODO: Remove development code and create proper command uploader
        if (process.env.NODE_ENV !== "production") {
            try {
                const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

                const publicCommands: CommandOptions[] = [];
                client.commands.forEach((command) => {
                    publicCommands.push({
                        name: command.info.name,
                        description: command.info.description,
                        options: command.info.options,
                        dm_permission: false,
                    });
                });

                if (process.env.NODE_ENV !== "production") {
                    client.logger.debug(`Started refreshing ${publicCommands.length} application (/) commands.`);
                    await rest.put(Routes.applicationGuildCommands(client.user!.id, client.config.adminServerId), { body: publicCommands });
                    client.logger.debug(`Successfully reloaded ${publicCommands.length} public application (/) commands.`);
                }
            } catch (error) {
                console.error(error);
            }
        }
    }
}