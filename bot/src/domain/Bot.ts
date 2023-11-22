import { Client, ClientOptions, Collection } from 'discord.js';
import type { Command } from './Command';
import type { Event } from './Event';
import { Logger } from 'winston';
import { ClusterClient } from 'discord-hybrid-sharding';
import logger from '../utils/logger';
import { registerEvents } from "../utils/registerEvents";
import { loadCommands, loadEvents } from '../utils/loaders';
import { join } from 'path';

export default class Bot extends Client {
    public commands: Collection<string, Command>;
    public events: Collection<string, Event>;
    public readonly cluster: ClusterClient<any>;
    public readonly logger: Logger;

    constructor(options: ClientOptions) {
        super(options);

        this.commands = new Collection();
        this.events = new Collection();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.cluster = new ClusterClient(this as any);

        this.logger = logger;
    }

    override async login(token: string): Promise<string> {
        const events = await loadEvents(join(__dirname, '../events'));
        this.commands = await loadCommands(join(__dirname, '../commands'));

        this.events = new Collection(events.map((event) => [event.name, event]));
        registerEvents(events, this);

        return await super.login(token);
    }
}
