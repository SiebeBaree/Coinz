import { auth } from '@/server/auth';
import { HardHatIcon } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function DashboardPage() {
    const session = await auth();
    if (session === null) return notFound();

    return (
        <main>
            <div className="flex items-center justify-center gap-4 h-96">
                <div className="h-16 w-16 bg-orange-500/10 rounded-md flex justify-center items-center">
                    <HardHatIcon size={32} className="text-orange-500" />
                </div>
                <p className="text-lg font-medium">We&apos;re still working on this page. Check back later!</p>
            </div>
        </main>
    );
}
