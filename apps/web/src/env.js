import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
    server: {
        DATABASE_URL: z
            .string()
            .url()
            .refine((str) => !str.includes('YOUR_MONGODB_URL_HERE'), 'You forgot to change the default URL'),
        NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
        AUTH_SECRET: z.string(),
        AUTH_DISCORD_ID: z.string(),
        AUTH_DISCORD_SECRET: z.string(),
        LEMONSQUEEZY_API_KEY: z.string(),
        LEMONSQUEEZY_STORE_ID: z.string(),
        LEMONSQUEEZY_WEBHOOK_SECRET: z.string(),
        WEBHOOK_URL: z.string().url(),
    },
    client: {
        NEXT_PUBLIC_BASE_URL: z.string().url(),
    },
    runtimeEnv: {
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
        DATABASE_URL: process.env.DATABASE_URL,
        AUTH_SECRET: process.env.AUTH_SECRET,
        AUTH_DISCORD_ID: process.env.AUTH_DISCORD_ID,
        AUTH_DISCORD_SECRET: process.env.AUTH_DISCORD_SECRET,
        LEMONSQUEEZY_API_KEY: process.env.LEMONSQUEEZY_API_KEY,
        LEMONSQUEEZY_STORE_ID: process.env.LEMONSQUEEZY_STORE_ID,
        LEMONSQUEEZY_WEBHOOK_SECRET: process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
        WEBHOOK_URL: process.env.WEBHOOK_URL,
        NODE_ENV: process.env.NODE_ENV,
    },
    skipValidation: !!process.env.SKIP_ENV_VALIDATION,
    emptyStringAsUndefined: true,
});
