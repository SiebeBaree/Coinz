import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import React from "react";
import Navbar from "@/components/nav/Navbar";
import AuthProvider from "@/components/AuthProvider";
import Footer from "@/components/Footer";
import { getServerAuthSession } from "@/server/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Coinz",
};

export default async function RootLayout({ children }: {
    children: React.ReactNode
}) {
    const session = await getServerAuthSession();

    return (
        <html lang="en">
        <body className={inter.className}>
        <AuthProvider>
            <Navbar session={session}/>
            <div className="pb-12" style={{
                minHeight: "calc(100vh - 60px - 100px)",
            }}>
                {children}
            </div>
            <Footer/>
        </AuthProvider>
        </body>
        </html>
    );
}
