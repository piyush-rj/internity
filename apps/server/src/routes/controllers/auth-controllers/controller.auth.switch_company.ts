import type { Request, Response } from "express";
import { z } from "zod";
import {
    Forbidden,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    companyId: z.string().min(1).nullable(),
});

export default async function switchActiveCompany(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        if (body.companyId) {
            const member = await prisma.companyMember.findUnique({
                where: {
                    companyId_userId: {
                        companyId: body.companyId,
                        userId: req.user!.id,
                    },
                },
                select: { userId: true },
            });
            if (!member) {
                throw new Forbidden("You don't belong to that company");
            }
        }
        await prisma.user.update({
            where: { id: req.user!.id },
            data: { activeCompanyId: body.companyId },
        });
        api.ok({ activeCompanyId: body.companyId });
    } catch (err) {
        handleApiError(err, api);
    }
}
