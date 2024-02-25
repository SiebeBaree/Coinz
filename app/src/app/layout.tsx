import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import GlobalProviders from '@/components/GlobalProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Coinz',
    description: 'A Discord bot with an economy system, stocks, crypto, poker, blackjack, roulette, and more!',
    generator: 'Coinz',
    applicationName: 'Coinz',
    referrer: 'origin-when-cross-origin',
    keywords: [
        'Coinz',
        'Discord',
        'Discord Bot',
        'Bot',
        'Dank Memer',
        'Economy',
        'Stocks',
        'Crypto',
        'Poker',
        'Blackjack',
        'Roulette',
        'Multiplayer',
        'Economy Bot',
    ],
    authors: { name: 'Coinz' },
    creator: 'SiebeBaree',
    publisher: 'Coinz',
    metadataBase: new URL('https://coinzbot.xyz'),
    alternates: {
        canonical: '/',
    },
    openGraph: {
        type: 'website',
        siteName: 'Coinz',
        url: 'https://coinzbot.xyz',
    },
    twitter: {
        card: 'summary',
        creator: '@Coinz',
    },
    icons: {
        apple: [
            {
                sizes: '180x180',
                url: '/apple-touch-icon.png',
                type: 'image/png',
            },
        ],
        other: [
            {
                rel: 'mask-icon',
                url: '/safari-pinned-tab.svg',
                color: '#5bbad5',
            },
        ],
    },
};

export const viewport: Viewport = {
    themeColor: '#26272f',
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <GlobalProviders>{children}</GlobalProviders>
            </body>
        </html>
    );
}
