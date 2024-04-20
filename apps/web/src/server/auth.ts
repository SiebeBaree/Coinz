import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth, { type DefaultSession } from 'next-auth';
import { db } from '@/server/db';
import authConfig from '@/server/auth.config';

declare module 'next-auth' {
    interface Session extends DefaultSession {
        user: {
            id: string;
            discordId: string;
        } & DefaultSession['user'];
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    callbacks: {
        session: ({ session, token }) => ({
            ...session,
            user: {
                ...session.user,
                id: token.sub,
                discordId: token.discordId,
            },
        }),
        jwt: ({ token, account }) => {
            if (!token.sub) return token;

            const discordId = account?.providerAccountId;
            if (!discordId) return token;

            token.discordId = discordId;
            return token;
        },
    },
    adapter: PrismaAdapter(db),
    session: { strategy: 'jwt' },
    ...authConfig,
});
