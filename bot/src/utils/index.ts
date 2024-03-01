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
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import countriesData from '../data/countries.json';
import type Bot from '../domain/Bot';
import type { Loot } from '../lib/types';
import Business from '../models/business';
import type { IMember } from '../models/member';
import { removeBetMoney } from './money';

const countries = new Map<string, string>(Object.entries(countriesData));
const FORMATTER = new Intl.NumberFormat('en-US', { notation: 'compact' });

export function feetToMeters(feet: number): number {
    return Math.round(feet / 3.280_84);
}

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
    let level = 0;
    while (experience >= experienceToNextLevel(level, 0)) {
        experience -= experienceToNextLevel(level, 0);
        level++;
    }

    return level;
}

export function experienceToNextLevel(lvl: number, xp: number): number {
    return Math.floor(3 * lvl ** 1.1 + 18 * lvl + 50 - xp);
}

export function getExperienceFromLevel(level: number): number {
    let xp = 0;
    for (let i = 0; i <= level; i++) {
        xp += experienceToNextLevel(i, 0);
    }

    return xp;
}

type CollectorInteraction =
    | ButtonInteraction
    | ChannelSelectMenuInteraction
    | MentionableSelectMenuInteraction
    | RoleSelectMenuInteraction
    | StringSelectMenuInteraction
    | UserSelectMenuInteraction;

export async function filter(interaction: ChatInputCommandInteraction, collectorInteraction: CollectorInteraction) {
    return collectorInteraction.user.id === interaction.user.id;
}

export function isValidCountryCode(code: string): boolean {
    return countries.has(code.toUpperCase());
}

export function getCountryEmote(code: string): string {
    if (!isValidCountryCode(code)) return '';
    return `:flag_${code.toLowerCase()}:`;
}

export function getCountryName(code: string): string {
    if (!isValidCountryCode(code)) return '';
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return countries.get(code.toUpperCase());
}

export function getCountryCode(name: string): string {
    for (const [code, countryName] of countries) {
        if (countryName.toLowerCase() === name.toLowerCase()) return code;
    }

    return '';
}

export function getRandomItems(items: string[], quantity: number): Loot {
    const loot: Loot = {};
    for (let i = 0; i < quantity; i++) {
        const item = items[getRandomNumber(0, items.length - 1)];
        if (item === undefined) continue;

        if (loot[item]) {
            loot[item]++;
        } else {
            loot[item] = 1;
        }
    }

    return loot;
}

export function getVotingRow() {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setLabel('Top.gg')
            .setStyle(ButtonStyle.Link)
            .setEmoji('<:topgg:990540015853506590>')
            .setURL('https://top.gg/bot/938771676433362955/vote'),
        new ButtonBuilder()
            .setLabel('Discordbotlist.com')
            .setStyle(ButtonStyle.Link)
            .setEmoji('<:dbl:990540323967103036>')
            .setURL('https://discordbotlist.com/bots/coinz/upvote'),
    );
}

export async function getBet(
    client: Bot,
    interaction: ChatInputCommandInteraction,
    member: IMember,
): Promise<{
    bet: number;
    error: string | null;
}> {
    const betStr = interaction.options.getString('bet', true);
    const maxBet =
        member.premium === 2
            ? client.config.bets.pro.max
            : member.premium === 1
              ? client.config.bets.plus.max
              : client.config.bets.free.max;
    let bet =
        member.premium === 2
            ? client.config.bets.pro.min
            : member.premium === 1
              ? client.config.bets.plus.min
              : client.config.bets.free.min;

    if (betStr.toLowerCase() === 'all' || betStr.toLowerCase() === 'max') {
        if (member.wallet <= bet) {
            await client.cooldown.deleteCooldown(interaction.user.id, interaction.commandName);
            return {
                bet: 0,
                error: "You don't have any money in your wallet to bet!",
            };
        }

        bet = Math.min(member.wallet, maxBet);
    } else {
        const newBet = await removeBetMoney(betStr, member);

        if (typeof newBet === 'string') {
            await client.cooldown.deleteCooldown(interaction.user.id, interaction.commandName);
            return {
                bet: 0,
                error: newBet,
            };
        }

        bet = newBet;
    }

    return {
        bet,
        error: null,
    };
}

export async function getBusiness(memberId: string) {
    const business = await Business.findOne({ 'employees.userId': memberId });
    if (!business) return null;

    const employee = business.employees.find((e) => e.userId === memberId);
    if (!employee) return null;

    return {
        business,
        employee,
    };
}

export function generateRandomString(length: number = 6): string {
    return Array.from({ length }, () => Math.random().toString(36)[2]).join('');
}
