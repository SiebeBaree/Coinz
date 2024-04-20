import type { RESTPostAPIApplicationCommandsJSONBody, CommandInteraction } from 'discord.js';
import type { StructurePredicate } from '../utils/loaders';
import type Bot from './Bot';

type CommandData = RESTPostAPIApplicationCommandsJSONBody & {
    /**
     * The category of the command
     */
    enabled?: boolean;
    deferReply?: boolean;
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
     */
    execute(client: Bot, interaction: CommandInteraction): Promise<void> | void;
};

// Defines the predicate to check if an object is a valid Command type
export const predicate: StructurePredicate<Command> = (structure): structure is Command =>
    Boolean(structure) &&
    typeof structure === 'object' &&
    'data' in structure! &&
    'execute' in structure &&
    typeof structure.data === 'object' &&
    typeof structure.execute === 'function';
