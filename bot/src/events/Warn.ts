import IEvent from "../domain/IEvent";
import Bot from "../domain/Bot";

export default class Warn implements IEvent {
    public readonly name = "warn";
    public readonly once = false;

    async execute(client: Bot, info: string) {
        client.logger.warn(info);
    }
}