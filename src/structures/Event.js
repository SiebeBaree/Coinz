import { parse } from 'path';

export default class {
    constructor(client, file) {
        this.client = client;
        this.file = file;
        this.name = parse(file).name;
        this.store = client.events;
    }

    reload() {
        return this.store.load(this.file);
    }
}