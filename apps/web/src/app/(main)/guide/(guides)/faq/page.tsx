import faqItems from '@/lib/data/faq.json';
import FaqCard from './faq-card';

export const dynamic = 'force-static';

export default function FaqGuide() {
    return (
        <>
            <div className="flex flex-col gap-2 sm:gap-3">
                {faqItems.map((item) => (
                    <FaqCard
                        key={item.title.toLowerCase().replace(' ', '_')}
                        title={item.title}
                        description={item.description}
                    />
                ))}
            </div>
        </>
    );
}
