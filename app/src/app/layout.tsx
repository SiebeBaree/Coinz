import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import React from "react";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Coinz",
};

export default function RootLayout({ children }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <AuthProvider>
            <Navbar/>
            {children}
        </AuthProvider>
        </body>
        </html>
    );
}
