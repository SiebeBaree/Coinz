'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Session } from 'next-auth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Sidebar from '@/components/nav/Sidebar';
import { LucideIcon, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { signIn, signOut } from 'next-auth/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Cloud, CreditCard, LifeBuoy, LogOut, Plus, User } from 'lucide-react';

export default function Navbar({ session }: { session: Session | null }) {
    const pathname = usePathname();

    return (
        <nav className="container flex justify-between items-center p-4 h-[60px] z-50">
            <div className="flex gap-6 lg:gap-10 items-center">
                <Link
                    href="/"
                    className="font-bold text-2xl"
                    style={{
                        fontFamily: 'Ginto Nord, inter, roboto, sans-serif',
                    }}
                >
                    Coinz
                </Link>

                <div className="hidden md:flex md:gap-1">
                    <NavItem name="Guide" href="/guide" pathname={pathname} />
                    <NavItem name="Commands" href="/commands" pathname={pathname} />
                    <NavItem name="Items" href="/items" pathname={pathname} />
                    <NavItem name="Investments" href="/investments" pathname={pathname} />
                    <NavItem name="Help" href="/support" />
                </div>
            </div>

            <div className="hidden md:block">
                <div className="flex md:gap-3 justify-between items-center">
                    <NavItem name="Premium" href="/premium" pathname={pathname} />

                    {session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger>
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
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48 mr-4">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownItem name="Profile" href="/profile" Icon={User} />
                                    <DropdownItem name="Billing" href="/billing" Icon={CreditCard} />
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownItem name="Invite Coinz" href="/invite" Icon={Plus} />
                                    <DropdownItem name="Support" href="/support" Icon={LifeBuoy} />
                                    <DropdownItem
                                        name="Statistics"
                                        href="/"
                                        Icon={Cloud}
                                        shortcut="SOON"
                                        disabled={true}
                                    />
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer transition-all duration-200 ease-in-out hover:bg-white/10"
                                    onClick={() =>
                                        signOut({
                                            callbackUrl: '/',
                                        })
                                    }
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            onClick={() => signIn('discord', { callbackUrl: '/profile' })}
                            className="px-5 py-2 h-auto"
                        >
                            Login
                        </Button>
                    )}
                </div>
            </div>

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0">
                    <Sidebar session={session} />
                </SheetContent>
            </Sheet>
        </nav>
    );
}

function NavItem({ name, href, pathname }: { name: string; href: string; pathname?: string }) {
    const isSelected = pathname ? pathname === href : false;
    return (
        <Link
            href={href}
            className={cn(
                'transition-all duration-200 ease-in-out hover:bg-white/10 px-3 lg:px-5 py-1 rounded-md',
                isSelected && 'bg-white/10',
            )}
        >
            {name}
        </Link>
    );
}

function DropdownItem({
    name,
    href,
    disabled = false,
    Icon,
    shortcut,
}: {
    name: string;
    href: string;
    disabled?: boolean;
    Icon?: LucideIcon;
    shortcut?: string;
}) {
    return (
        <Link href={href}>
            <DropdownMenuItem
                disabled={disabled}
                className="cursor-pointer transition-all duration-200 ease-in-out hover:bg-white/10"
            >
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                <span>{name}</span>
                {shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
            </DropdownMenuItem>
        </Link>
    );
}
