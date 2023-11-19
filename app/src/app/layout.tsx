import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import React from "react";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";
import Footer from "@/components/Footer";

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
            <main className="container mx-auto px-5 pb-12" style={{
                minHeight: "calc(100vh - 60px - 100px)",
            }}>
                {children}
            </main>
            <Footer/>
        </AuthProvider>
        </body>
        </html>
    );
}
