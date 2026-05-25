import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

// exchanges the oauth code from supabase for a session and redirects
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
