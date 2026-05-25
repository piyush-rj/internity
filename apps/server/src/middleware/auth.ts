import type { NextFunction, Request, Response } from "express";
import {
    ApiError,
    Forbidden,
    ResponseWriter,
    Unauthorized,
} from "../utils/api-response.ts";
import { verifyToken } from "../core/jwt.ts";
import { prisma, type UserRole } from "../db.ts";
import { isAdminUser } from "../config/config.ts";

export type AuthUser = {
    /** public.User.id (cuid). */
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

        let user = await prisma.user.findUnique({ where: { supabaseUserId } });

        if (!user && (email || phone)) {
            user = await prisma.user.findFirst({
                where: {
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

        if (!user) throw new Unauthorized();

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

/**
 * Admin gate. Accepts either UserRole.ADMIN OR an email in the ADMIN_EMAILS
 * env list — this lets us bootstrap admins without a DB write or a separate
 * admin table. See packages/database/.../auth.ts for the matching frontend
 * check used to gate the /admin UI.
 */
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
