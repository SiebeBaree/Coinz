'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Session } from 'next-auth';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Sidebar from '@/components/nav/sidebar';
import { ChevronDown, LucideIcon, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { CreditCard, LifeBuoy, LogOut, Plus, LayoutDashboard } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { login } from '@/actions/login';
import { logout } from '@/actions/logout';

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

                    {session && session.user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger className="outline-none group">
                                <div className="flex gap-2 items-center bg-secondary py-2 px-3 rounded-md select-none border-highlight">
                                    <Avatar className="w-7 h-7">
                                        <AvatarImage src={session.user.image ?? '/logo.png'} />
                                        <AvatarFallback>
                                            {session.user.name
                                                ?.split(' ')
                                                .map((name) => name[0])
                                                .join('') ?? 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="font-medium">{session.user.name}</p>
                                    <ChevronDown className="h-4 w-4 text-muted transition-all duration-300 ease-in-out group-data-[state=open]:rotate-180" />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48 mr-4">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownItem name="Dashboard" href="/dashboard" Icon={LayoutDashboard} />
                                    <DropdownItem name="Billing" href="/billing" Icon={CreditCard} />
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownItem name="Invite Coinz" href="/invite" Icon={Plus} />
                                    <DropdownItem name="Support" href="/support" Icon={LifeBuoy} />
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer transition-all duration-200 ease-in-out hover:bg-white/10 text-red-400"
                                    onClick={logout}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button className="px-5 py-2 h-auto" onClick={() => login()}>
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
    href?: string;
    disabled?: boolean;
    Icon?: LucideIcon;
    shortcut?: string;
}) {
    return (
        <Link href={href ?? ''} className={cn(!href && 'pointer-events-none')}>
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
