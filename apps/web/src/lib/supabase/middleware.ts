import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ENV } from "@/src/config/config.env";

/**
 * Refresh the Supabase auth cookie on every request that flows through
 * Next.js middleware. Without this, the access token expires (default 1h)
 * and downstream Server Components see a logged-out user.
 *
 * IMPORTANT: must call `supabase.auth.getUser()` here — that's what triggers
 * the cookie refresh. Don't replace with getSession().
 */
export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        ENV.NEXT_PUBLIC_SUPABASE_URL,
        ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value),
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options),
                    );
                },
            },
        },
    );

    await supabase.auth.getUser();

    return supabaseResponse;
}
