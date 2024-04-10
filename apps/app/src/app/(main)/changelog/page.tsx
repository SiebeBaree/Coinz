import changelog from '@/lib/data/changelog.json';
import ChangelogSection from '@/app/(main)/changelog/ChangelogSection';
import { Changelog } from '@/lib/interfaces';
import PageTitle from '@/components/PageTitle';

export default function ChangelogPage() {
    changelog.sort((a: Changelog, b: Changelog) => b.timestamp - a.timestamp);

    return (
        <main className="container mx-auto px-5">
            <PageTitle
                title="Changelog"
                description="Don't miss out on the latest updates. Stay informed about new features and bug fixes. If you have a question about a certain update, contact us. We'''re here to help!"
            />
            <ChangelogSection data={changelog} />
        </main>
    );
}
