import { ChatInputCommandInteraction } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import Member from "../../models/Member";

export default class extends Command implements ICommand {
    readonly info = {
        name: "start",
        description: "Get a starting balance.",
        options: [],
        category: "admin",
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction) {
        if (interaction.guildId !== this.client.config.adminServerId || process.env.NODE_ENV === "production") return;

        this.client.logger.info(`Giving ${interaction.user.tag} a starting balance.`);
        await Member.updateOne({ id: interaction.user.id }, {
            $inc: {
                balance: 50000,
                tickets: 150,
                experience: 500,
            },
        }, { upsert: true });

        await interaction.reply({ content: "You have been given :coin: 50,000, 5 Levels of XP and <:ticket:1032669959161122976> 150 Tickets.", ephemeral: true });
    }
}