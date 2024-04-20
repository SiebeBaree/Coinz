'use server';

import { signOut } from '@/server/auth';

export async function logout() {
    await signOut({
        redirectTo: '/',
        redirect: true,
    });
}
