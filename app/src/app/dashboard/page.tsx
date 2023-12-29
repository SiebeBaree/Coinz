import { getServerAuthSession } from '@/server/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const session = await getServerAuthSession();
    if (session === null) return redirect('/login?url=/dashboard');

    return (
        <main>
            <p>{session.user.name}</p>
            <p>{session.user.discordId}</p>
        </main>
    );
}
