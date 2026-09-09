import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CashProvider } from "@/contexts/CashContext";
import { FlagProvider } from "@/contexts/FlagContext";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Gdev POS Lite",
    description: "Sistema de punto de venta omnicanal por GDEV Software Solutions",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100`}
        >
        <AuthProvider>
            <FlagProvider>
                <CashProvider>
                    <Navbar />
                    <main>{children}</main>
                </CashProvider>
            </FlagProvider>
        </AuthProvider>
        </body>
        </html>
    );
}