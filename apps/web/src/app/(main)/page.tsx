import Image from 'next/image';
import Link from 'next/link';
import DiscordIcon from '@/components/icons/discord';
import React from 'react';
import Statistics from '@/components/statistics';
import { IconProps } from '@/lib/types';
import { cn, formatNumber } from '@/lib/utils';
import InvestingIcon from '@/components/icons/investing';
import BusinessIcon from '@/components/icons/business';
import GamesIcon from '@/components/icons/games';
import FarmingIcon from '@/components/icons/farming';
import { db } from '@/server/db';

export const revalidate = 3600;

export default async function Home() {
    const botStats = await db.botStats.findFirst({
        orderBy: {
            updatedAt: 'desc',
        },
    });

    const users = formatNumber(botStats?.users || 0);
    return (
        <main>
            <div
                className="flex flex-col justify-between"
                style={{
                    minHeight: 'calc(100vh - 60px)',
                }}
            >
                <div className="container mx-auto px-5 flex flex-col-reverse md:flex-row justify-center md:justify-between items-center flex-grow gap-12 sm:gap-20 md:gap-0">
                    <div>
                        <div className="relative">
                            <h2
                                className="text-7xl sm:text-9xl md:text-8xl lg:text-9xl xl:text-[180px] font-bold absolute select-none text-foreground/5 -top-8 sm:-top-16 left-1/2 -translate-x-1/2 md:translate-x-0 md:-top-12 lg:-top-16 md:-left-16 xl:-top-20 xl:-left-28 z-0"
                                style={{
                                    fontFamily: 'Ginto Nord, Inter, Poppins, Roboto, sans-serif',
                                }}
                            >
                                Coinz
                            </h2>
                            <h1 className="text-center md:text-left text-3xl sm:text-5xl lg:text-6xl font-bold">
                                The Ultimate Economy Discord Bot
                            </h1>
                        </div>
                        <p className="text-center md:text-left sm:text-lg md:text-base mt-3 text-muted">
                            Join over {users.value}
                            {users.suffix}+ users and compete to be the wealthiest person on Coinz with our entertaining
                            commands. You can buy stocks, start your own business, play fun minigames and much more!
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center md:justify-start items-center gap-4 md:gap-2 my-6">
                            <Link
                                href={'/invite'}
                                target="_blank"
                                className="px-3 lg:px-4 py-1 lg:py-2 lg:text-lg font-semibold rounded-md bg-primary text-primary-foreground relative z-10 mr-3 flex gap-2 items-center"
                            >
                                <DiscordIcon className="text-primary-foreground h-4 w-4 lg:h-6 lg:w-6" />
                                Add to Discord
                                <div className="w-full h-full absolute border-[3px] border-primary rounded-md transition-all duration-150 ease-in-out top-2 left-2 hover:top-0 hover:left-0" />
                            </Link>
                            <p className="md:hidden lg:block">
                                or{' '}
                                <Link href={'/support'} target="_blank" className="underline text-primary">
                                    get help using Coinz
                                </Link>
                            </p>
                        </div>
                    </div>

                    <Image
                        src="/hero.png"
                        alt="Hero Image"
                        loading="eager"
                        priority={true}
                        width={800}
                        height={800}
                        className="object-cover max-h-[200px] sm:max-h-[300px] md:max-h-[400px] xl:max-h-[600px] max-w-[200px] sm:max-w-[300px] md:max-w-[400px] xl:max-w-[600px] mt-8 md:mt-0"
                    />
                </div>

                <div id="statistics" className="bg-card py-8">
                    <div
                        className="grid gap-6 container mx-auto px-5"
                        style={{
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        }}
                    >
                        <Statistics botStats={botStats} />
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-5 my-24 flex flex-col gap-64">
                <FeatureCard
                    imagePath="/investing.webp"
                    Icon={InvestingIcon}
                    title="Buy, hold and sell stocks"
                    description="Enhance your knowledge of the stock and crypto market by buying, holding and selling stocks and crypto within Coinz. All prices are updated regularly. Coinz currently has 30 stocks and 40 crypto currencies."
                />
                <FeatureCard
                    imagePath="/business.webp"
                    Icon={BusinessIcon}
                    title="Start your own business"
                    description="Create your own business, buy factories and produce items that you can sell for a big profit. Repeat this step over and over and become richer than Elon Musk! Did I mention that you can employ real users?!"
                    imageRight={true}
                    lineToLeft={true}
                />
                <FeatureCard
                    imagePath="/games.webp"
                    Icon={GamesIcon}
                    title="Play more than 15 games"
                    description="Play all sorts of minigames inside of discord! You will never get bored when playing these minigames. We plan to release a lot more minigames in the future. Some examples are: Blackjack, Poker, Roulette, Crash, ..."
                    lineToLeft={false}
                />
                <FeatureCard
                    imagePath="/farming.webp"
                    Icon={FarmingIcon}
                    title="Grow your own crops"
                    description="Buy farmland to grow crops on and live a peaceful live. Buy up to 9 plots to grow crops on. With premium you can buy up to 15 plots! Each crop has a different grow time, don't let your crops grow rotten!"
                    imageRight={true}
                    lineToLeft={true}
                />
            </div>

            <div className="container bg-secondary sm:rounded-md h-72 flex flex-col justify-center items-center p-6 gap-4">
                <p className="text-3xl text-center font-semibold">Engage your community today with Coinz!</p>
                <Link
                    href={'/invite'}
                    target="_blank"
                    className="px-3 lg:px-4 py-1 lg:py-2 lg:text-lg font-semibold rounded-md bg-primary text-primary-foreground relative z-10 mr-3 flex gap-2 items-center"
                >
                    <DiscordIcon className="text-primary-foreground h-4 w-4 lg:h-6 lg:w-6" />
                    Add to Discord
                    <div className="w-full h-full absolute border-[3px] border-primary rounded-md transition-all duration-150 ease-in-out top-2 left-2 hover:top-0 hover:left-0" />
                </Link>
            </div>
        </main>
    );
}

function FeatureCard({
    imagePath,
    Icon,
    title,
    description,
    lineToLeft,
    imageRight = false,
}: {
    imagePath: string;
    Icon: (props: IconProps) => React.JSX.Element;
    title: string;
    description: string;
    lineToLeft?: boolean;
    imageRight?: boolean;
}) {
    const imageSrcPath = lineToLeft ? '/line-right-to-left.svg' : '/line-left-to-right.svg';

    return (
        <div
            className={cn(
                imageRight ? 'flex-col lg:flex-row-reverse' : 'flex-col lg:flex-row',
                'flex justify-between items-center gap-12 xl:gap-24 relative',
            )}
        >
            <Image
                src={imagePath}
                alt=""
                width={600}
                height={400}
                className="z-30 w-full max-w-[400px] lg:max-w-max lg:h-[300px] xl:h-[400px] lg:w-auto"
            />

            <div
                className={cn(
                    imageRight ? 'text-center lg:text-left' : 'text-center lg:text-right',
                    'flex flex-col justify-center relative',
                )}
            >
                <Icon
                    className={cn(
                        'absolute w-screen h-auto max-w-[600px] lg:h-[600px] lg:w-[600px] left-1/2 -translate-x-1/2 lg:translate-x-0',
                        imageRight ? 'lg:-left-[30%]' : 'lg:-right-[30%]',
                    )}
                />
                <h3 className="text-4xl font-semibold mb-2">{title}</h3>
                <p>{description}</p>
            </div>

            {lineToLeft !== undefined && (
                <Image
                    src={imageSrcPath}
                    alt="A dotted line to go to the new feature."
                    width={800}
                    height={300}
                    className="absolute left-1/2 bottom-[80%] -translate-x-1/2 hidden lg:block h-[230px] xl:h-[270px]"
                />
            )}
        </div>
    );
}
