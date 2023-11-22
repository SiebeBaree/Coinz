import { Events } from 'discord.js';
import type { Event } from '../domain/Event';

export default {
    name: Events.ClientReady,
    once: true,
    async execute(_client2, client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
    },
} satisfies Event<Events.ClientReady>;
