import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-static';

export default function VotePage() {
    return (
        <main className="container mx-auto px-5">
            <PageTitle
                title="Vote"
                description="Vote for Coinz on top.gg and discordbotlist to receive rewards! Help us grow and get a lucky wheel spin for supporting us."
            />

            <div
                className="grid gap-4 mb-12 mt-4 sm:grid-cols-1"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
            >
                <VoteCard
                    title="Top.gg"
                    description="Vote for Coinz on top.gg to receive a lucky wheel spin (or 2 lucky wheel spins if you're a Coinz Pro user)."
                    link="https://top.gg/bot/938771676433362955/vote"
                    image="topgg.png"
                />
                <VoteCard
                    title="Discord Bot List"
                    description="Vote for Coinz on Discord Bot List to receive a lucky wheel spin (or 2 lucky wheel spins if you're a Coinz Pro user)."
                    link="https://discordbotlist.com/bots/coinz/upvote"
                    image="discordbotlist.png"
                />
            </div>
        </main>
    );
}

function VoteCard({
    title,
    description,
    link,
    image,
}: {
    title: string;
    description: string;
    link: string;
    image: string;
}) {
    return (
        <div className="flex flex-col gap-2 p-4 rounded-md bg-secondary min-w-[200px]">
            <div className="flex items-center gap-3">
                <Image src={`https://cdn.coinzbot.xyz/vote/${image}`} width={32} height={32} alt={`${title} logo`} />
                <h2 className="text-2xl font-semibold">{title}</h2>
            </div>
            <p>{description}</p>

            <Link href={link} target="_blank" rel="noopener noreferrer" className="ml-auto mt-auto pt-2">
                <Button>Vote now</Button>
            </Link>
        </div>
    );
}
