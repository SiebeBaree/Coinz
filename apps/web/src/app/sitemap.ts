import { MetadataRoute } from 'next';
import guides from '@/lib/data/guides.json';

export default function sitemap(): MetadataRoute.Sitemap {
    const url = 'https://coinzbot.xyz';

    const pages = [
        'commands',
        'items',
        'premium',
        'status',
        'terms-of-use',
        'privacy-policy',
        'investments',
        'changelog',
        'guide',
    ];

    const routes: MetadataRoute.Sitemap = [];

    routes.push({
        url: url,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 1,
    });

    for (const page of pages) {
        routes.push({
            url: `${url}/${page}`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        });
    }

    for (const guide of guides) {
        routes.push({
            url: `${url}/guide/${guide.href}`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        });
    }

    return routes;
}
