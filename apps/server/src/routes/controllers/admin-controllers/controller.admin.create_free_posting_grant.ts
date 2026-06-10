import type { Request, Response } from "express";
import { z } from "zod";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { NotificationType, prisma } from "../../../db.ts";
import { notify } from "../../../services/notifications.ts";

const Body = z.object({
    companyId: z.string().min(1),
    grantedPostings: z.number().int().min(1).max(1000),
    note: z.string().max(500).optional(),
    expiresAt: z.coerce.date().optional(),
});

export default async function createFreePostingGrant(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const adminId = req.user!.id;

        const company = await prisma.company.findUnique({
            where: { id: body.companyId },
            select: { id: true, name: true },
        });
        if (!company) {
            api.notFound();
            return;
        }

        const grant = await prisma.freePostingGrant.create({
            data: {
                companyId: body.companyId,
                grantedPostings: body.grantedPostings,
                note: body.note?.trim() ?? null,
                expiresAt: body.expiresAt ?? null,
                grantedById: adminId,
            },
        });

        // Notify the company's FOUNDER_OWNER.
        const founder = await prisma.companyMember.findFirst({
            where: { companyId: body.companyId, role: "FOUNDER_OWNER" },
            select: { userId: true },
        });
        if (founder) {
            const expiryNote = grant.expiresAt
                ? ` Valid until ${grant.expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`
                : "";
            await notify({
                userId: founder.userId,
                type: NotificationType.FREE_POSTING_GRANTED,
                title: `${body.grantedPostings} free listing${body.grantedPostings === 1 ? "" : "s"} granted`,
                body: `Your company "${company.name}" has been granted ${body.grantedPostings} free job posting${body.grantedPostings === 1 ? "" : "s"} by the SpiderSkill team.${expiryNote}`,
                link: "/home/manage-listings",
            });
        }

        api.ok({
            grant: {
                id: grant.id,
                grantedPostings: grant.grantedPostings,
                expiresAt: grant.expiresAt?.toISOString() ?? null,
                companyName: company.name,
            },
        });
    } catch (err) {
        handleApiError(err, api);
    }
}
