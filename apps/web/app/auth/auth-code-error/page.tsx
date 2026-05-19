import Link from "next/link";

export default async function AuthCodeErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string }>;
}) {
    const { message } = await searchParams;

    return (
        <main className="min-h-screen flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center space-y-4">
                <h1 className="text-2xl font-semibold">
                    Couldn&apos;t finish sign-in
                </h1>
                <p className="text-sm text-muted-foreground">
                    {message ??
                        "Something went wrong while completing your sign-in. Please try again."}
                </p>
                <Link
                    href="/login"
                    className="inline-block rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
                >
                    Back to sign-in
                </Link>
            </div>
        </main>
    );
}
