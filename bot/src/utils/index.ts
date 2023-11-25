const FORMATTER = new Intl.NumberFormat('en-US', { notation: 'compact' });

export function getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function roundNumber(num: number, dec: number): number {
    const factor = Math.pow(10, dec);
    return Math.round((num + Number.EPSILON) * factor) / factor;
}

export async function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export function msToTime(ms: number): string {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0 || result.length > 0) result += `${hours}h `;
    if (minutes > 0 || result.length > 0) result += `${minutes}m `;
    if (seconds > 0 || result.length > 0) result += `${seconds}s`;
    return result || '0s';
}

export function parseStrToNum(str: string): number {
    try {
        if (/^[0-9]+$/.test(str)) return parseInt(str);

        if (str[str.length - 1] === 'k') {
            return Number(str.slice(0, -1)) * 1_000;
        } else if (str[str.length - 1] === 'M') {
            return Number(str.slice(0, -1)) * 1_000_000;
        } else if (/^\d+$/.test(str)) {
            // s consists only of digits, so it is already in base form
            return Number(str);
        } else {
            // s is invalid, so return NaN
            return NaN;
        }
    } catch {
        return NaN;
    }
}

export function formatNumber(num: number): string {
    return FORMATTER.format(num);
}

export function parsePlots(str: string): number[] {
    const segments = str.split(',');
    let result: Set<number> = new Set();

    for (let segment of segments) {
        if (segment.includes('-')) {
            const rangeParts = segment.split('-').map(Number);
            const start = rangeParts[0];
            const end = rangeParts[1];

            // Validate range
            if (start === undefined || end === undefined || isNaN(start) || isNaN(end)) {
                throw new Error(`"${segment}" is not a valid plot`);
            }

            // Handle reverse ranges
            if (start > end) {
                for (let i = end; i <= start; i++) {
                    result.add(i);
                }
            } else {
                for (let i = start; i <= end; i++) {
                    result.add(i);
                }
            }
        } else {
            const number = Number(segment);
            if (isNaN(number)) {
                throw new Error(`"${segment}" is not a valid plot`);
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