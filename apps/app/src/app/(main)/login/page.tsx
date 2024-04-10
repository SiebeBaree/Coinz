'use client';

import { signIn } from 'next-auth/react';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const url = searchParams.get('url');

        signIn('discord', {
            callbackUrl: url ?? '/dashboard',
            redirect: true,
        });
    }, [searchParams]);
}
