import { ChatInputCommandInteraction } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import User from "../../utils/User";

export default class extends Command implements ICommand {
    readonly info = {
        name: "weekly",
        description: "Collect your weekly money.",
        options: [],
        category: "general",
        cooldown: 604800,
        deferReply: true,
        isPremium: true,
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        await User.addMoney(member.id, 500);
        await interaction.editReply({ content: "You have collected your weekly reward of :coin: 500." });
    }
}