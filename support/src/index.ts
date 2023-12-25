import process from 'node:process';
import { GatewayIntentBits, Partials } from 'discord.js';
import { connect } from 'mongoose';
import Bot from './domain/Bot';
import logger from './utils/logger';

(async () => {
    const bot = new Bot({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
        partials: [Partials.GuildMember],
    });

    try {
        await connect(process.env.DATABASE_URI!);
        logger.info('Connected to the database.');
    } catch (error) {
        logger.error(error);
        process.exit(1);
    }

    await bot.login(process.env.DISCORD_TOKEN!);
})();

process.on('uncaughtException', (err: Error) => {
    logger.error(err.stack);
});

process.on('unhandledRejection', (err: Error) => {
    logger.error(err.stack);
});
