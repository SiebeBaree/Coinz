'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Sidebar from '@/components/nav/sidebar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
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

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0">
                    <Sidebar />
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
