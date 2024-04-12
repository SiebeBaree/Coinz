'use server';

import { env } from '@/env';
import { webhookHasData, webhookHasMeta } from '@/lib/typeguards';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { configureLemonSqueezy } from '@/server/lemonsqueezy';
import { createCheckout, listWebhooks } from '@lemonsqueezy/lemonsqueezy.js';
import { WebhookEvents } from '@prisma/client';
import products from '@/lib/data/products.json';
import { SubscriptionStatus } from '@/lib/enums';

export async function getCheckoutURL(variantId: number) {
    configureLemonSqueezy();

    const session = await auth();
    if (!session?.user) {
        return {
            success: false,
            error: 'Not authenticated',
        };
    }

    const checkout = await createCheckout(env.LEMONSQUEEZY_STORE_ID, variantId, {
        checkoutOptions: {
            embed: false,
            media: false,
            logo: false,
        },
        checkoutData: {
            name: session.user.name ?? undefined,
            email: session.user.email ?? undefined,
            custom: {
                user_id: session.user.discordId,
            },
        },
        productOptions: {
            enabledVariants: [variantId],
            redirectUrl: `${env.NEXT_PUBLIC_BASE_URL}/dashboard`,
            receiptButtonText: 'Go to billing',
            receiptThankYouNote: 'Thank you for buying Coinz Premium! 🎉',
        },
    });

    return {
        success: true,
        checkoutUrl: checkout.data?.data.attributes.url,
    };
}

export async function hasWebhook() {
    configureLemonSqueezy();

    const allWebhooks = await listWebhooks({
        filter: { storeId: env.LEMONSQUEEZY_STORE_ID },
    });

    let webhookUrl = `${env.WEBHOOK_URL}api/webhook`;
    const webhook = allWebhooks.data?.data.find((wh) => wh.attributes.url === webhookUrl);

    return webhook;
}

export async function storeWebhookEvent(eventName: string, body: WebhookEvents['body']) {
    return await db.webhookEvents.create({
        data: {
            eventName,
            processed: false,
            body,
        },
    });
}

export async function processWebhookEvent(webhookEvent: WebhookEvents) {
    configureLemonSqueezy();

    const dbwebhookEvent = await db.webhookEvents.findUnique({
        where: { id: webhookEvent.id },
    });

    if (!dbwebhookEvent) {
        throw new Error(`Webhook event #${webhookEvent.id} not found in the database.`);
    }

    let processingError = '';
    let eventBody;

    try {
        eventBody = JSON.parse(webhookEvent.body);
    } catch {
        // If the event body is not valid JSON, set the processing error and update the webhook event in the database.
    }

    if (!eventBody) {
        processingError = 'Event body is not valid JSON or is missing';
    } else if (!webhookHasMeta(eventBody)) {
        processingError = "Event body is missing the 'meta' property.";
    } else if (webhookHasData(eventBody)) {
        if (webhookEvent.eventName.startsWith('subscription_')) {
            const attributes = eventBody.data.attributes;
            const variantId = attributes.variant_id as string;

            const product = products.find((p) => p.variantId.toString() === variantId.toString());
            if (!product) {
                processingError += `Product with variantId ${variantId} not found.`;
            } else {
                const discordId = eventBody.meta.custom_data.user_id;
                const updateData = {
                    lemonSqueezyId: eventBody.data.id,
                    orderId: attributes.order_id as number,
                    name: attributes.user_name as string,
                    email: attributes.user_email as string,
                    status: attributes.status as string,
                    statusFormatted: attributes.status_formatted as string,
                    renewsAt: attributes.renews_at as string,
                    endsAt: attributes.ends_at as string,
                    subscriptionItemId: attributes.first_subscription_item.id,
                    userId: eventBody.meta.custom_data.user_id,
                    planId: product.planId.toString(),
                    variantId: product.variantId.toString(),
                };

                // Create/update subscription in the database.
                try {
                    await db.subscriptions.upsert({
                        where: { lemonSqueezyId: updateData.lemonSqueezyId },
                        create: updateData,
                        update: updateData,
                    });

                    try {
                        const status = updateData.status;
                        if (status === SubscriptionStatus.Active) {
                            await db.members.upsert({
                                where: { userId: discordId },
                                update: {
                                    premium: product.premium,
                                },
                                create: {
                                    userId: discordId,
                                    premium: product.premium,
                                },
                            });
                        } else if (status === SubscriptionStatus.Expired) {
                            await db.members.upsert({
                                where: { userId: discordId },
                                update: {
                                    premium: 0,
                                },
                                create: {
                                    userId: discordId,
                                    premium: 0,
                                },
                            });
                        }
                    } catch {
                        processingError += `Failed to update member with Subscription #${updateData.lemonSqueezyId}.`;
                    }
                } catch (error) {
                    processingError += `Failed to upsert Subscription #${updateData.lemonSqueezyId} to the database.`;
                }
            }
        }
    }

    // Update the webhook event in the database.
    await db.webhookEvents.update({
        where: { id: webhookEvent.id },
        data: {
            processed: true,
            processingError,
        },
    });
}
