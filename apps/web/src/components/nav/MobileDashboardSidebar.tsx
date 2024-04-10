'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import DashboardSidebar from '@/components/nav/DashboardSidebar';
import { Session } from 'next-auth';

export default function MobileSideBar({ session }: { session: Session }) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
                <DashboardSidebar session={session} />
            </SheetContent>
        </Sheet>
    );
}
