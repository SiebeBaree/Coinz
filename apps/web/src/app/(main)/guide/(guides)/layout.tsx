import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import GuideTitle from './guide-title';
import styles from '@/styles/guide.module.css';

export default async function GuidesLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="container mx-auto px-5">
            <GuideTitle />

            <div id={styles.guide}>{children}</div>

            <div className="flex flex-col gap-2 items-center justify-center mt-8">
                <h3 className="text-xl font-semibold">Go back to all guides.</h3>
                <Link href={'/guide'}>
                    <Button>Overview</Button>
                </Link>
            </div>
        </div>
    );
}
