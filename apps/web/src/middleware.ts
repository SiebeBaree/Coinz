import NextAuth from 'next-auth';
import authConfig from '@/server/auth.config';

const { auth: middleware } = NextAuth(authConfig);

export default middleware((req) => {
    const isLoggedIn = !!req.auth;

    const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth');
    const isPrivateRoute = req.nextUrl.pathname.startsWith('/dashboard');

    if (isApiAuthRoute) {
        return;
    } else if (!isLoggedIn && isPrivateRoute) {
        const callbackUrl = req.nextUrl.pathname;

        const encodedCallbackUrl = encodeURIComponent(callbackUrl);
        return Response.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, req.nextUrl), 302);
    }
});

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
