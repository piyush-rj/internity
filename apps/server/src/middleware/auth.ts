import type { NextFunction, Request, Response } from "express";
import {
    ApiError,
    Forbidden,
    ResponseWriter,
    Unauthorized,
} from "../utils/api-response.ts";
import { verifyToken, type SupabaseClaims } from "../core/jwt.ts";
import { prisma, type UserRole } from "../db.ts";
import { isAdminUser } from "../config/config.ts";

// 403 error thrown for banned users with a distinct code from forbidden
class AccountDisabled extends ApiError {
    constructor(reason: string | null) {
        super(reason ?? "This account has been disabled. Contact support.", {
            status: 403,
            code: "ACCOUNT_DISABLED",
        });
    }
}

export type AuthUser = {
    id: string;
    name: string | null;
    email: string | null;
    role: UserRole;
};

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const auth = req.header("authorization");
        if (!auth || !auth.startsWith("Bearer ")) throw new Unauthorized();
        const token = auth.slice("Bearer ".length).trim();
        if (!token) throw new Unauthorized();

        const claims = await verifyToken(token);
        if (!claims?.sub) throw new Unauthorized();

        const supabaseUserId = claims.sub;
        const email = claims.email ?? null;
        const phone = claims.phone ?? null;

        // Resolve the public.User row for this Supabase identity. Soft-deleted
        // rows are treated as if they don't exist — the JIT-create branch
        // below will give the caller a fresh row, which is what makes the
        // "delete account, sign back in, see the new-user flow" UX work.
        let user = await prisma.user.findUnique({
            where: { supabaseUserId },
        });

        // Stale link from a row deleted before this middleware was hardened —
        // free the supabaseUserId so JIT-create can re-use it without
        // colliding with the unique constraint.
        if (user?.deletedAt) {
            await prisma.user.update({
                where: { id: user.id },
                data: { supabaseUserId: null },
            });
            user = null;
        }

        if (!user && (email || phone)) {
            user = await prisma.user.findFirst({
                where: {
                    deletedAt: null,
                    OR: [
                        ...(email ? [{ email }] : []),
                        ...(phone ? [{ phone }] : []),
                    ],
                },
            });
            if (user && user.supabaseUserId === null) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { supabaseUserId },
                });
            }
        }

        // First sign-in (or sign-in after a deletion) — bootstrap a fresh
        // public.User row from whatever Supabase put in the JWT. The DB
        // trigger does the same thing on auth.users INSERT/UPDATE; this is
        // the runtime fallback for the case where the trigger didn't fire
        // (e.g., a returning user whose auth.users row already existed).
        if (!user) {
            user = await prisma.user.create({
                data: {
                    supabaseUserId,
                    email,
                    phone,
                    name: nameFromClaims(claims),
                    image: avatarFromClaims(claims),
                },
            });
        }

        // banned users are blocked except admins
        if (user.isBanned && user.role !== "ADMIN") {
            throw new AccountDisabled(user.banReason);
        }

        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
        next();
    } catch (err) {
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        console.error(err);
        api.internalError();
    }
}

function nameFromClaims(claims: SupabaseClaims): string | null {
    const md = claims.user_metadata ?? {};
    const full = (md.full_name ?? md.name) as unknown;
    return typeof full === "string" && full.trim() ? full.trim() : null;
}

function avatarFromClaims(claims: SupabaseClaims): string | null {
    const md = claims.user_metadata ?? {};
    const url = md.avatar_url as unknown;
    return typeof url === "string" && url.trim() ? url.trim() : null;
}

export function requireRole(...roles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const api = new ResponseWriter(res);
        try {
            if (!req.user) throw new Unauthorized();
            if (!roles.includes(req.user.role)) {
                throw new Forbidden("Forbidden: insufficient role");
            }
            next();
        } catch (err) {
            if (err instanceof ApiError) {
                api.fail(err.status, err.code, err.message);
                return;
            }
            console.error(err);
            api.internalError();
        }
    };
}

// middleware that allows only admin role or whitelisted admin emails
export function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const api = new ResponseWriter(res);
    try {
        if (!req.user) throw new Unauthorized();
        if (!isAdminUser(req.user)) {
            throw new Forbidden("Admin access required");
        }
        next();
    } catch (err) {
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        console.error(err);
        api.internalError();
    }
}
