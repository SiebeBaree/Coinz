/* eslint-disable semi */
import { CommandInteractionOption, APIEmbedField, ChatInputCommandInteraction } from "discord.js";
import { IGuild } from "../models/Guild";
import { IMember } from "../models/Member";

export interface Info {
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
    isPremium?: number;
    isServerUnlocked?: boolean;
    image?: string;
}

export default interface ICommand {
    readonly info: Info;
    execute: (interaction: ChatInputCommandInteraction, member: IMember, guild: IGuild) => Promise<void>;
}
