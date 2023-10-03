import Loader from "./FileLoader";
import { Collection } from "discord.js";
import Bot from "./Bot";
import ICommand from "./ICommand";
import { readdirSync } from "fs";

export default class CommandHandler extends Loader {
    private readonly client: Bot;

    constructor(client: Bot, path = "/commands/", privateFolders: string[] = []) {
        super();
        this.client = client;

        const directories = this.getDirectories(path, privateFolders);
        for (const directory of directories) {
            super.addFiles(this.getFiles(directory));

            const entries = readdirSync(this.getFullPath(directory), { withFileTypes: true });
            for (const file of entries) {
                if (file.isDirectory()) {
                    super.addFile(directory + "/" + file.name + "/");
                }
            }
        }
    }

    public async load(directory?: string): Promise<Collection<string, ICommand>> {
        const files = directory ? this.getFiles(directory) : this.files;
        const commands = new Collection<string, ICommand>();

        for (const file of files) {
            const cmdFile = await import(super.getFullPath(file));
            const command = new cmdFile.default(this.client) as ICommand;

            // if (command.info.enabled === false) continue;
            commands.set(command.info.name, command);
        }

        return commands;
    }
}