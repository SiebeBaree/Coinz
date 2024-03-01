/* eslint-disable quotes */
import { getServerAuthSession } from '@/server/auth';
import { type NewCheckout, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const session = await getServerAuthSession();
    if (!session) {
        return NextResponse.json({ message: 'You are not authorized to perform this action.' }, { status: 401 });
    }

    const res = await request.json();
    if (!res.variantId) {
        return NextResponse.json({ error: true, message: 'No variant ID was provided.' }, { status: 400 });
    }

    const newCheckout: NewCheckout = {
        checkoutOptions: {
            embed: true,
            media: false,
            logo: true,
        },
        checkoutData: {
            email: session.user.email === null ? undefined : session.user.email,
            custom: {
                user_id: session.user.discordId,
            },
        },
        productOptions: {
            enabledVariants: [res.variantId],
            redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing/`,
            receiptLinkUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing/`,
            receiptButtonText: 'Go to dashboard',
            receiptThankYouNote:
                'Thank you for subscribing to Coinz Premium! If there are any problems contact siebe_b on Discord.',
        },
        testMode: true,
    };

    try {
        const { statusCode, error, data } = await createCheckout(
            process.env.LEMONSQUEEZY_STORE_ID!,
            res.variantId,
            newCheckout,
        );

        if (error || (statusCode !== 200 && statusCode !== 201)) {
            return NextResponse.json(
                { message: error?.message ?? "Couldn't create a checkout. Please try again later." },
                { status: 400 },
            );
        }

        return NextResponse.json({ url: data?.data.attributes.url }, { status: 200 });
    } catch (e) {
        return NextResponse.json({ message: "Couldn't create a checkout. Please try again later." }, { status: 400 });
    }
}
