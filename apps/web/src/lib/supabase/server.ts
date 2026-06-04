import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { ENV } from "@/src/config/config.env";

export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        ENV.NEXT_PUBLIC_SUPABASE_URL,
        ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, {
                                ...options,
                                maxAge: 60 * 60 * 24 * 30,
                            }),
                        );
                    } catch {}
                },
            },
        },
    );
}
