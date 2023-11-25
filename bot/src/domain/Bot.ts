import { join } from 'node:path';
import { ClusterClient } from 'discord-hybrid-sharding';
import type { ClientOptions } from 'discord.js';
import { Client, Collection } from 'discord.js';
import type { Logger } from 'winston';
import { loadCommands, loadEvents } from '../utils/loaders';
import logger from '../utils/logger';
import { registerEvents } from '../utils/registerEvents';
import type { Command } from './Command';
import type { Event } from './Event';

export default class Bot extends Client {
    public commands: Collection<string, Command>;
    public events: Collection<string, Event>;
    public readonly cluster: ClusterClient<any>;
    public readonly logger: Logger;

    public constructor(options: ClientOptions) {
        super(options);

        this.commands = new Collection();
        this.events = new Collection();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.cluster = new ClusterClient(this as any);

        this.logger = logger;
    }

    public override async login(token: string): Promise<string> {
        const events = await loadEvents(join(__dirname, '../events'));
        this.commands = await loadCommands(join(__dirname, '../commands'));

        this.events = new Collection(events.map((event) => [event.name, event]));
        registerEvents(events, this);

        return super.login(token);
    }
}
