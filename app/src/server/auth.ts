import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { getServerSession, type DefaultSession, type NextAuthOptions } from 'next-auth';
import { db } from '@/server/db';
import Discord from 'next-auth/providers/discord';
import { User } from '@prisma/client';

declare module 'next-auth' {
    interface Session extends DefaultSession {
        user: {
            id: string;
            discordId: string;
        } & DefaultSession['user'];
    }
}

export const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET!,
    callbacks: {
        session: async ({ session, token }) => {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.id,
                    discordId: token.discordId,
                },
            };
        },
        jwt: async ({ token, user }) => {
            if (user) {
                const u = user as unknown as User;
                const account = await db.account.findFirst({
                    where: { userId: u.id },
                });

                return {
                    ...token,
                    id: u.id,
                    discordId: account?.providerAccountId,
                };
            }

            return token;
        },
    },
    adapter: PrismaAdapter(db),
    providers: [
        Discord({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        }),
    ],
};

export const getServerAuthSession = () => getServerSession(authOptions);
