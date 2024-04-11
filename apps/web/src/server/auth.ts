import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth, { type DefaultSession } from 'next-auth';
import Discord from 'next-auth/providers/discord';
import { db } from '@/server/db';

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
    providers: [Discord],
});
