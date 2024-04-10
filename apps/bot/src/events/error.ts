import { Events } from 'discord.js';
import type Bot from '../domain/Bot';
import type { Event } from '../domain/Event';
import logger from '../utils/logger';

export default {
    name: Events.Error,
    once: false,
    async execute(_: Bot, error: Error) {
        logger.error(`An error occurred: ${error.message}\n${error.stack}`);
    },
} satisfies Event<Events.Error>;
