"use client";

import Link from "next/link";
import styles from "@/styles/Navbar.module.css";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="container mx-auto px-5 flex justify-between items-center h-[60px] z-50">
            <div className="flex gap-12 items-center">
                <Link href="/" className="font-bold text-2xl" style={{
                    fontFamily: "Ginto Nord, inter, roboto, sans-serif",
                }}>Coinz</Link>

                <div className="flex gap-6">
                    <Link href="/faq" className={cn(pathname === "/faq" ? styles.activeNav : "", "")}>FAQ</Link>
                    <Link href="/commands"
                          className={cn(pathname === "/commands" ? styles.activeNav : "", "")}>Commands</Link>
                    <Link href="/items" className={cn(pathname === "/items" ? styles.activeNav : "", "")}>Items</Link>
                    <Link href="/investments"
                          className={cn(pathname === "/investments" ? styles.activeNav : "", "")}>Investments</Link>
                    <Link href="/status"
                          className={cn(pathname === "/status" ? styles.activeNav : "", "")}>Status</Link>
                    <Link href="/changelog"
                          className={cn(pathname === "/changelog" ? styles.activeNav : "", "")}>Changelog</Link>
                    <Link href="/invite" target="_blank">Invite</Link>
                    <Link href="/suppport" target="_blank">Support</Link>
                </div>
            </div>

            <div className="flex gap-6 justify-between items-center">
                <Link href="/premium" className={cn(pathname === "/premium" ? styles.activeNav : "", "")}>Premium</Link>
                <Link href="/login"
                      className="bg-primary text-primary-foreground font-semibold rounded-md px-3 py-1">Login</Link>
            </div>
        </nav>
    );
}