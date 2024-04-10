import { Events } from 'discord.js';
import type Bot from '../domain/Bot';
import type { Event } from '../domain/Event';
import logger from '../utils/logger';

export default {
    name: Events.Warn,
    once: false,
    async execute(_: Bot, message: string) {
        logger.warn(`Warning: ${message}`);
    },
} satisfies Event<Events.Warn>;
