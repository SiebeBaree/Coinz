import Event from '../structures/Event.js';

export default class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run(error, shardId) {
        this.logger.error(`Shard ${shardId + 1} with error:\n${error.message}`);
    }
};