import Footer from '@/components/nav/footer';
import Navbar from '@/components/nav/navbar';
import React from 'react';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Navbar />
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
