import crypto from 'node:crypto';
import { processWebhookEvent, storeWebhookEvent } from '@/actions/lemonsqueezy';
import { webhookHasMeta } from '@/lib/typeguards';
import { env } from '@/env';

export async function POST(request: Request) {
    // First, make sure the request is from Lemon Squeezy.
    const rawBody = await request.text();
    const secret = env.LEMONSQUEEZY_WEBHOOK_SECRET;

    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signature = Buffer.from(request.headers.get('X-Signature') || '', 'utf8');

    if (!crypto.timingSafeEqual(digest, signature)) {
        throw new Error('Invalid signature.');
    }

    const data = JSON.parse(rawBody) as unknown;

    // Type guard to check if the object has a 'meta' property.
    if (webhookHasMeta(data)) {
        const webhookEventId = await storeWebhookEvent(data.meta.event_name, JSON.stringify(data));

        // Non-blocking call to process the webhook event.
        void processWebhookEvent(webhookEventId);

        return new Response('OK', { status: 200 });
    }

    return new Response('Data invalid', { status: 400 });
}
