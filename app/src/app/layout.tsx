import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import GlobalProviders from '@/components/GlobalProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Coinz',
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
