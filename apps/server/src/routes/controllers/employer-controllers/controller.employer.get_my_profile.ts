import type { Request, Response } from "express";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function getMyEmployerProfile(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const [profile, memberships] = await Promise.all([
            prisma.employerProfile.findUnique({
                where: { userId: req.user!.id },
            }),
            prisma.companyMember.findMany({
                where: { userId: req.user!.id },
                include: {
                    company: {
                        include: { freePostingGrants: true },
                    },
                },
            }),
        ]);
        api.ok({ profile, memberships });
    } catch (err) {
        handleApiError(err, api);
    }
}
