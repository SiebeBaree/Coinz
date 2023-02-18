import IEvent from "../interfaces/IEvent";
import Bot from "../structs/Bot";

export default class Ready implements IEvent {
    public readonly name = "warn";

    async execute(client: Bot, info: string) {
        client.logger.warn(info);
    }
}