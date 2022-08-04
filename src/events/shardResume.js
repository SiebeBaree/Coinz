const Event = require('../structures/Event.js');

module.exports = class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run(id, replayedEvents) {
        this.logger.ready(`Shard ${id + 1} disconnected. Tries: ${replayedEvents}x`);
    }
};