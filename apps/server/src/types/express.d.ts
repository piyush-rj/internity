import type { UserRole } from "database";

export type AuthUser = {
    id: string;
    email: string;
    name: string;
    role: UserRole;
};

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}
