import { parse } from 'path';

export default class {
    constructor(client, file) {
        this.client = client;
        this.file = file;
        this.name = parse(file).name;
        this.store = client.store;
    }

    async cool(command, member, cooldown) {
        if (await this.client.cooldown.isOnCooldown(member.id, command)) return true;
        await this.client.cooldown.setCooldown(member.id, command, cooldown);
        return false;
    }

    reload() {
        return this.store.load(this.file);
    }
}