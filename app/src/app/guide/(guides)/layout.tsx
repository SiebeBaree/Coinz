import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function GuidesLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            {children}

            <div className="flex flex-col gap-2 items-center justify-center mt-8">
                <h3 className="text-xl font-semibold">Go back to all guides.</h3>
                <Link href={'/guide'}>
                    <Button>Overview</Button>
                </Link>
            </div>
        </div>
    );
}
