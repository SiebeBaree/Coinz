import React from 'react';
import DashboardSidebar from '@/components/nav/DashboardSidebar';
import DashboardNavbar from '@/components/nav/DashboardNavbar';
import { auth } from '@/server/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session) return redirect(`/login?url=${encodeURIComponent('/dashboard')}`);

    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-40 bg-card text-card-foreground w-72">
                <DashboardSidebar session={session} />
            </div>
            <main className="md:pl-72">
                <DashboardNavbar session={session} />
                <div className="p-4">{children}</div>
            </main>
        </div>
    );
}
