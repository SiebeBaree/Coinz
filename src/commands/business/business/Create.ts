import { ChatInputCommandInteraction } from "discord.js";
import Bot from "../../../structs/Bot";
import Command from "../../../structs/Command";
import Member, { IMember } from "../../../models/Member";
import User, { BusinessData } from "../../../utils/User";
import { Info } from "../../../interfaces/ICommand";
import Cooldown from "../../../utils/Cooldown";
import Helpers from "../../../utils/Helpers";
import Database from "../../../utils/Database";
import Business from "../../../models/Business";

export default class extends Command {
    private readonly info: Info;

    constructor(bot: Bot, file: string, info: Info) {
        super(bot, file);
        this.info = info;
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember, data: BusinessData) {
        if (User.getLevel(member.experience) < 15) {
            await interaction.reply({ content: "You need to be at least level 15 to start your own business.", ephemeral: true });
            return;
        }

        if (data.business === undefined && member.business === "") {
            const name = interaction.options.getString("name", true).trim();

            if (name.length > 24) {
                await interaction.reply({ content: "You can only use a maximum of 24 characters for your business name.", ephemeral: true });
                return;
            }

            if (!/^[A-Za-z][a-zA-Z0-9 _-]*$/.test(name)) {
                await interaction.reply({ content: "Your business name can only use `A-Z, a-z, 0-9, whitespaces, -, _` and you have to start with a letter.", ephemeral: true });
                return;
            }

            if (member.wallet < 4000) {
                await interaction.reply({ content: "You need :coin: 4000 in your wallet to create a business.", ephemeral: true });
                return;
            }

            await interaction.deferReply({ ephemeral: true });
            const cooldown = await Cooldown.getRemainingCooldown(interaction.user.id, "business.create");
            if (cooldown > 0) {
                await interaction.reply({ content: `:x: You have to wait ${Helpers.msToTime(cooldown * 1000)} to create another business.`, ephemeral: true });
                return;
            }

            const business = await Business.findOne({ name: name });
            if (business !== null) {
                await interaction.editReply({ content: "There is already a business with that name." });
                return;
            }

            await Cooldown.setCooldown(interaction.user.id, "business.create", 86400 * 14);
            await Database.getBusiness(name, true);
            await Member.updateOne(
                { id: interaction.user.id },
                { $set: { business: name }, $inc: { wallet: -4000 } },
            );

            await interaction.editReply({ content: `You have successfully created a business named \`${name}\` for :coin: 4000.` });
        } else {
            await interaction.reply({ content: `You already own or work at a business.\nPlease leave your business using </${this.info.name} leave:1048340073470513155>.`, ephemeral: true });
        }
    }
}