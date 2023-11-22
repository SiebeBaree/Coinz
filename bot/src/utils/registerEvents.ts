import type { Event } from '../domain/Event';
import type Bot from '../domain/Bot';

export function registerEvents(events: Event[], client: Bot): void {
    for (const event of [...events]) {
        client[event.once ? 'once' : 'on'](event.name, async (...args) => event.execute(client, ...args));
    }
}
