import { Client, ClientOptions, Collection } from "discord.js";
import { ClusterClient } from "discord-hybrid-sharding";
import Logger from "./Logger";
import winston from "winston";
import IEvent from "./IEvent";
import EventHandler from "./EventHandler";
import ICommand from "./ICommand";
import CommandHandler from "./CommandHandler";
import { createClient, RedisClientType } from "redis";
import config from "../data/config.json";

export default class Bot extends Client {
    public commands: Collection<string, ICommand>;
    public events: Collection<string, IEvent>;
    public readonly cluster;
    public readonly logger: winston.Logger;
    public readonly redisClient: RedisClientType;
    public readonly config: typeof config;

    constructor(options: ClientOptions) {
        super(options);

        this.commands = new Collection();
        this.events = new Collection();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.cluster = new ClusterClient(this as any);

        const logger = new Logger();
        this.logger = logger.logger;

        this.redisClient = createClient({
            url: process.env.REDIS_URL
        });

        this.config = config;
    }

    async login(token?: string | undefined): Promise<string> {
        const eventHandler = new EventHandler(this);
        this.events = await eventHandler.load();

        const commandHandler = new CommandHandler(this);
        this.commands = await commandHandler.load();

        this.logger.info(`Loaded ${this.commands.size} commands and ${this.events.size} events.`);
        return await super.login(token);
    }
}