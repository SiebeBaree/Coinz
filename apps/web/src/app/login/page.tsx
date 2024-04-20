'use client';

import { signIn } from 'next-auth/react';
import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
    return (
        <Suspense>
            <LoginComponent />
        </Suspense>
    );
}

function LoginComponent() {
    const searchParams = useSearchParams();
    const url = searchParams.get('url');

    useEffect(() => {
        signIn('discord', {
            callbackUrl: url ?? '/dashboard',
            redirect: true,
        });
    }, [url]);

    return null; // Render nothing or some placeholder here if needed
}
