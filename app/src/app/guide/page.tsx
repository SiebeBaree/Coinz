import PageTitle from '@/components/PageTitle';
import { Button } from '@/components/ui/button';
import { ChevronRightIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';

export default function Guide() {
    return (
        <main className="container mx-auto px-5">
            <div className="flex flex-col md:flex-row justify-between md:gap-12 items-center">
                <PageTitle
                    watermark="Guide"
                    title="Guide"
                    description="Find quick answers to your questions about Coinz. Your question might already be answered here! If you can't find what you're looking for, contact us. We're here to help!"
                />

                <div className="flex flex-col items-center md:items-end flex-grow gap-2">
                    <h3 className="text-lg font-medium md:text-right w-[295px]">
                        Can&apos;t find what you&apos;re looking for?
                    </h3>
                    <Link href={'/support'} target="_blank">
                        <Button>
                            <PlusIcon className="w-4 h-4 mr-1" />
                            <p>Join our support server</p>
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-8">
                <GuideCard
                    title="Getting Started"
                    description="Discover the basics of Coinz and how to navigate its features. Ideal for new users starting their journey."
                    href="/getting-started"
                />
                <GuideCard
                    title="Installing Coinz"
                    description="Step-by-step instructions to successfully install Coinz in your server."
                    href="/installation"
                />
                <GuideCard
                    title="Coinz Plus/Pro"
                    description="Explore the advanced features and benefits of Coinz Plus and Pro, including premium features and benefits."
                    href="/premium"
                />
                <GuideCard
                    title="Leveling"
                    description="Learn about the leveling system in Coinz, how to gain levels, and the perks associated with each level."
                    href="/leveling"
                />
                <GuideCard
                    title="Starting a business"
                    description="Guidance on how to start and manage your business within Coinz."
                    href="/starting-a-business"
                />
                <GuideCard
                    title="Farming"
                    description="Insights into farming mechanics in Coinz, techniques for efficient farming, and maximizing your farming outputs."
                    href="/farming"
                />
                <GuideCard
                    title="Investing"
                    description="Advice on investment strategies within Coinz, understanding market trends, and managing your investment portfolio."
                    href="/investing"
                />
                <GuideCard
                    title="Frequently Asked Questions"
                    description="Answers to common questions about Coinz, covering a range of topics from basic usage to more complex queries."
                    href="/faq"
                />
            </div>
        </main>
    );
}

function GuideCard({ title, description, href }: { title: string; description: string; href: string }) {
    return (
        <div className="flex flex-col gap-3 bg-secondary rounded-md p-4">
            <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-muted text-sm mt-1">{description}</p>
            </div>
            <Link
                href={'/guide' + href ?? '/'}
                className="flex items-center text-sm text-primary ml-auto border-b border-transparent hover:border-primary transition-all duration-100 ease-in-out"
            >
                Visit the guide
                <ChevronRightIcon className="ml-1 h-4 w-4" />
            </Link>
        </div>
    );
}