await import('./src/env.js');
import { withPlausibleProxy } from 'next-plausible';

/** @type {import("next").NextConfig} */
const config = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn.coinzbot.xyz',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'cdn.discordapp.com',
                pathname: '/emojis/**',
            },
            {
                protocol: 'https',
                hostname: 'cdn.discordapp.com',
                port: '',
                pathname: '/avatars/**',
            },
            {
                protocol: 'https',
                hostname: 'cdn.discordapp.com',
                port: '',
                pathname: '/embed/avatars/**',
            },
        ],
    },
    experimental: {
        optimizePackageImports: ['lucide-react'],
    },
};

export default withPlausibleProxy({
    customDomain: 'https://plausible.siebebaree.com',
})(config);
