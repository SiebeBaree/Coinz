import Store from './Store.js';
import { join } from 'path';

export default class extends Store {
    constructor(client) {
        super(client, 'commands');
    }

    get(name) {
        return super.get(name);
    }

    has(name) {
        return super.has(name);
    }

    set(command) {
        super.set(command);
        return command;
    }

    delete(command) {
        delete require.cache[join(this.dir, command.file)];
        super.delete(command.name);
    }

    clear() {
        for (let command of this.values()) {
            this.delete(command);
        }

        super.clear();
    }
}