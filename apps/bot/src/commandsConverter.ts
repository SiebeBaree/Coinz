import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadCommands } from './utils/loaders';

type CommandInfo = {
    description: string;
    category: string;
    cooldown: number;
    usage: string[];
    premium: number;
};

type Commands = {
    [key: string]: CommandInfo;
};

(async () => {
    const commandJson: Commands = {};
    const commands = await loadCommands(join(__dirname, 'commands'));

    for (const command of commands.values()) {
        const usage = [];
        for (const arg of command.data.usage ?? []) {
            usage.push('/' + command.data.name + ' ' + arg);
        }

        commandJson[command.data.name] = {
            description: command.data.description,
            category: command.data.category,
            cooldown: command.data.cooldown ?? 0,
            usage: usage,
            premium: 0,
        };
    }

    try {
        const dataPath = join(__dirname, '../src', 'data', 'commands.json');
        await writeFile(dataPath, JSON.stringify(commandJson, null, 4));
        console.log(commands.size, 'commands saved to', dataPath);
    } catch (error) {
        console.error('Error writing to file:', error);
    }
})();
