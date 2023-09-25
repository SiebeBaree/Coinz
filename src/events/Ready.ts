import IEvent from "../interfaces/IEvent";
import Bot from "../structs/Bot";
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

    async execute(client: Bot) {
        client.logger.info(`Cluster ${client.cluster?.id} is ready!`);

        try {
            const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN ?? "");

            const publicCommands: CommandOptions[] = [];

            client.commands.forEach((command) => {
                if (command.info.category === "admin") return;

                publicCommands.push({
                    name: command.info.name,
                    description: command.info.description,
                    options: command.info.options,
                    dm_permission: false,
                });
            });

            if (process.env.NODE_ENV === "production") {
                console.log(`Started refreshing ${publicCommands.length} application (/) commands.`);

                await rest.put(Routes.applicationCommands(process.env.CLIENT_ID ?? ""), { body: publicCommands });
                await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID ?? "", client.config.adminServerId), { body: [] });

                // send all public commands to discordbotlist.com
                fetch(`https://discordbotlist.com/api/v1/bots/${process.env.CLIENT_ID}/commands`, {
                    method: "POST",
                    body: JSON.stringify(publicCommands),
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": `Bot ${process.env.API_BOTLIST_DBL}`,
                    },
                });

                console.log(`Successfully reloaded ${publicCommands.length} public application (/) commands.`);
            }
        } catch (error) {
            console.error(error);
        }
    }
}