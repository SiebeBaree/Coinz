import dotenv from "dotenv";
dotenv.config();

import { GatewayIntentBits } from "discord.js"
import Bot from "../structures/Bot.js"

const bot = global.bot = new Bot({ intents: [GatewayIntentBits.Guilds] });
bot.login();

bot.on('ready', async () => {
    // Put all commands into an object and push it to an array.
    let data = [];
    bot.commands.forEach(command => {
        if (command.info.enabled) {
            data.push(
                {
                    name: command.info.name,
                    description: command.info.description || "No Description Provided.",
                    options: command.info.options,
                    dm_permission: false
                }
            );
        }
    });

    // await this.application?.commands.set(data);  // Used to set slash commands globally [Can take several hours to update.]
    await bot.guilds.cache.get(bot.config.supportServerId)?.commands.set(data);
    bot.logger.ready(`Commands loaded.`);

    bot.destroy();
    process.exit(0);
});