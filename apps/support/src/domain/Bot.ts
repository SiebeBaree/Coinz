import { join } from 'node:path';
import type { ClientOptions } from 'discord.js';
import { Client, Collection } from 'discord.js';
import config from '../data/config.json';
import { loadCommands, loadEvents } from '../utils/loaders';
import logger from '../utils/logger';
import { registerEvents } from '../utils/registerEvents';
import type { Command } from './Command';
import type { Event } from './Event';

export default class Bot extends Client {
    public commands: Collection<string, Command>;
    public events: Collection<string, Event>;
    public readonly config: typeof config;

    public constructor(options: ClientOptions) {
        super(options);

        this.commands = new Collection();
        this.events = new Collection();

        this.config = config;
    }

    public override async login(token: string): Promise<string> {
        const events = await loadEvents(join(__dirname, '../events'));
        this.commands = await loadCommands(join(__dirname, '../commands'));

        this.events = new Collection(events.map((event) => [event.name, event]));
        registerEvents(events, this);

        logger.debug(`Loaded ${this.commands.size} commands and ${this.events.size} events.`);
        return super.login(token);
    }
}
