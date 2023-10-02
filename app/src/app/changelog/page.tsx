import changelog from "@/lib/data/changelog.json";
import ChangelogSection from "@/app/changelog/ChangelogSection";
import { Changelog } from "@/lib/interfaces";

export default function ChangelogPage() {
    changelog.sort((a: Changelog, b: Changelog) => b.timestamp - a.timestamp);

    return (
        <main className="container mx-auto px-5">
            <div className="page-title">
                <h2 className="watermark">Changelog</h2>
                <h1>Changelog</h1>
                <p>Don&apos;t miss out on the latest updates. Stay informed about new features and bug fixes. If you
                    have a question about a certain update, contact us. We&apos;re here to help!</p>
            </div>

            <ChangelogSection data={changelog}/>
        </main>
    );
}

