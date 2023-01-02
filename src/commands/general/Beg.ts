import { ChatInputCommandInteraction } from "discord.js";
import Bot from "../../structs/Bot";
import ICommand from "../../interfaces/ICommand";
import Command from "../../structs/Command";
import { IMember } from "../../models/Member";
import Helpers from "../../utils/Helpers";
import User from "../../utils/User";

export default class extends Command implements ICommand {
    readonly info = {
        name: "beg",
        description: "If you really need the money you can beg for it.",
        options: [],
        category: "general",
        cooldown: 900,
        deferReply: true,
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        const money = Helpers.getRandomNumber(20, 60);

        if (Helpers.getRandomNumber(1, 100) <= 70) {
            await User.addMoney(member.id, money);
            const experience = User.addExperience(member.id);
            await interaction.editReply(`You begged for money and got :coin: **${money}**. You also gained **${experience} XP**.`);
        } else {
            await interaction.editReply("You begged for money but no one gave you any.");
        }
    }
}