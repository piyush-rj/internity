import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

/**
 * OAuth callback. Supabase redirects here with `?code=...` after the user
 * approves on the provider (Google). We exchange the code for a session
 * (cookies get set), then bounce them to the desired post-login page.
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/home/dashboard";

    if (!code) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        return NextResponse.redirect(
            `${origin}/auth/auth-code-error?message=${encodeURIComponent(error.message)}`,
        );
    }

    return NextResponse.redirect(`${origin}${next}`);
}
