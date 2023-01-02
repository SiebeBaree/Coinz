import { ChatInputCommandInteraction } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Helpers from "../../utils/Helpers";
import Command from "../../structs/Command";

export default class extends Command implements ICommand {
    readonly info = {
        name: "ping",
        description: "Get the time between the bot and discord in milliseconds.",
        options: [],
        category: "misc",
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction) {
        const now = Date.now();
        await interaction.reply({
            content: `:ping_pong: **Ping:** ${this.client.ws.ping} ms\n` +
                `:speech_balloon: **Responds Time:** ${now - interaction.createdTimestamp} ms\n` +
                `:white_check_mark: **Uptime:** ${Helpers.msToTime(this.client.uptime ?? 1)}\n\n` +
                "**Want to check the status of the bot?**\n" +
                `:globe_with_meridians: **<${this.client.config.website}status>**`,
        });
    }
}