import Event from "../structures/Event.js"
import Guild from "../models/Guild.js"

export default class extends Event {
    constructor(...args) {
        super(...args);
    }

    async run() {
        this.logger.ready(`Cluster ${this.cluster.id} loaded.`);
    }
}