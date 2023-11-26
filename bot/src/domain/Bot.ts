import { join } from 'node:path';
import { ClusterClient } from 'discord-hybrid-sharding';
import type { ClientOptions } from 'discord.js';
import { Client, Collection } from 'discord.js';
import config from '../data/config.json';
import Achievement from '../lib/achievement';
import Cooldown from '../lib/cooldown';
import Investment from '../lib/investment';
import Shop from '../lib/shop';
import { loadCommands, loadEvents } from '../utils/loaders';
import logger from '../utils/logger';
import { registerEvents } from '../utils/registerEvents';
import type { Command } from './Command';
import type { Event } from './Event';

export default class Bot extends Client {
    public commands: Collection<string, Command>;
    public events: Collection<string, Event>;
    public readonly cluster: ClusterClient<any>;
    public readonly cooldown: Cooldown;
    public readonly achievement: Achievement;
    public readonly items: Shop;
    public readonly investment: Investment;
    public readonly config: typeof config;

    public constructor(options: ClientOptions) {
        super(options);

        this.commands = new Collection();
        this.events = new Collection();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.cluster = new ClusterClient(this as any);

        this.cooldown = new Cooldown();
        this.config = config;
        this.achievement = new Achievement();
        this.items = new Shop();
        this.investment = new Investment();
    }

    public override async login(token: string): Promise<string> {
        if (this.items.all.size === 0) await this.items.fetchItems();

        const events = await loadEvents(join(__dirname, '../events'));
        this.commands = await loadCommands(join(__dirname, '../commands'));

        this.events = new Collection(events.map((event) => [event.name, event]));
        registerEvents(events, this);

        logger.debug(`Loaded ${this.commands.size} commands and ${this.events.size} events.`);
        return super.login(token);
    }
}
