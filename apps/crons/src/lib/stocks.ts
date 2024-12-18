import moment from 'moment-timezone';
import investments from '../data/investments.json';

const timezone = 'America/New_York';
const dateFormat = 'DD/MM/YYYY';
const timeFormat = 'HH:mm';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

export function isMarketOpen(): boolean {
    const now = moment.tz(Date.now(), timezone);
    const date = now.format(dateFormat);
    const openDateTime = moment.tz(`${date} ${investments.openingTime}`, dateTimeFormat, timezone);
    const closeDateTime = moment.tz(`${date} ${investments.closeTime}`, dateTimeFormat, timezone);

    return (
        now.isBetween(openDateTime, closeDateTime) &&
        !investments.marketCloseDays.includes(Number.parseInt(now.format('ddd'), 10))
    );
}

export function getExpireTime(): Date {
    const newYorkTime = moment.tz(timezone);
    const endOfDay = moment.tz(investments.closeTime, timeFormat, timezone);
    const startOfDay = moment.tz(investments.openingTime, timeFormat, timezone);

    newYorkTime.add(10, 'minutes');

    // If it's Saturday or Sunday, fast-forward to next Monday.
    while (newYorkTime.day() === 0 || newYorkTime.day() === 6) {
        newYorkTime.add(1, 'day');
    }

    // If before 9:30 AM, set to 9:30 AM of the same day.
    if (newYorkTime.isBefore(startOfDay)) {
        newYorkTime.hour(startOfDay.hour());
        newYorkTime.minute(startOfDay.minute());
    }
    // If after 4:00 PM, or it's a weekend, set to 9:30 AM of the next business day.
    else if (newYorkTime.isAfter(endOfDay)) {
        newYorkTime.add(1, 'day');
        while (newYorkTime.day() === 0 || newYorkTime.day() === 6) {
            newYorkTime.add(1, 'day');
        }

        newYorkTime.hour(startOfDay.hour());
        newYorkTime.minute(startOfDay.minute());
    }

    newYorkTime.set('second', 30);
    newYorkTime.set('millisecond', 0);

    return newYorkTime.toDate();
}

export function getChunks<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }

    return chunks;
}

export function calculatePercentageChange(current: number, previous: number): number {
    const change = ((current - previous) / previous) * 100;
    return Number.parseFloat(change.toFixed(2));
}
