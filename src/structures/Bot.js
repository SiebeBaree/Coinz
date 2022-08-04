const { Client } = require('discord.js');
const Logger = require('./Logger.js');
const CommandStore = require('./CommandStore.js');
const EventStore = require('./EventStore.js');

class Bot extends Client {
    constructor(options = {}) {
        super(options);

        this.config = require('../assets/config.json');
        this.tools = require('../lib/utils');
        this.database = require('../lib/database');
        this.cooldown = require('../lib/cooldowns');
        this.logger = new Logger(this);
        this.commands = new CommandStore(this);
        this.events = new EventStore(this);
    }

    async login(token) {
        await Promise.all([
            this.events.loadFiles(),
            this.commands.loadFiles(),
            super.login(token)
        ]);
    }
}

module.exports = Bot;