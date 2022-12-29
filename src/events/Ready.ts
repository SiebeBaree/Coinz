import IEvent from "../interfaces/IEvent";
import Bot from "../structs/Bot";

export default class Ready implements IEvent {
    public readonly name = "ready";

    async execute(client: Bot) {
        console.log(`Logged in as ${client.user?.tag}!`);
    }
}