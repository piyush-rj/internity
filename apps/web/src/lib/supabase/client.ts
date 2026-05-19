import { createBrowserClient } from "@supabase/ssr";
import { ENV } from "@/src/config/config.env";

export function createClient() {
    return createBrowserClient(
        ENV.NEXT_PUBLIC_SUPABASE_URL,
        ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
}
