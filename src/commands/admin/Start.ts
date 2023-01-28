import { ChatInputCommandInteraction } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import User from "../../utils/User";

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
        await User.addMoney(interaction.user.id, 50_000);
        await interaction.reply({ content: "You have been given :coin: 50,000.", ephemeral: true });
    }
}