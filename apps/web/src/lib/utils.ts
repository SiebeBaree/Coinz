import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function copyCode() {
    const codeElements = document.querySelectorAll('code');

    codeElements.forEach((element) => {
        element.addEventListener('click', () => {
            if (element.textContent != null) {
                navigator.clipboard.writeText(element.textContent).then(() => {
                    element.setAttribute('data-tooltip', 'Copied!');
                });
            }
        });

        element.addEventListener('mouseout', () => {
            element.setAttribute('data-tooltip', 'Click to copy');
        });
    });
}

export function formatNumber(num: number): {
    value: number;
    suffix: string;
} {
    // If the number is less than 20,000, return it as is
    if (num < 20000) {
        if (num >= 10000) {
            return {
                // Round the number to the nearest 1000
                value: Math.round(num / 1000) * 1000,
                suffix: '',
            };
        }

        if (num < 1000) {
            return {
                value: num,
                suffix: '',
            };
        }

        return {
            // Round the number to the nearest 100
            value: Math.round(num / 100) * 100,
            suffix: '',
        };
    }

    // Round the number to the nearest 10,000
    const rounded = Math.round(num / 10000) * 10000;

    // Format the number in 'K' or 'M'
    if (rounded < 1000000) {
        return {
            value: rounded / 1000,
            suffix: 'K',
        };
    }

    return {
        value: Math.round(rounded / 1000000),
        suffix: 'M',
    };
}
