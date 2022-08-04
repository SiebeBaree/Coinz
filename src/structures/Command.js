const path = require('path');

class Command {
    constructor(client, file) {
        this.client = client;
        this.file = file;
        this.name = path.parse(file).name;
        this.store = client.store;
    }

    async cool(command, member, cooldown) {
        if (await bot.cooldown.isOnCooldown(member.id, command)) return true;
        await bot.cooldown.setCooldown(member.id, command, cooldown);
        return false;
    }

    reload() {
        return this.store.load(this.file);
    }
}

module.exports = Command;