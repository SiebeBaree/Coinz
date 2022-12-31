const FORMATTER = new Intl.NumberFormat("en-US", { notation: "compact" });

export default class Helpers {
    static getRandomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static getTimeout(timeout: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, timeout));
    }

    static msToTime(duration: number): string {
        const days = Math.floor(duration / (1000 * 60 * 60 * 24));
        const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((duration % (1000 * 60)) / 1000);

        let result = "";
        if (days > 0) result += `${days}d `;
        if (hours > 0 || result.length > 0) result += `${hours}h `;
        if (minutes > 0 || result.length > 0) result += `${minutes}m `;
        if (seconds > 0 || result.length > 0) result += `${seconds}s`;
        return result || "0s";
    }

    static roundNumber(number: number, decimals: number): number {
        const factor = Math.pow(10, decimals);
        return Math.round((number + Number.EPSILON) * factor) / factor;
    }

    static parseFormattedNumber(number: string): number {
        try {
            if (/^[0-9]+$/.test(number)) return parseInt(number);

            if (number[number.length - 1] === "k") {
                return Number(number.slice(0, -1)) * 1_000;
            } else if (number[number.length - 1] === "M") {
                return Number(number.slice(0, -1)) * 1_000_000;
            } else if (/^\d+$/.test(number)) {
                // s consists only of digits, so it is already in base form
                return Number(number);
            } else {
                // s is invalid, so return NaN
                return NaN;
            }
        } catch {
            return NaN;
        }
    }

    static formatNumber(number: number): string {
        return FORMATTER.format(number);
    }
}