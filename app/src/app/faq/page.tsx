import faqItems from "../../lib/data/faq.json";
import FaqCard from "@/components/FaqCard";

interface FaqItem {
    title: string;
    description: string;
}

export default function FaqPage() {
    return (
        <main className="container mx-auto px-5">
            <div className="page-title">
                <h2 className="watermark">Questions</h2>
                <h1>Frequently Asked Questions</h1>
                <p>Find quick answers to your questions about Coinz. Your question might already be answered here!
                    If you can&apos;t find what you&apos;re looking for, contact us. We&apos;re here to help!</p>
            </div>

            <div className="flex flex-col gap-4">
                {faqItems.map((item: FaqItem) => (
                    <FaqCard key={item.title.toLowerCase().replace(" ", "_")} title={item.title}
                             description={item.description}/>
                ))}
            </div>
        </main>
    );
}