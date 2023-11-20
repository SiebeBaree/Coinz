"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Session } from "next-auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "@/components/nav/Sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { signIn } from "next-auth/react";

export default function Navbar({ session }: {
    session: Session | null;
}) {
    const pathname = usePathname();

    return (
        <nav className="container flex justify-between items-center p-4 h-[60px] z-50">
            <div className="flex gap-6 lg:gap-12 items-center">
                <Link href="/" className="font-bold text-2xl" style={{
                    fontFamily: "Ginto Nord, inter, roboto, sans-serif",
                }}>Coinz</Link>

                <div className="hidden md:flex md:gap-3 lg:gap-6">
                    <NavItem name="FAQ" href="/faq" pathname={pathname}/>
                    <NavItem name="Commands" href="/commands" pathname={pathname}/>
                    <NavItem name="Items" href="/items" pathname={pathname}/>
                    <NavItem name="Investments" href="/investments" pathname={pathname}/>
                    <NavItem name="Status" href="/status" pathname={pathname}/>
                    <NavItem name="Changelog" href="/changelog" pathname={pathname}/>
                    <NavItem name="Invite" href="/invite" className="hidden lg:block"/>
                    <NavItem name="Support" href="/support" className="hidden lg:block"/>
                </div>
            </div>

            <div className="hidden md:block">
                <div className="flex md:gap-3 lg:gap-6 justify-between items-center">
                    <NavItem name="Premium" href="/premium" pathname={pathname}/>

                    {session ? (
                        <div className="flex gap-2 items-center bg-secondary py-2 px-3 rounded-md select-none">
                            <Image src={session?.user?.image || "https://cdn.discordapp.com/embed/avatars/3.png"}
                                   alt="Profile picture" width={28} height={28} className="rounded-full"/>
                            <p className="font-medium">{session?.user?.name}</p>
                        </div>
                    ) : (
                        <Button onClick={() => signIn("discord", { callbackUrl: "/profile" })}
                                size="sm" className="px-5">
                            Login
                        </Button>
                    )}
                </div>
            </div>

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu/>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0">
                    <Sidebar session={session}/>
                </SheetContent>
            </Sheet>
        </nav>
    );
}

export function NavItem({ name, href, pathname, className }: {
    name: string;
    href: string;
    pathname?: string;
    className?: string;
}) {
    const isSelected = pathname ? pathname === href : false;
    return (
        <Link href={href}
              className={cn(className, isSelected && "transition-all duration-200 ease-in-out font-bold text-primary")}>{name}</Link>
    );
}