import process from 'node:process';
import Redis from 'ioredis';

export default class Cooldown {
    public readonly redis: Redis | undefined;

    public constructor() {
        if (process.env.NODE_ENV === 'production') {
            this.redis = new Redis({
                maxRetriesPerRequest: 3,
            });
        }
    }

    public async setCooldown(userId: string, commandName: string, cooldown: number): Promise<void> {
        if (!this.redis) return;
        await this.redis.set(
            `cooldown:${userId}:${commandName}`,
            Math.floor(Date.now() / 1_000) + cooldown,
            'EX',
            cooldown,
        );
    }

    public async getCooldown(userId: string, commandName: string): Promise<string | null> {
        if (!this.redis) return null;
        return this.redis.get(`cooldown:${userId}:${commandName}`);
    }

    public async deleteCooldown(userId: string, commandName: string): Promise<void> {
        if (!this.redis) return;
        await this.redis.del(`cooldown:${userId}:${commandName}`);
    }
}
