import { Events } from 'discord.js';
import type { Event } from '../domain/Event';
import logger from '../utils/logger';

export default {
    name: Events.ClientReady,
    once: true,
    async execute(_, client) {
        logger.info(`Ready! Logged in as ${client.user.tag}`);
    },
} satisfies Event<Events.ClientReady>;
