const Event = require('../structures/Event.js');

module.exports = class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run(id) {
        this.logger.event(`Shard ${id + 1} reconnecting.`);
    }
};