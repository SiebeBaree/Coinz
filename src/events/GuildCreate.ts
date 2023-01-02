import { Guild } from "discord.js";
import IEvent from "../interfaces/IEvent";
import Bot from "../structs/Bot";

export default class Ready implements IEvent {
    public readonly name = "guildCreate";

    async execute(client: Bot, guild: Guild) {
        if (guild.available) {
            client.logger.info(`INVITE | Name: ${guild.name} | ID: ${guild.id} | Members: ${guild.memberCount}`);
        }
    }
}