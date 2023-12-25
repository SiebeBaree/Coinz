import { join } from 'node:path';
import process from 'node:process';
import { REST, Routes } from 'discord.js';
import config from './data/config.json';
import { loadCommands } from './utils/loaders';

(async () => {
    const commands = await loadCommands(join(__dirname, './commands'));
    const commandData = [...commands.values()].map((command) => command.data);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

    await rest.put(Routes.applicationGuildCommands(process.env.APPLICATION_ID!, config.guildId), {
        body: commandData,
    });

    console.log(`Successfully registered ${commandData.length} commands.`);
})();
