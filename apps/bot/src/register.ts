import { join } from 'node:path';
import process from 'node:process';
import { REST, Routes } from 'discord.js';
import { connect } from 'mongoose';
import CommandModel from './models/command';
import { loadCommands } from './utils/loaders';

(async () => {
    const commands = await loadCommands(join(__dirname, './commands'));
    const commandData = [...commands.values()].map((command) => command.data);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

    if (process.env.NODE_ENV === 'production') {
        await rest.put(Routes.applicationCommands(process.env.APPLICATION_ID!), { body: commandData });
        await rest.put(Routes.applicationGuildCommands(process.env.APPLICATION_ID!, process.env.GUILD_ID!), {
            body: [],
        });
    } else {
        await rest.put(Routes.applicationGuildCommands(process.env.APPLICATION_ID!, process.env.GUILD_ID!), {
            body: commandData,
        });
    }

    console.log(`Successfully registered ${commandData.length} commands.`);
    console.log('Updating database...');

    await connect(process.env.DATABASE_URI!);

    for (const command of commandData) {
        const dbCommand = await CommandModel.findOne({ name: command.name });

        if (dbCommand) {
            await CommandModel.updateOne(
                { name: command.name },
                {
                    description: command.description,
                    category: command.category,
                    cooldown: command.cooldown ?? 0,
                    usage: command.usage ?? [],
                    premium: command.premium ?? 0,
                },
            );
        } else {
            const newCommand = new CommandModel({
                name: command.name,
                description: command.description,
                category: command.category,
                cooldown: command.cooldown ?? 0,
                usage: command.usage ?? [],
                premium: command.premium ?? 0,
            });
            await newCommand.save();
        }
    }

    console.log('Successfully updated database.');

    process.exit();
})();
