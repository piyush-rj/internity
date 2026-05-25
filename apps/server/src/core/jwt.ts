import {
    createRemoteJWKSet,
    decodeProtectedHeader,
    jwtVerify,
    type JWTPayload,
} from "jose";
import { config } from "../config/config.ts";

const _AUDIENCE = "authenticated";

const jwksUrl = new URL(
    `${config.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json`,
);
const remoteJwks = createRemoteJWKSet(jwksUrl);

const hsSecret = new TextEncoder().encode(config.SUPABASE_JWT_SECRET);

export type SupabaseClaims = JWTPayload & {
    sub?: string;
    email?: string | null;
    phone?: string | null;
    role?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
};

// verifies a supabase jwt and returns claims or null on failure
export async function verifyToken(
    token: string,
): Promise<SupabaseClaims | null> {
    let alg: string | undefined;
    try {
        alg = decodeProtectedHeader(token).alg;
    } catch {
        return null;
    }

    if (!alg) return null;

    try {
        if (alg === "HS256") {
            const { payload } = await jwtVerify<SupabaseClaims>(
                token,
                hsSecret,
                {
                    algorithms: ["HS256"],
                    audience: _AUDIENCE,
                },
            );
            return payload;
        }
        if (alg === "RS256" || alg === "ES256") {
            const { payload } = await jwtVerify<SupabaseClaims>(
                token,
                remoteJwks,
                {
                    algorithms: [alg],
                    audience: _AUDIENCE,
                },
            );
            return payload;
        }
        return null;
    } catch {
        return null;
    }
}
