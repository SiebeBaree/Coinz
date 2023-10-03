import IEvent from "../domain/IEvent";
import Bot from "../domain/Bot";

export default class Ready implements IEvent {
    public readonly name = "ready";
    public readonly once = true;

    async execute(client: Bot) {
        client.logger.info(`Cluster ${client.cluster?.id} is ready!`);
    }
}