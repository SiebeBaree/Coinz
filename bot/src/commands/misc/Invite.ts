import { ChatInputCommandInteraction } from "discord.js";
import Bot from "../../domain/Bot";
import ICommand from "../../domain/ICommand";
import Command from "../../domain/Command";

export default class extends Command implements ICommand {
    readonly info = {
        name: "invite",
        description: "Get a invite to invite the bot and to join our support server.",
        options: [],
        category: "misc",
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply({
            content: ":pushpin: **Invite Coinz yourself:** [**Click Here**](https://discord.com/oauth2/authorize?client_id=938771676433362955&permissions=313344&scope=bot%20applications.commands)\n" +
                `:wave: **Join our Official Support Discord Server:** ${this.client.config.supportServer}`,
        });
    }
}