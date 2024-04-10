import PageTitle from '../../../components/PageTitle';
import { getServerAuthSession } from '@/server/auth';
import { Session } from 'next-auth';
import { Plan } from '@prisma/client';
import Image from 'next/image';
import premiumJson from '@/lib/data/premium.json';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getProducts } from '@/server/payment';

type PremiumSubscription = { [key: string]: { checkout: string; logo: string; perks: string[] } };
const premium = premiumJson as PremiumSubscription;

export default async function PremiumPage() {
    const session = await getServerAuthSession();
    const products = await getProducts();

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
                    <SubscriptionCard key={product.id} session={session} plan={product} />
                ))}
            </div>
        </main>
    );
}

function SubscriptionCard({ session, plan }: { session: Session | null; plan: Plan }) {
    const premiumData = premium[plan.productId.toString()];
    if (!premiumData) {
        return null;
    }

    return (
        <div className="flex flex-col items-center bg-secondary rounded-md px-8 mt-12">
            <Image
                src={premiumData.logo}
                alt={`${plan.variantName} image`}
                width={120}
                height={120}
                className="select-none absolute -top-[60px] border-[10px] rounded-full border-background"
            />
            <h2 className="text-4xl font-bold mt-20">{plan.variantName}</h2>
            <h3 className="text-4xl text-primary font-bold mt-3 mb-6">
                ${plan.price / 100} <span className="text-muted text-base">/month</span>
            </h3>

            <div className="flex flex-col items-start gap-2 mb-8 w-full">
                {premiumData.perks.map((perk: string, index: number) => (
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
                    <Link href={premiumData.checkout + session.user.discordId}>
                        <Button className="h-auto py-3 px-8">Subscribe Now</Button>
                    </Link>
                ) : (
                    <Link href={'/login'}>
                        <Button className="h-auto py-3 px-8">Login</Button>
                    </Link>
                )}
            </div>
        </div>
    );
}
