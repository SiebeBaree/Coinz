import Command from '../../structures/Command.js'
import { addMoney } from '../../lib/user.js'

export default class extends Command {
    info = {
        name: "weekly",
        description: "Claim your weekly reward.",
        options: [],
        category: "economy",
        extraFields: [],
        cooldown: 604800,
        enabled: true,
        memberRequired: true,
        deferReply: true,
        isPremium: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        await addMoney(interaction.member.id, 300);
        await interaction.editReply({ content: `You claimed your weekly reward and got :coin: 300.` });
    }
}