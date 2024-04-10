'use client';

import { Session } from 'next-auth';
import MobileSideBar from '@/components/nav/MobileDashboardSidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, Cloud, LifeBuoy, LogOut, LucideIcon, Plus } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardNavbar({ session }: { session: Session }) {
    const pathname = usePathname();

    return (
        <div className="flex justify-between items-center p-4 h-16">
            <div className="flex items-center gap-3">
                <MobileSideBar session={session} />
                <h2 className="text-2xl font-bold capitalize">{pathname.trim().split('/').pop()}</h2>
            </div>

            <div>
                <DropdownMenu>
                    <DropdownMenuTrigger className="outline-none group">
                        <div className="flex gap-2 items-center bg-secondary py-2 px-3 rounded-md select-none border-highlight">
                            <Avatar className="w-7 h-7">
                                <AvatarImage
                                    src={session?.user?.image ?? 'https://cdn.discordapp.com/embed/avatars/3.png'}
                                />
                                <AvatarFallback>
                                    {session?.user?.name
                                        ?.split(' ')
                                        .map((name) => name[0])
                                        .join('') ?? 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <p className="font-medium">{session?.user?.name}</p>
                            <ChevronDown className="h-4 w-4 text-muted transition-all duration-300 ease-in-out group-data-[state=open]:rotate-180" />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 mr-4 z-50">
                        <DropdownMenuGroup>
                            <DropdownItem name="Invite Coinz" href="/invite" Icon={Plus} />
                            <DropdownItem name="Support" href="/support" Icon={LifeBuoy} />
                            <DropdownItem name="Statistics" Icon={Cloud} shortcut="SOON" disabled={true} />
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
            </div>
        </div>
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
        <Link href={href ?? '#'}>
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
