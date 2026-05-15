import type { Request, Response, NextFunction } from "express";
import { prisma, CompanyRole } from "database";
import ResponseWriter from "../class/response_writer";

export function require_company_member(
    opts: { paramKey?: string; ownerOnly?: boolean } = {},
) {
    const paramKey = opts.paramKey ?? "id";
    const ownerOnly = opts.ownerOnly ?? false;

    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            ResponseWriter.unauthorized(res);
            return;
        }

        const companyId = req.params[paramKey];
        if (typeof companyId !== "string") {
            ResponseWriter.invalid_data(res, "Missing company id");
            return;
        }

        try {
            const member = await prisma.companyMember.findUnique({
                where: { companyId_userId: { companyId, userId: req.user.id } },
            });
            if (!member) {
                ResponseWriter.unauthorized(
                    res,
                    "Not a member of this company",
                    403,
                );
                return;
            }

            if (ownerOnly && member.role !== CompanyRole.OWNER) {
                ResponseWriter.unauthorized(res, "Owner-only action", 403);
                return;
            }

            next();
        } catch (err) {
            console.error("company-member middleware error:", err);
            ResponseWriter.server_error(res);
        }
    };
}
