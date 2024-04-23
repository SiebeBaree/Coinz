import process from 'node:process';
import { Events, WebhookClient } from 'discord.js';
import type { Event } from '../domain/Event';
import logger from '../utils/logger';

export default {
    name: Events.GuildMemberRemove,
    once: false,
    async execute(_, member) {
        try {
            const webhookClient = new WebhookClient({ id: process.env.WEBHOOK_ID!, token: process.env.WEBHOOK_TOKEN! });
            await webhookClient.send({
                content: `<:member_leave:1051512749756264448> **${member.user.username}** has left the server.`,
                username: member.user.username,
                avatarURL: member.user.displayAvatarURL(),
            });
        } catch (error) {
            logger.error(error);
        }
    },
} satisfies Event<Events.GuildMemberRemove>;
