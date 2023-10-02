/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn.discordapp.com',
                pathname: '/emojis/**',
            },
            {
                protocol: 'https',
                hostname: 'cdn.coinzbot.xyz',
                pathname: '/**',
            },
        ],
    },
}

module.exports = nextConfig
