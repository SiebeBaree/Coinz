/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
dotenv.config();

import { ApplicationCommandOption, REST, Routes } from "discord.js";
import { adminServerId } from "./assets/config.json";
import CommandHandler from "./handlers/CommandHandler";
import Bot from "./structs/Bot";

interface CommandOptions {
    name: string;
    description: string;
    options?: ApplicationCommandOption[];
    dm_permission?: boolean;
}

(async () => {
    const bot = new Bot({ intents: [] }, true);

    try {
        const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN ?? "");

        // Get the commands from the handler
        const commandHandler = new CommandHandler(bot, "/commands/", ["admin"]);
        const publicCmdFiles = await commandHandler.load();
        const guildCmdFiles = await commandHandler.load("/commands/admin/");

        const publicCommands: CommandOptions[] = [];
        const guildCommands: CommandOptions[] = [];

        publicCmdFiles.forEach((command) => {
            publicCommands.push({
                name: command.info.name,
                description: command.info.description,
                options: command.info.options,
                dm_permission: false,
            });
        });

        guildCmdFiles.forEach((command) => {
            guildCommands.push({
                name: command.info.name,
                description: command.info.description,
                options: command.info.options,
                dm_permission: false,
            });
        });

        console.log(`Started refreshing ${publicCommands.length + guildCommands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const publicData = await rest.put(Routes.applicationCommands(process.env.CLIENT_ID ?? ""), { body: publicCommands });
        const guildData = await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID ?? "", adminServerId), { body: guildCommands });

        console.log(`Successfully reloaded ${(publicData as any).length} public application (/) commands.`);
        console.log(`Successfully reloaded ${(guildData as any).length} guild application (/) commands.`);
    } catch (error) {
        console.error(error);
    } finally {
        bot.destroy();
        process.exit(1);
    }
})();