import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "database";
import ResponseWriter from "../class/response_writer";

export function require_role(...roles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            ResponseWriter.unauthorized(res);
            return;
        }
        if (!roles.includes(req.user.role)) {
            ResponseWriter.unauthorized(
                res,
                "Forbidden: insufficient role",
                403,
            );
            return;
        }
        next();
    };
}
