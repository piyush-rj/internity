import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Suspense } from "react";
import { SessionSetter } from "@/src/lib/SessionSetter";
import { AuthDialog } from "@/src/components/auth/AuthDialog";
import { AuthRedirectListener } from "@/src/components/auth/AuthRedirectListener";
import { cn } from "@/src/lib/utils";

const poppins = Poppins({
    variable: "--font-poppins",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Internity – Internships, jobs and trainings for students",
    description:
        "India's largest career platform for students. Find internships, entry-level jobs and online trainings from 200,000+ companies.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={cn(
                poppins.variable,
                geistMono.variable,
                "h-full antialiased",
            )}
        >
            <body className="min-h-full flex flex-col bg-background text-foreground">
                <SessionSetter />
                <Suspense fallback={null}>
                    <AuthRedirectListener />
                </Suspense>
                {children}
                <AuthDialog />
                <Toaster
                    position="bottom-right"
                    richColors
                    closeButton
                    toastOptions={{
                        classNames: {
                            toast: "rounded-lg border border-border shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)]",
                        },
                    }}
                />
            </body>
        </html>
    );
}
