import { Events } from 'discord.js';
import type Bot from '../domain/Bot';
import type { Event } from '../domain/Event';
import logger from '../utils/logger';

export default {
    name: Events.ShardError,
    once: false,
    async execute(_: Bot, error: Error, shardId: number) {
        logger.error(`Shard ${shardId} encountered an error: ${error.message}\n${error.stack}`);
    },
} satisfies Event<Events.ShardError>;
