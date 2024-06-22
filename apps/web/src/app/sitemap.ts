import { MetadataRoute } from 'next';
import guides from '@/lib/data/guides.json';
import { env } from '@/env';

export default function sitemap(): MetadataRoute.Sitemap {
    const pages = [
        'commands',
        'items',
        'premium',
        'terms-of-use',
        'privacy-policy',
        'investments',
        'changelog',
        'guide',
        'roadmap',
        'vote',
        'status',
    ];

    const routes: MetadataRoute.Sitemap = [];

    routes.push({
        url: env.NEXT_PUBLIC_BASE_URL,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
    });

    for (const page of pages) {
        routes.push({
            url: `${env.NEXT_PUBLIC_BASE_URL}/${page}`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        });
    }

    for (const guide of guides) {
        if (guide.href) {
            routes.push({
                url: `${env.NEXT_PUBLIC_BASE_URL}/guide/${guide.href}`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.5,
            });
        }
    }

    return routes;
}
