import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

export default function GettingStartedGuide() {
    return (
        <>
            <h2>What is Coinz?</h2>
            <p>
                Coinz is a Discord bot that allows you and your friends to earn money by doing various minigames and
                activities. You can use your money to buy items, buy factories, and more! Coinz is designed to be a fun
                and interactive bot that you can play with.
            </p>

            <h3>Here are some of the features that Coinz has to offer:</h3>

            <ul>
                <li>Invest in the stock and crypto market without real consequences</li>
                <li>Play games like blackjack, slots, roulette, higher lower, and so much more...</li>
                <li>Start your own business, hire employees and manage your factories</li>
                <li>Become a farmer, buy farmland and grow crops</li>
                <li>Plant a tree, water it from time to time and watch it grow</li>
                <li>And so much more...</li>
            </ul>

            <h2>Where can I use Coinz?</h2>
            <p>You can invite Coinz in your own server or join a server that already uses Coinz.</p>

            <h3>Discord Servers that use Coinz:</h3>
            <div className="flex flex-col items-start">
                <div className="rounded-md border-highlight bg-secondary flex flex-col justify-center mt-2 max-w-[450px]">
                    <DiscordServerCard
                        image="https://cdn.discordapp.com/icons/938177962698735616/d36744148abd84ba3f1ed639996147dd.webp?size=240"
                        name="Coinz Support"
                        href="https://discord.gg/4xqpqSQ9d5"
                        description="The official support server for Coinz. Ask questions, use Coinz and hang out with other members."
                    />
                    <DiscordServerCard
                        image=""
                        name="Your server here"
                        href=""
                        description="Does your server use Coinz? Send a DM to siebe_b on Discord."
                    />
                    <DiscordServerCard
                        image=""
                        name="Your server here"
                        href=""
                        description="Does your server use Coinz? Send a DM to siebe_b on Discord."
                    />
                    <DiscordServerCard
                        image=""
                        name="Your server here"
                        href=""
                        description="Does your server use Coinz? Send a DM to siebe_b on Discord."
                    />
                    <DiscordServerCard
                        image=""
                        name="Your server here"
                        href=""
                        description="Does your server use Coinz? Send a DM to siebe_b on Discord."
                        separator={false}
                    />
                </div>
            </div>
            <p className="text-sm text-muted">
                Do you have Coinz in your server and want your server promoted here?
                <br />
                Please send <em>siebe_b</em> a message on Discord.
            </p>

            <h3 className="pt-3">Inviting Coinz to your Discord server:</h3>
            <ol>
                <li>
                    Have a server where you are owner or have <em>administrator</em> or <em>manage server</em>{' '}
                    permissions
                </li>
                <li>
                    Go to the{' '}
                    <Link href={'/invite'} target="_blank">
                        invite link
                    </Link>{' '}
                    or use the <code>/invite</code> command in a server where Coinz is already added.
                </li>
                <li className="mb-4">
                    Select the server you want to add Coinz to and click <em>continue</em>
                    <Image
                        src="https://cdn.coinzbot.xyz/guide/getting-started/invite-1.png"
                        alt="Add Coinz to your server"
                        className="h-[500px] ml-4 w-auto"
                        width={300}
                        height={500}
                        quality={80}
                    />
                </li>
                <li className="mb-4">
                    Select the permissions you want to give to Coinz and click <em>authorize</em> (It&apos;s recommended
                    to give Coinz the permissions that are already selected)
                    <Image
                        src="https://cdn.coinzbot.xyz/guide/getting-started/invite-2.png"
                        alt="Select permissions for Coinz"
                        className="h-[500px] ml-4 w-auto"
                        width={300}
                        height={500}
                        quality={80}
                    />
                </li>
                <li>
                    Coinz is now added to your server! You can use <code>/help</code> to get started
                </li>
            </ol>

            <h2>How to setup Coinz?</h2>
            <p>
                Coinz is designed to be a plug-and-play bot. This means that you don&apos;t need to do any setup to use
                Coinz. However, Coinz does need to have some permissions to function properly. When you invite Coinz to
                your server, it will automatically ask for the permissions it needs. It&apos;s recommended to give Coinz
                the permissions that are already selected. If you want to change the permissions later, you can always
                change them in the server settings.
            </p>

            <h2>Basic Commands to Get Started</h2>
            <p>
                Coinz has a lot of commands, but you don&apos;t need to know all of them to get started. Here are some
                of the most important commands that you need to know:
            </p>
            <ol>
                <li>
                    <code>/help categories</code> - Get a list of all commands
                </li>
                <li>
                    <code>/balance</code> - Check your balance
                </li>
                <li>
                    <code>/beg</code> - Beg for money
                </li>
                <li>
                    <code>/daily</code> - Claim your daily reward
                </li>
                <li>
                    <code>/shop</code> - Buy items from the shop (Use <code>/inventory</code> to see your items)
                </li>
            </ol>

            <h2>Earning Money</h2>
            <p>
                There are a lot of ways to earn money in Coinz. You can play games, buy and sell items, invest in the
                stock market, and so much more. Here are some of the ways to earn money in Coinz:
            </p>
            <ul>
                <li>
                    <strong>Begging, Working and Stealing</strong> - You can use the <code>/beg</code>,{' '}
                    <code>/work</code> and <code>/steal</code> commands to earn money. You first need to apply for a job
                    using the <code>/job apply</code> command. Use <code>/job list</code> to see all available jobs.
                </li>
                <li>
                    <strong>Voting</strong> - The easiest and fastest way to earn money is by voting. You can vote for
                    Coinz on{' '}
                    <Link href="https://top.gg/bot/938771676433362955/vote" target="_blank">
                        top.gg
                    </Link>{' '}
                    and{' '}
                    <Link href="https://discordbotlist.com/bots/coinz/upvote" target="_blank">
                        discordbotlist.com
                    </Link>
                    . You can vote every 12 hours and you will receive a lucky wheel spin for every vote. You can win
                    money or items by spinning the lucky wheel.
                </li>
                <li>
                    <strong>Games</strong> - You can play games like blackjack, slots, roulette, higher-lower, and so
                    much more... (Use <code>/help categories</code> to see all games)
                </li>
                <li>
                    <strong>Stock Market</strong> - You can invest in the stock market and crypto market. You can buy
                    and sell stocks and crypto and earn money by doing so. (Use <code>/invest info</code> to see all
                    investments)
                </li>
                <li>
                    <strong>Start a business</strong> - Coinz offers a lot of ways to start your own business. You can
                    become a farmer and grow crops (<code>/farm plots</code>). You can plant a tree and watch it grow (
                    <code>/tree</code>). You start a business and buy factories where you can produce items (
                    <code>/business</code> and <code>/factory list</code>).
                </li>
            </ul>

            <h2>Asking for Help</h2>
            <p>
                If this guide didn&apos;t answer your question, please check the other{' '}
                <Link href={'/guide'}>guides</Link> or join the{' '}
                <Link href={'https://discord.gg/4xqpqSQ9d5'} target="_blank">
                    support server
                </Link>{' '}
                and ask your question there.
            </p>
        </>
    );
}

function DiscordServerCard({
    image,
    name,
    description,
    href,
    separator = true,
}: {
    image: string;
    name: string;
    description: string;
    href: string;
    separator?: boolean;
}) {
    return (
        <div>
            <Link
                href={href}
                target={href === '' ? '_self' : '_blank'}
                className="px-3 py-2 hover:bg-white/10 transition-all duration-100 ease-in-out flex items-center gap-3"
            >
                <Avatar>
                    <AvatarImage src={image} />
                    <AvatarFallback className="bg-background">{name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <h6>{name}</h6>
                    <h6 className="text-sm text-muted">{description}</h6>
                </div>
            </Link>

            {separator && <Separator />}
        </div>
    );
}
