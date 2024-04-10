/** @type {import('tailwindcss').Config} */
module.exports = {
    presets: [require('@repo/config/tailwind/tailwind.config.js')],
    content: ['./src/components/**/*.{ts,tsx}', './src/app/**/*.{ts,tsx}'],
};
