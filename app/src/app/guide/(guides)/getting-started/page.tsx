import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
                    <Link
                        href={'/invite'}
                        target="_blank"
                        className="text-primary hover:underline font-bold transition-all duration-100 ease-in-out"
                    >
                        invite link
                    </Link>
                </li>
                <li className="mb-4">
                    Select the server you want to add Coinz to and click <em>continue</em>
                    <img
                        src="https://cdn.discordapp.com/attachments/829029210118291507/1186606471765557330/image.png?ex=6593dc64&is=65816764&hm=bbfb61ab0bcda666f5387be59aa9fe3013c9af1cdf0198b5425942b469ac848d&"
                        className="max-h-[500px] ml-4"
                    />
                </li>
                <li className="mb-4">
                    Select the permissions you want to give to Coinz and click <em>authorize</em> (It&apos;s recommended
                    to give Coinz the permissions that are already selected)
                    <img
                        src="https://cdn.discordapp.com/attachments/829029210118291507/1186606555341271090/image.png?ex=6593dc78&is=65816778&hm=955148d2e68f50f2945aab643beb85e4f6fdebd3ca8abe98c84e76857d4559f6&"
                        alt=""
                        className="max-h-[500px] ml-4"
                    />
                </li>
                <li>
                    Coinz is now added to your server! You can use <code>/help</code> to get started
                </li>
            </ol>

            <h2>How to setup Coinz?</h2>
            <p></p>

            <h2>Basic Commands to Get Started</h2>
            <p></p>

            <h2>Earning Money</h2>
            <p></p>

            <h2>Asking for Help</h2>
            <p></p>
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
                className="px-3 py-2 hover:bg-white/10 hover:font-semibold transition-all duration-100 ease-in-out flex items-center gap-3"
            >
                <Avatar>
                    <AvatarImage src={image} />
                    <AvatarFallback className="bg-background">{name[0].toUpperCase()}</AvatarFallback>
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
