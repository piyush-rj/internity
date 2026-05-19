/**
 * Supabase JWT verification.
 *
 * We do not issue tokens — Supabase Auth (GoTrue) does. This module only
 * verifies tokens minted by Supabase for our project.
 *
 * Supabase ships two signing modes:
 *
 *   - Legacy HS256 — symmetric, shared secret in `SUPABASE_JWT_SECRET`.
 *   - JWT Signing Keys — asymmetric (RS256 / ES256), public keys served
 *     from the project's JWKS endpoint.
 *
 * We inspect the unverified header to pick the right key for each token,
 * so both modes work during the rolling cutover Supabase performs when a
 * project enables Signing Keys.
 */

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

/** Verify a Supabase JWT. Returns the claims on success, `null` on any failure. */
export async function verifyToken(token: string): Promise<SupabaseClaims | null> {
    let alg: string | undefined;
    try {
        alg = decodeProtectedHeader(token).alg;
    } catch {
        return null;
    }

    if (!alg) return null;

    try {
        if (alg === "HS256") {
            const { payload } = await jwtVerify<SupabaseClaims>(token, hsSecret, {
                algorithms: ["HS256"],
                audience: _AUDIENCE,
            });
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
