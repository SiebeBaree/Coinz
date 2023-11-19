import faqItems from "../../lib/data/faq.json";
import FaqCard from "@/components/FaqCard";
import PageTitle from "@/components/PageTitle";

interface FaqItem {
    title: string;
    description: string;
}

export default function FaqPage() {
    return (
        <>
            <PageTitle watermark="Questions" title="Frequently Asked Questions"
                       description="Find quick answers to your questions about Coinz. Your question might already be answered here! If you can't find what you're looking for, contact us. We're here to help!"/>

            <div className="flex flex-col gap-4">
                {faqItems.map((item: FaqItem) => (
                    <FaqCard key={item.title.toLowerCase().replace(" ", "_")} title={item.title}
                             description={item.description}/>
                ))}
            </div>
        </>
    );
}