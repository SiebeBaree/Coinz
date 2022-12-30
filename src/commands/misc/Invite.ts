import { CommandInteraction } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";

export default class extends Command implements ICommand {
    readonly info = {
        name: "invite",
        description: "Get a invite to our Official Support Discord Server",
        options: [],
        category: "misc",
        deferReply: true,
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: CommandInteraction) {
        await interaction.editReply({
            content: ":pushpin: **Invite Coinz yourself:** [**Click Here**](https://discord.com/oauth2/authorize?client_id=938771676433362955&permissions=313344&scope=bot%20applications.commands)\n" +
                ":wave: **Join our Official Support Discord Server:** https://discord.gg/asnZQwc6kW",
        });
    }
}