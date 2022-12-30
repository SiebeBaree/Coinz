import { Client, ClientOptions, Collection } from "discord.js";
import CommandHandler from "../handlers/CommandHandler";
import EventHandler from "../handlers/EventHandler";
import ICommand from "../interfaces/ICommand";
import IEvent from "../interfaces/IEvent";
import config from "../assets/config.json";
import { ClusterClient } from "discord-hybrid-sharding";

export default class Bot extends Client {
    public commands: Collection<string, ICommand>;
    public events: Collection<string, IEvent>;
    private _config = config;
    public cluster;

    constructor(options: ClientOptions, clusterLess = false) {
        super(options);

        this.commands = new Collection();
        this.events = new Collection();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!clusterLess) this.cluster = new ClusterClient(this as any);
    }

    get ping(): number {
        return this.ws.ping;
    }

    get config() {
        return this._config;
    }

    async login(token?: string | undefined): Promise<string> {
        const commandHandler = new CommandHandler(this);
        const eventHandler = new EventHandler(this);

        this.commands = await commandHandler.load();
        this.events = await eventHandler.load();
        console.log(`Loaded ${this.commands.size} commands and ${this.events.size} events.`);
        return await super.login(token);
    }
}