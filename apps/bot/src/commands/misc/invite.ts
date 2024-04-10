import type { Command } from '../../domain/Command';

export default {
    data: {
        name: 'invite',
        description: 'Get a invite to invite the bot and to join our support server.',
        category: 'misc',
    },
    async execute(client, interaction) {
        await interaction.reply({
            content:
                ':pushpin: **Invite Coinz yourself:** [**Click Here**](https://discord.com/oauth2/authorize?client_id=938771676433362955&permissions=313344&scope=bot%20applications.commands)\n' +
                `:wave: **Join our Official Support Discord Server:** ${client.config.supportServer}`,
        });
    },
} satisfies Command;
