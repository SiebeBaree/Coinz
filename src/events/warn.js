import Event from '../structures/Event.js';

export default class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run(info) {
        this.logger.warn(info);
    }
};