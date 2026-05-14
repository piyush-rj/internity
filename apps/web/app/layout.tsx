import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { SessionSetter } from "@/src/lib/SessionSetter";
import { cn } from "@/src/lib/utils";
import { getServerSession } from "next-auth";
import { authOption } from "@/app/api/auth/[...nextauth]/options";

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

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getServerSession(authOption);

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
                <SessionSetter session={session} />
                {children}
            </body>
        </html>
    );
}
