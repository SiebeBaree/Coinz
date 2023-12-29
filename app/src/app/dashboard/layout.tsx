import React from 'react';
import { getServerAuthSession } from '@/server/auth';
import DashboardSidebar from '@/components/nav/DashboardSidebar';
import DashboardNavbar from '@/components/nav/DashboardNavbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerAuthSession();
    if (!session) return null;

    return (
        <div className="h-full relative">
            <div
                className="hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-40 bg-accent text-accent-foreground w-72">
                <DashboardSidebar session={session} />
            </div>
            <main className="md:pl-72">
                <DashboardNavbar session={session} />
                {children}
            </main>
        </div>
    );
}
