import PageTitle from '@/components/page-title';
import { auth } from '@/server/auth';
import { Session } from 'next-auth';
import Image from 'next/image';
import products from '@/lib/data/products.json';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types';
import { db } from '@/server/db';
import Link from 'next/link';
import CheckoutButton from './checkout-button';

export const dynamic = 'force-dynamic';

export default async function PremiumPage() {
    const session = await auth();

    let hasAccount = false;
    let alreadySubscribed = false;
    if (session) {
        const member = await db.members.findFirst({
            where: {
                userId: session.user.discordId,
            },
        });

        alreadySubscribed = (member?.premium ?? 0) > 0;
        hasAccount = member !== null;
    }

    return (
        <main className="container mx-auto px-5">
            <PageTitle
                title="Premium"
                description="Discover the exclusive benefits of Coinz Plus and Coinz Pro, our premium subscriptions for the Coinz Discord bot. Gain access to more features and priority support!"
            />

            <div
                className="grid gap-4 mb-12 mt-4"
                style={{
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                }}
            >
                {products.map((product) => (
                    <SubscriptionCard
                        key={product.variantId}
                        session={session}
                        product={product}
                        hasAccount={hasAccount}
                        alreadySubscribed={alreadySubscribed}
                    />
                ))}
            </div>

            <div className="flex flex-col justify-center items-center gap-3 p-4 rounded-md bg-secondary h-56">
                <p className="text-2xl font-semibold">Want to support Coinz even more? Consider donating!</p>
                <Link href="/donate">
                    <Button className="px-12">Donate</Button>
                </Link>
            </div>
        </main>
    );
}

function SubscriptionCard({
    session,
    product,
    hasAccount,
    alreadySubscribed,
}: {
    session: Session | null;
    product: Product;
    hasAccount: boolean;
    alreadySubscribed: boolean;
}) {
    return (
        <div className="flex flex-col items-center bg-secondary rounded-md px-8 mt-12 relative">
            <Image
                src={product.logo}
                alt={`${product.name} image`}
                width={120}
                height={120}
                className="select-none absolute -translate-y-1/2 border-[10px] rounded-full border-background"
            />
            <h2 className="text-4xl font-bold mt-20">{product.name}</h2>
            <h3 className="text-4xl text-primary font-bold mt-3 mb-12">
                ${product.price.monthly} <span className="text-muted text-base">/month</span>
            </h3>

            <div className="flex flex-col items-start gap-3 mb-12 w-full">
                {product.features.map((perk: string, index: number) => (
                    <div key={index} className="flex gap-2 items-center">
                        <Check className="text-primary h-5" />
                        <p key={perk} className="">
                            {perk}
                        </p>
                    </div>
                ))}
            </div>

            <div className="flex-grow flex flex-col justify-end mb-6">
                {session ? (
                    hasAccount ? (
                        alreadySubscribed ? (
                            <Link href="/billing">
                                <Button className="h-auto py-3 px-8">Go to Billing</Button>
                            </Link>
                        ) : (
                            <CheckoutButton variantId={product.variantId} />
                        )
                    ) : (
                        <p className="text-red-400 font-medium">You need to have used Coinz before!</p>
                    )
                ) : (
                    <Link href={`/login?url=${encodeURIComponent(`/premium`)}`}>
                        <Button className="h-auto py-3 px-8">Subscribe Now</Button>
                    </Link>
                )}
            </div>
        </div>
    );
}
