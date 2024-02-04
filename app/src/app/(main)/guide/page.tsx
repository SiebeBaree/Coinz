import PageTitle from '@/components/PageTitle';
import { Button } from '@/components/ui/button';
import { ChevronRightIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';
import guides from '@/lib/data/guides.json';

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
                {guides.map((guide, index) => (
                    <GuideCard key={index} title={guide.name} description={guide.description} href={guide.href} />
                ))}
            </div>
        </main>
    );
}

function GuideCard({ title, description, href }: { title: string; description: string; href?: string }) {
    return (
        <div className="flex flex-col gap-3 bg-secondary rounded-md p-4">
            <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-muted text-sm mt-1">{description}</p>
            </div>
            {href ? (
                <Link
                    href={'/guide/' + href ?? '/'}
                    className="flex items-center text-sm text-primary ml-auto mt-auto border-b border-transparent hover:border-primary transition-all duration-100 ease-in-out"
                >
                    Visit the guide
                    <ChevronRightIcon className="ml-1 h-4 w-4" />
                </Link>
            ) : (
                <button className="flex items-center text-sm text-muted ml-auto mt-auto">
                    Coming Soon
                    <ChevronRightIcon className="ml-1 h-4 w-4" />
                </button>
            )}
        </div>
    );
}
