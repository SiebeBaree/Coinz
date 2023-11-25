import Redis from 'ioredis';

export default class Cooldown {
    public readonly redis: Redis;

    public constructor() {
        this.redis = new Redis({
            maxRetriesPerRequest: 3,
        });
    }

    public async setCooldown(userId: string, commandName: string, cooldown: number): Promise<void> {
        await this.redis.set(
            `cooldown:${userId}:${commandName}`,
            Math.floor(Date.now() / 1_000) + cooldown,
            'EX',
            cooldown,
        );
    }

    public async getCooldown(userId: string, commandName: string): Promise<string | null> {
        return this.redis.get(`cooldown:${userId}:${commandName}`);
    }

    public async deleteCooldown(userId: string, commandName: string): Promise<void> {
        await this.redis.del(`cooldown:${userId}:${commandName}`);
    }
}
