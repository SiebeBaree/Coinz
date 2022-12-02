import Command from '../../structures/Command.js'
import { addMoney } from '../../lib/user.js'

export default class extends Command {
    info = {
        name: "monthly",
        description: "Claim your monthly reward.",
        options: [],
        category: "economy",
        extraFields: [],
        cooldown: 2592000,
        enabled: true,
        memberRequired: true,
        deferReply: true,
        isPremium: true
    };

    constructor(...args) {
        super(...args);
    }

    async run(interaction, data) {
        await addMoney(interaction.member.id, 1000);
        await interaction.editReply({ content: `You claimed your monthly reward and got :coin: 1000.` });
    }
}