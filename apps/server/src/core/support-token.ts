import { SignJWT, jwtVerify } from "jose";
import { config } from "../config/config.ts";

// Support-agent tokens are minted by us (not Supabase) for the hardcoded
// email/password identity. We reuse the Supabase HS256 secret to sign them,
// but pin a distinct audience so these tokens and Supabase tokens can never be
// accepted by each other's verifier:
//   - verifyToken() (Supabase) requires aud "authenticated"
//   - verifySupportAgentToken() requires aud "support-agent"
const SUPPORT_AUDIENCE = "support-agent";
const SUPPORT_ISSUER = "spiderskill-support";
const TOKEN_TTL = "7d";

const secret = new TextEncoder().encode(config.SUPABASE_JWT_SECRET);

// Issues a signed token for the given support-agent DB user id.
export async function mintSupportAgentToken(userId: string): Promise<string> {
    return new SignJWT({ support_agent: true })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setSubject(userId)
        .setAudience(SUPPORT_AUDIENCE)
        .setIssuer(SUPPORT_ISSUER)
        .setIssuedAt()
        .setExpirationTime(TOKEN_TTL)
        .sign(secret);
}

// Verifies a support-agent token. Returns the DB user id (sub) or null.
export async function verifySupportAgentToken(
    token: string,
): Promise<{ sub: string } | null> {
    try {
        const { payload } = await jwtVerify(token, secret, {
            algorithms: ["HS256"],
            audience: SUPPORT_AUDIENCE,
            issuer: SUPPORT_ISSUER,
        });
        if (payload.support_agent !== true || typeof payload.sub !== "string") {
            return null;
        }
        return { sub: payload.sub };
    } catch {
        return null;
    }
}
