'use server';

import { signIn } from '@/server/auth';

export async function login(callbackUrl?: string) {
    await signIn('discord', {
        callbackUrl: callbackUrl ?? '/dashboard',
    });
}
