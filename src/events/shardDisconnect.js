const Event = require('../structures/Event.js');

module.exports = class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run(event, id) {
        this.logger.warn(`Shard ${id + 1} disconnected. Reason: ${event.reason}`);
    }
};