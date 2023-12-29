import React from 'react';
import Navbar from '@/components/nav/Navbar';
import Footer from '@/components/Footer';
import { getServerAuthSession } from '@/server/auth';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerAuthSession();

    return (
        <div>
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
        </div>
    );
}
