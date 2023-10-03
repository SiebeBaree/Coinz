import { Collection } from "discord.js";
import IEvent from "./IEvent";
import Bot from "./Bot";
import Loader from "./FileLoader";

export default class EventHandler extends Loader {
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
            const event = new cmdFile.default() as IEvent;

            if (event.once) {
                this.client.once(event.name, (...args) => event.execute(this.client, ...args));
            } else {
                this.client.on(event.name, (...args) => event.execute(this.client, ...args));
            }

            events.set(event.name, event);
        }

        return events;
    }
}