const FORMATTER = new Intl.NumberFormat("en-US", { notation: "compact" });

export default class Utils {
    static getRandomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static wait(timeout: number): Promise<void> {
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
                return Number(number);
            } else {
                return NaN;
            }
        } catch {
            return NaN;
        }
    }

    static formatNumber(number: number): string {
        return FORMATTER.format(number);
    }

    static parseNumbers(numberStr: string): number[] {
        // remove all bad characters
        numberStr = numberStr.replace(/[^0-9,-]/g, "");
        const numbers: Set<number> = new Set();

        numberStr.split(",").forEach(commaSeparated => {
            if (!commaSeparated) return;
            const hyphenNumbers = commaSeparated.split("-");
            if (hyphenNumbers.length === 2) {
                const start = parseInt(hyphenNumbers[0], 10);
                const end = parseInt(hyphenNumbers[1], 10);
                for (let i = start; i <= end; i++) {
                    numbers.add(i);
                }
            } else {
                numbers.add(parseInt(hyphenNumbers[0], 10));
            }
        });
        return Array.from(numbers);
    }
}