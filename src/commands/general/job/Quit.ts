import { ChatInputCommandInteraction } from "discord.js";
import { Info } from "../../../interfaces/ICommand";
import Member, { IMember } from "../../../models/Member";
import Bot from "../../../structs/Bot";

export default class {
    private readonly client: Bot;
    private readonly info: Info;

    constructor(client: Bot, info: Info) {
        this.client = client;
        this.info = info;
    }

    async execute(interaction: ChatInputCommandInteraction, member: IMember) {
        if (member.job === "" || member.job === "Unemployed") {
            await interaction.reply({ content: "You don't have a job. Apply for a job using </job apply:983096143284174858>. If you want to leave your business use </business leave:1048340073470513155>.", ephemeral: true });
            return;
        }

        await Member.updateOne({ id: member.id }, { $set: { job: "" } });
        await interaction.reply({ content: "You have successfully quit your job.", ephemeral: true });
    }
}