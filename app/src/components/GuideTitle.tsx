'use client';

import guides from '@/lib/data/guides.json';
import { notFound, usePathname } from 'next/navigation';
import PageTitle from '@/components/PageTitle';

export default function GuideTitle() {
    const pathname = usePathname();
    const guidePath = pathname.replace('/guide/', '');

    const guide = guides.find((g) => g.href === guidePath);
    if (!guide) return notFound();

    return <PageTitle title={guide.name} description={guide.description} />;
}
