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
import { Badge } from '@/components/ui/badge';
import { logout } from '@/actions/logout';

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
        comingSoon: true,
    },
    {
        label: 'Shop',
        icon: ShoppingCartIcon,
        href: '/dashboard/shop',
        comingSoon: true,
    },
    {
        label: 'Billing',
        icon: CreditCard,
        href: '/billing',
    },
    {
        label: 'Settings',
        icon: SettingsIcon,
        href: '/dashboard/settings',
        comingSoon: true,
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
        <div className="py-4 flex flex-col h-full bg-card text-card-foreground">
            <div className="px-3 py-2 flex-1">
                <Link href={'/dashboard'} className="flex items-center pl-3 mb-12">
                    <div className="relative w-8 h-8 mr-3">
                        <Image height={32} width={32} src="/logo.png" alt="The logo of Coinz" />
                    </div>
                    <h1 className="text-2xl font-bold">Coinz</h1>
                </Link>
                <div className="flex flex-col gap-1">
                    {routes.map((route) => (
                        <div key={route.href}>
                            <Link
                                href={route.href}
                                className={cn(
                                    'text-sm group flex p-3 w-full justify-start cursor-pointer hover:bg-white/10 rounded-lg transition font-medium',
                                    pathname === route.href ? 'text-card-foreground bg-white/10' : 'text-muted',
                                    route.comingSoon && 'pointer-events-none opacity-60',
                                )}
                            >
                                <route.icon className="h-5 w-5 mr-3" />
                                {route.label}
                                {route.comingSoon && (
                                    <Badge className="ml-auto text-muted" variant="secondary">
                                        SOON
                                    </Badge>
                                )}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
            <div className="px-3 py-2">
                {session && session.user && (
                    <>
                        <div className="flex flex-col gap-1 my-3">
                            <p
                                onClick={() => logout()}
                                className="text-sm group flex p-3 w-full justify-start cursor-pointer hover:bg-white/10 rounded-lg transition font-bold text-red-400"
                            >
                                <LogOutIcon className="h-5 w-5 mr-3" />
                                Log Out
                            </p>
                        </div>

                        <div className="flex gap-2 items-center bg-background py-2 px-3 rounded-md select-none">
                            <Image
                                src={session.user.image || '/logo.png'}
                                alt="Profile picture"
                                width={28}
                                height={28}
                                className="rounded-full"
                            />
                            <p className="font-medium">{session.user.name}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
