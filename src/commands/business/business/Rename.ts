import { ChatInputCommandInteraction } from "discord.js";
import Bot from "../../../structs/Bot";
import Command from "../../../structs/Command";
import Member, { IMember } from "../../../models/Member";
import { BusinessData } from "../../../utils/User";
import { Info } from "../../../interfaces/ICommand";
import Cooldown from "../../../utils/Cooldown";
import Helpers from "../../../utils/Helpers";
import Business from "../../../models/Business";

export default class extends Command {
    private readonly info: Info;

    constructor(bot: Bot, file: string, info: Info) {
        super(bot, file);
        this.info = info;
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember, data: BusinessData) {
        if (data.isOwner && data.business) {
            const name = interaction.options.getString("name", true).trim();
            if (name.length > 24) {
                await interaction.reply({ content: "You can only use a maximum of 24 characters for your business name.", ephemeral: true });
                return;
            }

            if (!/^[A-Za-z][a-zA-Z0-9 _-]*$/.test(name)) {
                await interaction.reply({ content: "Your business name can only use `A-Z, a-z, 0-9, whitespaces, -, _` and you have to start with a letter.", ephemeral: true });
                return;
            }

            if (member.tickets < 10) {
                await interaction.reply({ content: "You need <:ticket:1032669959161122976> 10 **tickets** to rename your business.", ephemeral: true });
                return;
            }

            await interaction.deferReply({ ephemeral: true });
            const cooldown = await Cooldown.getRemainingCooldown(interaction.user.id, "business.rename");
            if (cooldown > 0) {
                await interaction.reply({ content: `:x: You have to wait ${Helpers.msToTime(cooldown * 1000)} to rename your business.`, ephemeral: true });
                return;
            }

            const business = await Business.findOne({ name: name });
            if (business !== null) {
                await interaction.editReply({ content: "There is already a business with that name." });
                return;
            }

            await Cooldown.setCooldown(interaction.user.id, "business.rename", 86400 * 5);

            await Business.updateOne({ name: data.business.name }, { $set: { name: name } });
            for (const employee of data.business.employees) {
                await Member.updateOne(
                    { id: employee.userId, business: data.business.name },
                    { $set: { business: name } },
                );
            }

            await Member.updateOne(
                { id: interaction.user.id },
                { $inc: { tickets: -10 } },
            );

            await interaction.editReply({ content: `You have successfully created a business named \`${name}\` for <:ticket:1032669959161122976> 10 **tickets**.` });
        } else {
            await interaction.reply({ content: "You need to own a business to use this command.", ephemeral: true });
            return;
        }
    }
}