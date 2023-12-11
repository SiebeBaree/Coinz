import { setTimeout } from 'node:timers';
import type {
    ButtonInteraction,
    ChannelSelectMenuInteraction,
    ChatInputCommandInteraction,
    MentionableSelectMenuInteraction,
    RoleSelectMenuInteraction,
    StringSelectMenuInteraction,
    UserSelectMenuInteraction,
} from 'discord.js';

const FORMATTER = new Intl.NumberFormat('en-US', { notation: 'compact' });

export function getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function roundNumber(num: number, dec: number): number {
    const factor = 10 ** dec;
    return Math.round((num + Number.EPSILON) * factor) / factor;
}

export async function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export function msToTime(ms: number): string {
    const days = Math.floor(ms / (1_000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1_000 * 60 * 60 * 24)) / (1_000 * 60 * 60));
    const minutes = Math.floor((ms % (1_000 * 60 * 60)) / (1_000 * 60));
    const seconds = Math.floor((ms % (1_000 * 60)) / 1_000);

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0 || result.length > 0) result += `${hours}h `;
    if (minutes > 0 || result.length > 0) result += `${minutes}m `;
    if (seconds > 0 || result.length > 0) result += `${seconds}s`;
    return result || '0s';
}

export function parseStrToNum(str: string): number {
    try {
        if (/^\d+$/.test(str)) return Number.parseInt(str, 10);

        if (str.endsWith('k')) {
            return Number(str.slice(0, -1)) * 1_000;
        } else if (str.endsWith('M')) {
            return Number(str.slice(0, -1)) * 1_000_000;
        } else if (/^\d+$/.test(str)) {
            // s consists only of digits, so it is already in base form
            return Number(str);
        } else {
            // s is invalid, so return NaN
            return Number.NaN;
        }
    } catch {
        return Number.NaN;
    }
}

export function formatNumber(num: number): string {
    return FORMATTER.format(num);
}

export function parsePlots(str: string): number[] {
    const segments = str.split(',');
    const result: Set<number> = new Set();

    for (const segment of segments) {
        if (segment.includes('-')) {
            const rangeParts = segment.split('-').map(Number);
            const start = rangeParts[0];
            const end = rangeParts[1];

            // Validate range
            if (start === undefined || end === undefined || Number.isNaN(start) || Number.isNaN(end)) {
                throw new Error(`"${segment}" is not a valid plot`);
            }

            // Handle reverse ranges
            if (start > end) {
                for (let plot = end; plot <= start; plot++) {
                    result.add(plot);
                }
            } else {
                for (let plot = start; plot <= end; plot++) {
                    result.add(plot);
                }
            }
        } else {
            const number = Number(segment);
            if (Number.isNaN(number)) {
                throw new TypeError(`"${segment}" is not a valid plot`);
            }

            result.add(number);
        }
    }

    return Array.from(result).sort((a, b) => a - b);
}

export function getLevel(experience: number): number {
    return Math.floor(experience / 100);
}

export function getExperience(level: number): number {
    return level * 100;
}

type CollectorInteraction =
    | ButtonInteraction
    | ChannelSelectMenuInteraction
    | MentionableSelectMenuInteraction
    | RoleSelectMenuInteraction
    | StringSelectMenuInteraction
    | UserSelectMenuInteraction;

export function filter(interaction: ChatInputCommandInteraction, collectorInteraction: CollectorInteraction) {
    return collectorInteraction.user.id === interaction.user.id;
}
