import type { Request, Response } from "express";
import z from "zod";
import { prisma, CompanyRole } from "database";
import ResponseWriter from "../../class/response_writer";

export default class CompanyMemberController {
    static add_schema = z.object({
        email: z.email(),
        role: z.enum([CompanyRole.OWNER, CompanyRole.MEMBER]).optional(),
    });

    static update_role_schema = z.object({
        role: z.enum([CompanyRole.OWNER, CompanyRole.MEMBER]),
    });

    // GET /company/:id/members — any member can list
    static async list(req: Request, res: Response) {
        const companyId = req.params.id;
        if (typeof companyId !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const members = await prisma.companyMember.findMany({
                where: { companyId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                        },
                    },
                },
                orderBy: { joinedAt: "asc" },
            });
            ResponseWriter.success(res, { members });
        } catch (err) {
            console.error("member.list:", err);
            ResponseWriter.server_error(res);
        }
    }

    // POST /company/:id/members — OWNER-only (enforced in route)
    static async add(req: Request, res: Response) {
        const companyId = req.params.id;
        if (typeof companyId !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        const { data, success } = CompanyMemberController.add_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const user = await prisma.user.findUnique({
                where: { email: data.email },
                select: { id: true },
            });
            if (!user) {
                ResponseWriter.not_found(res, "No user with that email");
                return;
            }
            const member = await prisma.companyMember.create({
                data: {
                    companyId,
                    userId: user.id,
                    role: data.role ?? CompanyRole.MEMBER,
                },
            });
            ResponseWriter.success(res, { member }, "Member added", 201);
        } catch (err) {
            console.error("member.add:", err);
            ResponseWriter.server_error(res);
        }
    }

    // PATCH /company/:id/members/:userId — OWNER-only
    static async update_role(req: Request, res: Response) {
        const companyId = req.params.id;
        const userId = req.params.userId;
        if (typeof companyId !== "string" || typeof userId !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        const { data, success } =
            CompanyMemberController.update_role_schema.safeParse(req.body);
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            // Block demoting the last OWNER
            if (data.role === CompanyRole.MEMBER) {
                const target = await prisma.companyMember.findUnique({
                    where: { companyId_userId: { companyId, userId } },
                });
                if (!target) {
                    ResponseWriter.not_found(res);
                    return;
                }
                if (target.role === CompanyRole.OWNER) {
                    const ownerCount = await prisma.companyMember.count({
                        where: { companyId, role: CompanyRole.OWNER },
                    });
                    if (ownerCount <= 1) {
                        ResponseWriter.invalid_data(
                            res,
                            "Cannot demote the last owner",
                        );
                        return;
                    }
                }
            }

            const member = await prisma.companyMember.update({
                where: { companyId_userId: { companyId, userId } },
                data: { role: data.role },
            });
            ResponseWriter.success(res, { member });
        } catch (err) {
            console.error("member.update_role:", err);
            ResponseWriter.server_error(res);
        }
    }

    // DELETE /company/:id/members/:userId — OWNER-only
    static async remove(req: Request, res: Response) {
        const companyId = req.params.id;
        const userId = req.params.userId;
        if (typeof companyId !== "string" || typeof userId !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const target = await prisma.companyMember.findUnique({
                where: { companyId_userId: { companyId, userId } },
            });
            if (!target) {
                ResponseWriter.not_found(res);
                return;
            }
            if (target.role === CompanyRole.OWNER) {
                const ownerCount = await prisma.companyMember.count({
                    where: { companyId, role: CompanyRole.OWNER },
                });
                if (ownerCount <= 1) {
                    ResponseWriter.invalid_data(
                        res,
                        "Cannot remove the last owner",
                    );
                    return;
                }
            }
            await prisma.companyMember.delete({
                where: { companyId_userId: { companyId, userId } },
            });
            ResponseWriter.success(res, { ok: true });
        } catch (err) {
            console.error("member.remove:", err);
            ResponseWriter.server_error(res);
        }
    }
}
