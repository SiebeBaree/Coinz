'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
    CandlestickChartIcon,
    CreditCard,
    HomeIcon,
    InfoIcon,
    LayoutDashboardIcon,
    LogOutIcon,
    SettingsIcon,
    ShoppingCartIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';

const routes = [
    {
        label: 'Dashboard',
        icon: LayoutDashboardIcon,
        href: '/dashboard',
    },
    {
        label: 'Buy Investments',
        icon: CandlestickChartIcon,
        href: '/dashboard/investments',
    },
    {
        label: 'Shop',
        icon: ShoppingCartIcon,
        href: '/dashboard/shop',
    },
    {
        label: 'Billing',
        icon: CreditCard,
        href: '/dashboard/billing',
    },
    {
        label: 'Settings',
        icon: SettingsIcon,
        href: '/dashboard/settings',
    },
    {
        label: 'Support',
        icon: InfoIcon,
        href: '/support',
    },
    {
        label: 'Home',
        icon: HomeIcon,
        href: '/',
    },
];

export default function DashboardSidebar({ session }: { session: Session }) {
    const pathname = usePathname();

    return (
        <div className="py-4 flex flex-col h-full bg-secondary text-accent-foreground">
            <div className="px-3 py-2 flex-1">
                <Link href={'/dashboard'} className="flex items-center pl-3 mb-12">
                    <div className="relative w-8 h-8 mr-3">
                        <Image height={32} width={32} src="/logo192.png" alt="The logo of Coinz" />
                    </div>
                    <h1 className="text-2xl font-bold">Coinz</h1>
                </Link>
                <div className="flex flex-col gap-1">
                    {routes.map((route) => (
                        <Link
                            href={route.href}
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
                </div>
            </div>
            <div className="px-3 py-2">
                {session && (
                    <>
                        <div className="flex flex-col gap-1 my-3">
                            <p
                                onClick={() =>
                                    signOut({
                                        callbackUrl: '/',
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

                        <div className="flex gap-2 items-center bg-background py-2 px-3 rounded-md select-none">
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
