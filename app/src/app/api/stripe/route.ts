import { absoluteUrl } from '@/lib/utils';
import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/server/auth';
import { db } from '@/server/db';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

const settingsUrl = absoluteUrl('/dashboard/settings');

export async function GET() {
    try {
        const session = await getServerAuthSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userSubscription = await db.userSubscription.findUnique({
            where: {
                userId: session.user.id,
            },
        });

        if (userSubscription && userSubscription.stripeCustomerId) {
            const stripeSession = await stripe.billingPortal.sessions.create({
                customer: userSubscription.stripeCustomerId,
                return_url: settingsUrl,
            });

            return NextResponse.json({ url: stripeSession.url });
        }

        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            billing_address_collection: 'auto',
            customer_email: session.user.email!,
            success_url: settingsUrl,
            cancel_url: settingsUrl,
            line_items: [
                {
                    price_data: {
                        currency: 'USD',
                        product_data: {
                            name: 'Subscription',
                            description: 'Monthly Subscription',
                        },
                        unit_amount: 500,
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                userId: session.user.id,
            },
        });

        return NextResponse.json({ url: stripeSession.url });
    } catch (error) {
        console.log('[STRIPE_ERROR]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
