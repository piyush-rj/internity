import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ENV } from "@/src/config/config.env";

// Path prefixes that require an authenticated Supabase user. Anything not
// listed here is public (landing, /pricing, /company/:slug, /auth/*).
const PROTECTED_PREFIXES = ["/home", "/admin"];

function isProtected(pathname: string): boolean {
    return PROTECTED_PREFIXES.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
}

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

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Gate /home + /admin behind auth. Unauthed users get bounced to the
    // landing page with ?next= so the AuthRedirectListener can pop the
    // sign-in dialog with that destination, and /auth/callback honours the
    // same param to land them back on the original page.
    if (!user && isProtected(request.nextUrl.pathname)) {
        const landingUrl = request.nextUrl.clone();
        landingUrl.pathname = "/";
        landingUrl.search = "";
        landingUrl.searchParams.set(
            "next",
            request.nextUrl.pathname + request.nextUrl.search,
        );
        return NextResponse.redirect(landingUrl);
    }

    return supabaseResponse;
}
