import Handler from "../structs/Handler.js";
import { Collection } from "discord.js";
import Bot from "../structs/Bot.js";
import ICommand from "../interfaces/ICommand.js";

export default class CommandHandler extends Handler {
    private readonly client: Bot;

    constructor(client: Bot, path = "/commands/", privateFolders: string[] = []) {
        super();
        this.client = client;

        const directories = this.getDirectories(path, privateFolders);
        for (const directory of directories) {
            super.addFiles(this.getFiles(directory));
        }
    }

    public async load(directory?: string): Promise<Collection<string, ICommand>> {
        const files = directory ? this.getFiles(directory) : super.files;
        const commands = new Collection<string, ICommand>();

        for (const file of files) {
            const cmdFile = await import(super.getFullPath(file));
            const command = new cmdFile.default(this.client, file);

            if (command.info.enabled === false) continue;
            commands.set(command.info.name, command);
        }

        return commands;
    }
}