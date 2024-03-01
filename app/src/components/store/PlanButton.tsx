'use client';

import { Plan } from '@prisma/client';
import { Session } from 'next-auth';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type PlanButtonProps = {
    plan: Plan;
    session: Session | null;
};

export default function PlanButton({ plan, session }: PlanButtonProps) {
    const router = useRouter();
    const [isLoading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubscribe() {
        if (!session) {
            router.push('/login?url=/premium');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ variantId: plan.variantId }),
            });

            const data = await response.json();
            if (data.error) {
                setError(data.message);
            } else {
                setLoading(false);
            }

            window.location.href = data.url;
        } catch (err) {
            // eslint-disable-next-line quotes
            setError("Couldn't subscribe at the moment. Please try again later.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col justify-center items-center gap-2">
            <Button className="h-auto py-3 px-8" onClick={onSubscribe} disabled={isLoading}>
                Subscribe Now
            </Button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
    );
}
