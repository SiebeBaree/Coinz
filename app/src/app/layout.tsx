import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import Navbar from '@/components/nav/Navbar';
import GlobalProviders from '@/components/GlobalProviders';
import Footer from '@/components/Footer';
import { getServerAuthSession } from '@/server/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Coinz',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerAuthSession();

    return (
        <html lang="en">
            <body className={inter.className}>
                <GlobalProviders>
                    <Navbar session={session} />
                    <div
                        className="pb-12"
                        style={{
                            minHeight: 'calc(100vh - 60px - 310px)',
                        }}
                    >
                        {children}
                    </div>
                    <Footer />
                </GlobalProviders>
            </body>
        </html>
    );
}
