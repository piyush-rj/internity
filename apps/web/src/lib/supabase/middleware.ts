import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ENV } from "@/src/config/config.env";

// Path prefixes that require an authenticated Supabase user. Anything not
// listed here is public (landing, /company/:slug, /auth/*).
const PROTECTED_PREFIXES = ["/home", "/admin"];

// Routes that live under a protected prefix but are intentionally public so
// signed-out visitors can browse them read-only. The internships list is
// open; clicking through to a listing (/home/listings/:id) stays gated, so
// any apply/save action still funnels through the sign-in dialog.
const PUBLIC_EXCEPTIONS = ["/home/internships"];

function isProtected(pathname: string): boolean {
    if (PUBLIC_EXCEPTIONS.includes(pathname)) return false;
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
                        supabaseResponse.cookies.set(name, value, {
                            ...options,
                            maxAge: 60 * 60 * 24 * 30,
                        }),
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

    // Signed-in users have no business on the marketing landing page — always
    // bounce them to their dashboard. The landing page is reserved for
    // signed-out visitors.
    if (user && request.nextUrl.pathname === "/") {
        const dashboardUrl = request.nextUrl.clone();
        dashboardUrl.pathname = "/home/dashboard";
        dashboardUrl.search = "";
        return NextResponse.redirect(dashboardUrl);
    }

    return supabaseResponse;
}
