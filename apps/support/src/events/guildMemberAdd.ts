import process from 'node:process';
import { Events, WebhookClient } from 'discord.js';
import type { Event } from '../domain/Event';
import logger from '../utils/logger';

export default {
    name: Events.GuildMemberAdd,
    once: false,
    async execute(_, member) {
        try {
            const webhookClient = new WebhookClient({ id: process.env.WEBHOOK_ID!, token: process.env.WEBHOOK_TOKEN! });
            await webhookClient.send({
                content: `<:member_join:939891720378798150> **${member.user.username}** has joined the server.`,
                username: member.user.username,
                avatarURL: member.user.displayAvatarURL(),
            });
        } catch (error) {
            logger.error(error);
        }
    },
} satisfies Event<Events.GuildMemberAdd>;
