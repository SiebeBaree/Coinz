'use client';

import premium from '@/lib/data/premium.json';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Subscription {
    name: string;
    price: {
        monthly: number;
        quarterly: number;
    };
    logo: string;
    perks: string[];
}

export default function PremiumClient() {
    const [priceDuration, setPriceDuration] = useState<'monthly' | 'quarterly'>('monthly');
    const subscriptions = Object.keys(premium) as Array<keyof typeof premium>;

    return (
        <div>
            <div className="flex justify-center mb-8">
                <div className="bg-secondary rounded-md flex relative items-center p-1 text-center w-[300px]">
                    <div
                        className="rounded-md absolute bg-primary transition-all duration-300 ease-in-out"
                        style={{
                            top: '6px',
                            left: priceDuration === 'monthly' ? '6px' : 'calc(50% + 6px)',
                            height: 'calc(100% - 12px)',
                            width: 'calc(50% - 12px)',
                        }}
                    ></div>
                    <button
                        onClick={() => setPriceDuration('monthly')}
                        className={cn(
                            'w-full font-medium rounded-md py-2 transition-all duration-200 ease-in-out',
                            priceDuration === 'monthly' && 'text-primary-foreground',
                        )}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setPriceDuration('quarterly')}
                        className={cn(
                            'w-full font-medium rounded-md py-2 transition-all duration-200 ease-in-out',
                            priceDuration === 'quarterly' && 'text-primary-foreground',
                        )}
                    >
                        Quarterly
                    </button>
                </div>
            </div>

            <div
                className="grid gap-4 mb-12 mt-4"
                style={{
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                }}
            >
                {subscriptions.map((key) => (
                    <SubscriptionCard key={key} subscription={premium[key]} price={priceDuration} />
                ))}
            </div>
        </div>
    );
}

function SubscriptionCard({ subscription, price }: { subscription: Subscription; price: 'monthly' | 'quarterly' }) {
    const [loading, setLoading] = useState<boolean>(false);

    async function onSubscribe() {
        try {
            setLoading(true);
            const response = await fetch('/api/stripe');

            if (!response.ok) {
                console.error('[STRIPE_CLIENT_ERROR]', response);
            }

            const data = await response.json();
            window.location.href = data.url;
        } catch (error) {
            console.error('[STRIPE_CLIENT_ERROR]', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-center bg-secondary rounded-md px-8 mt-12">
            <Image
                src={subscription.logo}
                alt={`${subscription.name} logo`}
                width={120}
                height={120}
                className="select-none absolute -top-[60px] border-[10px] rounded-full border-background"
            />
            <h2 className="text-4xl font-bold mt-20">{subscription.name}</h2>
            <h3 className="text-4xl text-primary font-bold mt-3 mb-6">
                ${subscription.price[price] / 100}{' '}
                <span className="text-muted text-base">/{price === 'quarterly' ? '3 months' : 'month'}</span>
            </h3>

            <div className="flex flex-col items-start gap-2 mb-8 w-full">
                {subscription.perks.map((perk: string, index: number) => (
                    <div key={index} className="flex gap-2 items-center">
                        <Check className="text-primary h-5" />
                        <p key={perk} className="">
                            {perk}
                        </p>
                    </div>
                ))}
            </div>

            <div className="flex-grow flex flex-col justify-end mb-6">
                <Button className="h-auto py-3 px-8" onClick={onSubscribe} disabled={loading}>
                    Subscribe Now
                </Button>
            </div>
        </div>
    );
}
