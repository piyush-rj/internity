import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/src/lib/api/types";

declare module "next-auth" {
    interface Session {
        user?: DefaultSession["user"] & {
            id?: string | null;
            token?: string | null;
            role?: UserRole;
            provider?: string | null;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        user?: {
            id?: string | null;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            token?: string | null;
            role?: UserRole;
            provider?: string | null;
        };
    }
}
