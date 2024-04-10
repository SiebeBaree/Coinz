/** @type {import("tailwindcss").Config} */
module.exports = {
    darkMode: ['class'],
    content: ['./components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
            colors: {
                background: 'var(--color-background)',
                foreground: 'var(--color-text)',
                primary: {
                    DEFAULT: 'var(--color-selected)',
                    foreground: 'var(--color-text-dark)',
                },
                secondary: 'var(--color-background-soft)',
                muted: 'var(--color-text-soft)',
                highlight: 'var(--color-highlight)',
            },
            borderWidth: {
                highlight: '1px',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: 0 },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: 0 },
                },
            },
            borderColor: (theme: (arg: string) => any) => ({
                ...theme('colors'),
                highlight: theme('colors.highlight'),
            }),
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
