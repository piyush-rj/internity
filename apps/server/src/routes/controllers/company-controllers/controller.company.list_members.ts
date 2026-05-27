import type { Request, Response } from "express";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function listCompanyMembers(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const members = await prisma.companyMember.findMany({
            where: { companyId: req.params.id as string },
            orderBy: { joinedAt: "asc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        deletedAt: true,
                    },
                },
            },
        });
        api.ok({ members });
    } catch (err) {
        handleApiError(err, api);
    }
}
