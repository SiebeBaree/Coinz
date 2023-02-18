import { Collection } from "discord.js";
import IEvent from "../interfaces/IEvent";
import Bot from "../structs/Bot";
import Handler from "../structs/Handler";

export default class EventHandler extends Handler {
    private readonly client: Bot;

    constructor(client: Bot) {
        super();
        this.client = client;

        super.addFiles(this.getFiles("/events/"));
    }

    public async load(): Promise<Collection<string, IEvent>> {
        const events = new Collection<string, IEvent>();

        for (const file of super.files) {
            const cmdFile = await import(super.getFullPath(file));
            const event = new cmdFile.default();

            this.client.on(event.name, (...args) => event.execute(this.client, ...args));
            events.set(event.name, event);
        }

        return events;
    }
}