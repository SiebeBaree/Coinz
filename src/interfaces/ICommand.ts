/* eslint-disable semi */
import { CommandInteractionOption, APIEmbedField, ChatInputCommandInteraction } from "discord.js";
import { IMember } from "../models/Member";

export default interface ICommand {
    readonly info: {
        name: string;
        description: string;
        helpDescription?: string;
        options: CommandInteractionOption[];
        category: string;
        extraFields?: APIEmbedField[],
        examples?: string[];
        cooldown?: number;
        enabled?: boolean;
        deferReply?: boolean;
        isPremium?: boolean;
        image?: string;
    };

    execute: (interaction: ChatInputCommandInteraction, member: IMember) => Promise<void>;
}
