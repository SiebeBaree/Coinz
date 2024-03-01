import { listProducts } from '@lemonsqueezy/lemonsqueezy.js';
import PageTitle from '../../../components/PageTitle';
import { getServerAuthSession } from '@/server/auth';
import { db } from '@/server/db';
import PlanButton from '@/components/store/PlanButton';
import { Session } from 'next-auth';
import { Plan } from '@prisma/client';
import Image from 'next/image';
import premiumJson from '@/lib/data/premium.json';
import { Check } from 'lucide-react';

const MAX_UPDATE_TIME = 1000 * 60 * 60 * 24;

type PremiumSubscription = { [key: string]: { logo: string; perks: string[] } };
const premium = premiumJson as PremiumSubscription;

export default async function PremiumPage() {
    const session = await getServerAuthSession();

    let products = await db.plan.findMany();
    const updateTreshold = new Date(Date.now() - MAX_UPDATE_TIME);

    const lastUpdated: Date | undefined =
        products.length === 0
            ? undefined
            : products
                  .map((product) => product.updatedAt)
                  .sort((a, b) => b.getTime() - a.getTime())
                  .reverse()[0];

    if (!lastUpdated || lastUpdated.getTime() < updateTreshold.getTime()) {
        const fetchedProducts = await listProducts();

        if (fetchedProducts.statusCode !== 200 || !fetchedProducts.data || fetchedProducts.error) {
            console.log('Error fetching products:', fetchedProducts.error);
        } else {
            for (const newProduct of fetchedProducts.data.data) {
                const existingProduct = await db.plan.findFirst({
                    where: { productId: Number.parseInt(newProduct.id, 10) },
                });
                if (existingProduct) {
                    await db.plan.update({
                        where: {
                            productId: Number.parseInt(newProduct.id, 10),
                        },
                        data: {
                            name: newProduct.attributes.name,
                            variantName: newProduct.attributes.name,
                            description: newProduct.attributes.description,
                            price: newProduct.attributes.price,
                            status: newProduct.attributes.status,
                        },
                    });
                } else {
                    await db.plan.create({
                        data: {
                            productId: Number.parseInt(newProduct.id, 10),
                            variantId: -1,
                            name: newProduct.attributes.name,
                            variantName: newProduct.attributes.name,
                            description: newProduct.attributes.description,
                            price: newProduct.attributes.price,
                            status: newProduct.attributes.status,
                        },
                    });
                }
            }

            products = await db.plan.findMany();
        }
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
                <PlanButton plan={plan} session={session} />
            </div>
        </div>
    );
}
