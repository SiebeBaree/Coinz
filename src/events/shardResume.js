import Event from '../structures/Event.js';

export default class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run(id, replayedEvents) {
        if (replayedEvents > 1) this.logger.ready(`Shard ${id + 1} disconnected. Tries: ${replayedEvents}x`);
    }
};