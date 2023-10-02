import Image from "next/image";
import Link from "next/link";
import DiscordIcon from "@/components/icons/Discord";
import React from "react";
import ServerIcon from "@/components/icons/Server";
import UsersIcon from "@/components/icons/Users";
import TerminalIcon from "@/components/icons/Terminal";
import { Statistic } from "@/components/Statistic";
import CandlesIcon from "@/components/icons/Candles";
import heroImg from "@/lib/img/hero.png";
import { IconProps } from "@/lib/interfaces";
import { cn } from "@/lib/utils";
import InvestingIcon from "@/components/icons/Investing";
import BusinessIcon from "@/components/icons/Business";
import GamesIcon from "@/components/icons/Games";
import FarmingIcon from "@/components/icons/Farming";

export default function Home() {
    return (
        <main>
            <div className="flex flex-col justify-between" style={{
                minHeight: "calc(100vh - 60px)",
            }}>
                <div
                    className="container mx-auto px-5 flex flex-col-reverse md:flex-row justify-between items-center flex-grow">
                    <div>
                        <h2 className="text-7xl sm:text-9xl md:text-8xl lg:text-9xl xl:text-[180px] font-bold absolute -top-[40%] sm:-top-[60%] md:-top-[20%] xl:-top-[30%] left-1/2 -translate-x-1/2 md:translate-x-0 md:-left-[5%] xl:-left-[15%]"
                            style={{
                                fontFamily: "Ginto Nord, Inter, Poppins, Roboto, sans-serif",
                                color: "var(--color-watermark)",
                            }}>Coinz</h2>
                        <h1 className="text-center md:text-left text-3xl sm:text-5xl lg:text-6xl font-bold">The Ultimate
                            Economy Discord Bot</h1>
                        <p className="text-center md:text-left sm:text-xl md:text-base lg:text-xl mt-3">
                            Join over 400,000 users and compete to be the wealthiest person on Coinz with our
                            entertaining commands.
                        </p>

                        <div
                            className="flex flex-col sm:flex-row justify-center md:justify-start items-center gap-3 my-8">
                            <Link href="/invite" target="_blank"
                                  className="px-4 lg:px-6 py-2 lg:py-3 text-lg font-semibold rounded-md bg-primary text-primary-foreground relative z-10 mr-3 flex gap-2 items-center">
                                <DiscordIcon className="text-primary-foreground"/>
                                Add to Discord
                                <div
                                    className="w-full h-full absolute border-[3px] border-primary rounded-md transition-all duration-150 ease-in-out top-2 left-2 hover:top-0 hover:left-0"/>
                            </Link>
                            <p className="md:hidden lg:block">or <Link href="/support" target="_blank"
                                                                       className="underline text-primary">get help
                                using coinz</Link></p>
                        </div>
                    </div>

                    <Image src={heroImg} alt="Hero Image" loading="eager" priority={true}
                           className="object-cover max-h-[200px] sm:max-h-[300px] md:max-h-[400px] xl:max-h-[600px] max-w-[200px] sm:max-w-[300px] md:max-w-[400px] xl:max-w-[600px] mt-8 md:mt-0"/>
                </div>

                <div id="statistics" className="bg-secondary py-8">
                    <div className="flex flex-wrap gap-8 items-center justify-around container mx-auto px-5">
                        <Statistic Icon={<ServerIcon className="fill-primary h-12 w-12"/>}
                                   title="Servers" value={3500} suffix="+"/>
                        <Statistic Icon={<UsersIcon className="fill-primary h-12 w-12"/>}
                                   title="Users" value={400} suffix="K+"/>
                        <Statistic Icon={<TerminalIcon className="fill-primary h-12 w-12"/>}
                                   title="Commands" value={35}/>
                        <Statistic Icon={<CandlesIcon className="fill-primary h-12 w-12"/>}
                                   title="Investments" value={60}/>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-5 mt-24">
                <div className="flex flex-col gap-64">
                    <FeatureCard imagePath="/investing.webp" Icon={InvestingIcon} title="Buy, hold and sell stocks"
                                 description="Enhance your knowledge of the stock and crypto market by buying, holding and selling stocks and crypto within Coinz. All prices are updated regularly. Coinz currently has 30 stocks and 27 crypto currencies."/>
                    <FeatureCard imagePath="/business.webp" Icon={BusinessIcon} title="Start your own business"
                                 description="Create your own business, buy factories and produce items that you can sell for a big profit. Repeat this step over and over and become richer than Elon Musk! Did I mention that you can employ real users?!"
                                 imageRight={true} lineToLeft={true}/>
                    <FeatureCard imagePath="/games.webp" Icon={GamesIcon} title="Play more than 15 games"
                                 description="Play all sorts of minigames inside of discord! You will never get bored when playing these minigames. We plan to release a lot more minigames in the future. Some examples are: Blackjack, Poker, Roulette, Crash, ..."
                                 lineToLeft={false}/>
                    <FeatureCard imagePath="/farming.webp" Icon={FarmingIcon} title="Grow your own crops"
                                 description="Buy farmland to grow crops on and live a peaceful live. Buy up to 9 plots to grow crops on. With premium you can buy up to 15 plots! Each crop has a different grow time, don't let your crops grow rotten!"
                                 imageRight={true} lineToLeft={true}/>
                </div>
            </div>
        </main>
    );
}

function FeatureCard({ imagePath, Icon, title, description, lineToLeft, imageRight = false }: {
    imagePath: string;
    Icon: (props: IconProps) => React.JSX.Element;
    title: string;
    description: string;
    lineToLeft?: boolean;
    imageRight?: boolean;
}) {
    const imageSrcPath = lineToLeft ? "/line-right-to-left.svg" : "/line-left-to-right.svg";

    return (
        <div
            className={cn(imageRight ? "flex-col lg:flex-row-reverse" : "flex-col lg:flex-row", "flex justify-between items-center gap-12 xl:gap-24 relative")}>
            <Image src={imagePath} alt="" width={600} height={400}
                   className="z-30 w-full max-w-[400px] lg:max-w-max lg:h-[300px] xl:h-[400px] lg:w-auto"/>

            <div className={cn(imageRight ? "text-center lg:text-left" : "text-center lg:text-right", "flex flex-col justify-center relative")}>
                <Icon className={cn("absolute w-screen h-auto max-w-[600px] lg:h-[600px] lg:w-[600px] left-1/2 -translate-x-1/2 lg:translate-x-0", imageRight ? "lg:-left-[30%]" : "lg:-right-[30%]")}/>
                <h3 className="text-4xl font-semibold mb-2">{title}</h3>
                <p>{description}</p>
            </div>

            {lineToLeft !== undefined && (
                <Image src={imageSrcPath} alt="A dotted line to go to the new feature." width={720} height={270}
                       className="absolute left-1/2 bottom-[80%] -translate-x-1/2 hidden lg:block h-[230px] xl:h-[270px]"/>
            )}
        </div>
    );
}