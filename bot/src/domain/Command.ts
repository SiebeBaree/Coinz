import type { RESTPostAPIApplicationCommandsJSONBody, ChatInputCommandInteraction } from 'discord.js';
import type { IMember } from '../models/member';
import type { StructurePredicate } from '../utils/loaders';
import type Bot from './Bot';

type CommandData = RESTPostAPIApplicationCommandsJSONBody & {
    description: string;
    category: string;
    enabled?: boolean;
    deferReply?: boolean;
    cooldown?: number;
    extraFields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
    usage?: string[];
};

/**
 * Defines the structure of a command
 */
export type Command = {
    /**
     * The data for the command
     */
    data: CommandData;
    /**
     * The function to execute when the command is called
     *
     * @param client - The bot instance
     * @param interaction - The interaction of the command
     * @param member - The member who called the command
     */
    execute(client: Bot, interaction: ChatInputCommandInteraction, member: IMember): Promise<void>;
};

// Defines the predicate to check if an object is a valid Command type
export const predicate: StructurePredicate<Command> = (structure): structure is Command =>
    Boolean(structure) &&
    typeof structure === 'object' &&
    'data' in structure! &&
    'execute' in structure &&
    typeof structure.data === 'object' &&
    typeof structure.execute === 'function';
