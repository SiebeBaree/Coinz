import { ChatInputCommandInteraction } from "discord.js";
import Bot from "../../../structs/Bot";
import Command from "../../../structs/Command";
import Member, { IMember } from "../../../models/Member";
import { BusinessData } from "../../../utils/User";
import { Info } from "../../../interfaces/ICommand";
import Business from "../../../models/Business";

export default class extends Command {
    private readonly info: Info;

    constructor(bot: Bot, file: string, info: Info) {
        super(bot, file);
        this.info = info;
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember, data: BusinessData) {
        if (member.business === "") {
            await interaction.reply({ content: "You are not working for a business.", ephemeral: true });
            return;
        }

        if (data.isOwner || data.employee.role === "ceo") {
            await interaction.reply({ content: `To leave your business, you need to sell it using </${this.info.name} sell:1048340073470513155>`, ephemeral: true });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        if (data.business) {
            await Business.updateOne(
                { name: data.business.name },
                { $pull: { employees: { userId: interaction.user.id } } },
            );
        }
        await Member.updateOne({ id: interaction.user.id }, { $set: { business: "" } });

        await interaction.editReply({ content: "You have left your business." });
    }
}