import Bot from "./Bot";

export default class Command {
    public client: Bot;
    public file: string;

    constructor(client: Bot, file: string) {
        this.client = client;
        this.file = file;
    }
}