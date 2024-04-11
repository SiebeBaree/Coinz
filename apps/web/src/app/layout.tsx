import '@/styles/globals.css';

import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { env } from '@/env';
import Providers from '@/components/providers';
import PlausibleProvider from 'next-plausible';

const inter = Inter({
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: {
        template: 'Coinz - %s',
        default: 'Coinz',
    },
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
    authors: [{ name: 'Siebe Barée', url: 'https://siebebaree.com' }],
    creator: 'Siebe Barée',
    publisher: 'Coinz',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL(env.NEXT_PUBLIC_BASE_URL),
    alternates: {
        canonical: '/',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
        },
    },
    icons: {
        icon: [
            {
                url: '/favicon-16x16.png',
                sizes: '16x16',
                type: 'image/png',
            },
            {
                url: '/favicon-32x32.png',
                sizes: '32x32',
                type: 'image/png',
            },
        ],
        other: [
            {
                rel: 'mask-icon',
                url: '/safari-pinned-tab.svg',
                color: '#ffca21',
            },
        ],
    },
    openGraph: {
        type: 'website',
        siteName: 'Coinz',
        url: env.NEXT_PUBLIC_BASE_URL,
    },
    twitter: {
        card: 'summary',
        creator: '@Coinz',
    },
    other: {
        'msapplication-TileColor': '#ffca21',
    },
};

export const viewport: Viewport = {
    themeColor: '#26272f',
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <PlausibleProvider domain="coinzbot.xyz" selfHosted={true} />
            </head>
            <body className={cn('min-h-screen bg-background font-sans antialiased overflow-x-hidden', inter.className)}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
