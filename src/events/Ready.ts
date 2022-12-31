import IEvent from "../interfaces/IEvent";
import Bot from "../structs/Bot";

export default class Ready implements IEvent {
    public readonly name = "ready";

    async execute(client: Bot) {
        client.logger.info(`Cluster ${client.cluster?.id} is ready!`);
    }
}