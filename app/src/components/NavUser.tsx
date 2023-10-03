"use client";

import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

export default function NavUser() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex gap-2 items-center bg-secondary py-2 px-3 rounded-md select-none">
                <Skeleton className="rounded-full w-[28px] h-[28px]"/>
                <Skeleton className="w-20 h-5"/>
            </div>
        );
    } else if (status === "authenticated") {
        return (
            <div className="flex gap-2 items-center bg-secondary py-2 px-3 rounded-md select-none">
                <Image src={session?.user?.image || "https://cdn.discordapp.com/embed/avatars/3.png"}
                       alt="Profile picture" width={28} height={28} className="rounded-full"/>
                <p className="font-medium">{session?.user?.name}</p>
            </div>
        );
    }

    return (
        <button onClick={() => signIn("discord", { callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/profile` })}
                className="bg-primary text-primary-foreground font-semibold rounded-md px-3 py-1">Login</button>
    );
}