import { ChatInputCommandInteraction } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import User from "../../utils/User";

export default class extends Command implements ICommand {
    readonly info = {
        name: "monthly",
        description: "Collect your monthly money.",
        options: [],
        category: "general",
        cooldown: 2592000,
        deferReply: true,
        isPremium: 2,
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        await User.addMoney(member.id, 2000);
        await interaction.editReply({ content: "You have collected your monthly reward of :coin: 2000." });
    }
}