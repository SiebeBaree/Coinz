import { redirect } from 'next/navigation';
import { db } from '@/server/db';
import { getServerAuthSession } from '@/server/auth';

export default async function ProfilePage() {
    const session = await getServerAuthSession();
    if (session === null) return redirect('/');

    const account = await db.account.findFirst({
        where: { userId: session.user.id },
    });
    if (account === null) return redirect('/');

    return (
        <main>
            <p>{session.user.name}</p>
            <p>{account.providerAccountId}</p>
        </main>
    );
}
