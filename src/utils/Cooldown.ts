import Database from "./Database";
import CooldownModel from "../models/Cooldown";

export default class Cooldown {
    static async hasCooldown(userId: string, command: string): Promise<boolean> {
        const cooldown = await Database.getCooldown(userId, command);

        if (cooldown) {
            const now = Math.floor(Date.now() / 1000);
            return now < cooldown.expires;
        }

        return false;
    }

    static async setCooldown(userId: string, command: string, seconds: number): Promise<void> {
        await CooldownModel.findOneAndUpdate(
            { id: userId, command: command },
            { $set: { expires: Math.floor(Date.now() / 1000) + seconds } },
            { upsert: true },
        );
    }

    static async removeCooldown(userId: string, command: string): Promise<void> {
        await CooldownModel.deleteOne({ id: userId, command: command });
    }

    static async getRemainingCooldown(userId: string, command: string): Promise<number> {
        const cooldown = await Database.getCooldown(userId, command);

        if (cooldown) {
            const remaining = cooldown.expires - Math.floor(Date.now() / 1000);
            return remaining > 0 ? remaining : 0;
        }

        return 0;
    }
}