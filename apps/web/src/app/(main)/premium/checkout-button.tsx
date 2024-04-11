'use client';

import { getCheckoutURL } from '@/actions/lemonsqueezy';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

type CheckoutButtonProps = {
    variantId: number;
};

export default function CheckoutButton({ variantId }: CheckoutButtonProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    return (
        <Button
            className="h-auto py-3 px-8"
            onClick={() => {
                startTransition(async () => {
                    const checkout = await getCheckoutURL(variantId);
                    if (checkout.success && checkout.checkoutUrl) {
                        router.push(checkout.checkoutUrl);
                    }
                });
            }}
            disabled={isPending}
        >
            Start Now!
        </Button>
    );
}
