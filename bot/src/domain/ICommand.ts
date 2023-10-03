import { CommandInteractionOption, ChatInputCommandInteraction, APIEmbedField } from "discord.js";
import { IMember } from "../models/Member";

export interface Info {
    name: string;
    description: string;
    options: CommandInteractionOption[];
    category: string;
    extraFields?: APIEmbedField[],
    examples?: string[];
    cooldown?: number;
    enabled?: boolean;
    deferReply?: boolean;
    image?: string;
    adminServerOnly?: boolean;
}

export default interface ICommand {
    readonly info: Info;
    execute: (interaction: ChatInputCommandInteraction, member: IMember) => Promise<void>;
}
