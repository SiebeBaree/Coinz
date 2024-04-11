import Footer from '@/components/nav/footer';
import Navbar from '@/components/nav/navbar';
import { auth } from '@/server/auth';
import React from 'react';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    return (
        <>
            <Navbar session={session} />
            <div
                className="pb-12"
                style={{
                    minHeight: 'calc(100vh - 60px - 276px)',
                }}
            >
                {children}
            </div>
            <Footer />
        </>
    );
}
