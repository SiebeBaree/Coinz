import type { PathLike } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { Collection } from 'discord.js';
import type { Command } from '../domain/Command';
import { predicate as commandPredicate } from '../domain/Command';
import type { Event } from '../domain/Event';
import { predicate as eventPredicate } from '../domain/Event';

/**
 * A predicate to check if the structure is valid
 */
export type StructurePredicate<T> = (structure: unknown) => structure is T;

/**
 * Loads all the structures in the provided directory
 *
 * @param dir - The directory to load the structures from
 * @param predicate - The predicate to check if the structure is valid
 * @param recursive - Whether to recursively load the structures in the directory
 * @returns
 */
export async function loadStructures<T>(
    dir: PathLike,
    predicate: StructurePredicate<T>,
    recursive = true,
): Promise<T[]> {
    // Get the stats of the directory
    const statDir = await stat(dir);

    // If the provided directory path is not a directory, throw an error
    if (!statDir.isDirectory()) {
        throw new Error(`The directory '${dir}' is not a directory.`);
    }

    // Get all the files in the directory
    const files = await readdir(dir);

    // Create an empty array to store the structures
    const structures: T[] = [];

    // Loop through all the files in the directory
    for (const file of files) {
        if (files.includes('index.js') && file !== 'index.js') {
            continue;
        }

        // Get the stats of the file
        const statFile = await stat(join(dir.toString(), file));

        // If the file is a directory and recursive is true, recursively load the structures in the directory
        if (statFile.isDirectory() && recursive) {
            structures.push(...(await loadStructures(`${dir}/${file}`, predicate, recursive)));
            continue;
        }

        // If the does not end with .js, skip the file
        if (!file.endsWith('.js')) {
            continue;
        }

        // Import the structure dynamically from the file
        const structure = (await import(`${dir}/${file}`)).default;

        // If the structure is a valid structure, add it
        if (predicate(structure)) structures.push(structure);
    }

    return structures;
}

export async function loadCommands(dir: PathLike, recursive = true): Promise<Collection<string, Command>> {
    return (await loadStructures(dir, commandPredicate, recursive)).reduce(
        (acc, cur) => acc.set(cur.data.name, cur),
        new Collection<string, Command>(),
    );
}

export async function loadEvents(dir: PathLike, recursive = true): Promise<Event[]> {
    return loadStructures(dir, eventPredicate, recursive);
}
