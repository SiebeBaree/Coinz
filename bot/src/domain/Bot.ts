import { Client, ClientOptions, Collection } from "discord.js";
import { ClusterClient } from "discord-hybrid-sharding";
import Logger from "./Logger";
import winston from "winston";
import IEvent from "./IEvent";
import EventHandler from "./EventHandler";
import ICommand from "./ICommand";
import CommandHandler from "./CommandHandler";
import config from "../data/config.json";
import Cooldown from "../lib/Cooldown";
import Achievement from "../lib/Achievement";
import Shop from "../lib/Shop";

export default class Bot extends Client {
    public commands: Collection<string, ICommand>;
    public events: Collection<string, IEvent>;
    public readonly cluster;
    public readonly logger: winston.Logger;
    public readonly cooldown: Cooldown;
    public readonly config: typeof config;
    public readonly achievement: Achievement;
    public readonly items: Shop;

    constructor(options: ClientOptions) {
        super(options);

        this.commands = new Collection();
        this.events = new Collection();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.cluster = new ClusterClient(this as any);

        const logger = new Logger();
        this.logger = logger.logger;
        this.cooldown = new Cooldown();
        this.config = config;
        this.achievement = new Achievement();
        this.items = new Shop(this.logger);
    }

    async login(token?: string | undefined): Promise<string> {
        if (this.items.all.size === 0) await this.items.fetchItems();

        const eventHandler = new EventHandler(this);
        this.events = await eventHandler.load();

        const commandHandler = new CommandHandler(this);
        this.commands = await commandHandler.load();

        this.logger.debug(`Loaded ${this.commands.size} commands and ${this.events.size} events.`);
        return await super.login(token);
    }
}