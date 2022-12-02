import { Collection } from 'discord.js';
import { join, sep } from 'path';
import glob from 'fast-glob';

export default class extends Collection {
    constructor(client, name) {
        super();

        this.client = client;
        this.name = name;
        this.dir = `${process.cwd()}${sep}src${sep}${name}`;
    }

    set(flake) {
        let { name } = flake;

        if (this.has(name)) this.delete(name);

        super.set(name, flake);
        return flake;
    }

    delete(name) {
        return !this.has(name) ? false : super.delete(name);
    }

    async load(file) {
        let filePath = join(this.dir, file);

        try {
            const { default: command } = await import(filePath);
            let flake = this.set(new command(this.client, file));
            return flake;
        } catch (e) {
            this.client.logger.error(`Failed to load ${this.name.slice(0, -1)} (${filePath})\n${e.stack || e}`);
            return null;
        }
    }

    async loadFiles() {
        this.clear();
        await this.walkFiles();
        return this.size;
    }

    async walkFiles() {
        let files = await glob('**.js', { cwd: this.dir });
        return Promise.all(files.map(file => this.load(file)));
    }
}