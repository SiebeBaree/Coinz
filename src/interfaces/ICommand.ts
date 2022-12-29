/* eslint-disable semi */
import { APIApplicationCommandOption, APIEmbedField, CommandInteraction } from "discord.js";
import { IMember } from "../models/Member";

export default interface ICommand {
    readonly info: {
        name: string;
        description: string;
        options: APIApplicationCommandOption[];
        category: string;
        extraFields?: APIEmbedField[],
        examples?: string[];
        cooldown?: number;
        enabled?: boolean;
        deferReply?: boolean;
        isPremium?: boolean;
    };

    execute: (interaction: CommandInteraction, member: IMember) => Promise<void>;
}
