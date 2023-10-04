import { ChatInputCommandInteraction } from "discord.js";
import Bot from "../../domain/Bot";
import ICommand from "../../domain/ICommand";
import Command from "../../domain/Command";
import { IMember } from "../../models/Member";
import Utils from "../../lib/Utils";
import UserUtils from "../../lib/UserUtils";
import UserStats from "../../models/UserStats";

export default class extends Command implements ICommand {
    readonly info = {
        name: "beg",
        description: "If you really need the money you can beg for it.",
        options: [],
        category: "general",
        cooldown: 600,
    };

    constructor(bot: Bot, file: string) {
        super(bot, file);
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        if (UserUtils.getLevel(member.experience) > 20) {
            await interaction.reply("You are too experienced to beg for money. This command is only for users below level 20.");
            return;
        }

        const money = Utils.getRandomNumber(15, 50);
        if (Utils.getRandomNumber(1, 100) <= 75) {
            await UserUtils.addMoney(member.id, money);
            const experience = await UserUtils.addExperience(member.id);
            await interaction.reply(`You begged for money and got :coin: **${money}**. You also gained **${experience} XP**.`);

            await UserStats.updateOne(
                { id: interaction.user.id },
                { $inc: { totalEarned: money } },
                { upsert: true },
            );
        } else {
            await interaction.reply("You begged for money but no one gave you any.");
        }
    }
}