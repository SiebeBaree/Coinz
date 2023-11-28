'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
    ActivityIcon,
    CandlestickChartIcon,
    CommandIcon,
    ExternalLinkIcon,
    HelpCircleIcon,
    HomeIcon,
    InfoIcon,
    LayoutDashboardIcon,
    LogInIcon,
    LogOutIcon,
    ScrollTextIcon,
    ShoppingCartIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Session } from 'next-auth';
import { signIn } from 'next-auth/react';

const routes = [
    {
        label: 'Home',
        icon: HomeIcon,
        href: '/',
    },
    {
        label: 'FAQ',
        icon: HelpCircleIcon,
        href: '/faq',
    },
    {
        label: 'Commands',
        icon: CommandIcon,
        href: '/commands',
    },
    {
        label: 'Items',
        icon: ShoppingCartIcon,
        href: '/items',
    },
    {
        label: 'Investments',
        icon: CandlestickChartIcon,
        href: '/investments',
    },
    {
        label: 'Status',
        icon: ActivityIcon,
        href: '/status',
    },
    {
        label: 'Changelog',
        icon: ScrollTextIcon,
        href: '/changelog',
    },
    {
        label: 'Invite',
        icon: ExternalLinkIcon,
        href: '/invite',
    },
    {
        label: 'Support',
        icon: InfoIcon,
        href: '/settings',
    },
];

export default function Sidebar({ session }: { session: Session | null }) {
    const pathname = usePathname();

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-accent text-accent-foreground">
            <div className="px-3 py-2 flex-1">
                <Link href={'/dashboard'} className="flex items-center pl-3 mb-14">
                    <div className="relative w-8 h-8 mr-3">
                        <Image height={32} width={32} src="/logo192.png" alt="The logo of SiebeGPT" />
                    </div>
                    <h1 className="text-2xl font-bold">Coinz</h1>
                </Link>
                <div className="flex flex-col gap-1">
                    {routes.map((route) => (
                        <Link
                            href={'/dashboard' + route.href}
                            key={route.href}
                            className={cn(
                                'text-sm group flex p-3 w-full justify-start cursor-pointer hover:bg-white/10 rounded-lg transition font-medium',
                                pathname === route.href ? 'text-accent-foreground bg-white/10' : 'text-muted',
                            )}
                        >
                            <route.icon className="h-5 w-5 mr-3" />
                            {route.label}
                        </Link>
                    ))}
                    {!session && (
                        <p
                            onClick={() => signIn('discord', { callbackUrl: '/profile' })}
                            className={
                                'text-sm group flex p-3 w-full justify-start cursor-pointer hover:bg-white/10 rounded-lg transition font-medium text-primary'
                            }
                        >
                            <LogInIcon className="h-5 w-5 mr-3" />
                            Log In
                        </p>
                    )}
                </div>
            </div>
            <div className="px-3 py-2">
                {session && (
                    <>
                        <div className="flex flex-col gap-1 my-3">
                            <Link
                                href={'/dashboard'}
                                className={cn(
                                    'text-sm group flex p-3 w-full justify-start cursor-pointer hover:bg-white/10 rounded-lg transition font-medium',
                                    pathname === '/dashboard' ? 'text-accent-foreground bg-white/10' : 'text-muted',
                                )}
                            >
                                <LayoutDashboardIcon className="h-5 w-5 mr-3" />
                                Dashboard
                            </Link>
                            <p
                                onClick={() =>
                                    signIn('discord', {
                                        callbackUrl: '/profile',
                                    })
                                }
                                className={
                                    'text-sm group flex p-3 w-full justify-start cursor-pointer hover:bg-white/10 rounded-lg transition font-bold text-red-400'
                                }
                            >
                                <LogOutIcon className="h-5 w-5 mr-3" />
                                Log Out
                            </p>
                        </div>

                        <div className="flex gap-2 items-center bg-secondary py-2 px-3 rounded-md select-none">
                            <Image
                                src={session?.user?.image || 'https://cdn.discordapp.com/embed/avatars/3.png'}
                                alt="Profile picture"
                                width={28}
                                height={28}
                                className="rounded-full"
                            />
                            <p className="font-medium">{session?.user?.name}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
