import type { Request, Response } from "express";
import { ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { NotificationType, prisma } from "../../../db.ts";
import { notify } from "../../../services/notifications.ts";

export default async function revokeFreePostingGrant(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const { id } = req.params;
        const adminId = req.user!.id;

        const grant = await prisma.freePostingGrant.findUnique({
            where: { id },
            include: {
                company: { select: { id: true, name: true } },
            },
        });

        if (!grant) {
            api.notFound();
            return;
        }
        if (!grant.isActive) {
            api.fail(409, "ALREADY_REVOKED", "This grant is already revoked.");
            return;
        }

        await prisma.freePostingGrant.update({
            where: { id },
            data: {
                isActive: false,
                revokedAt: new Date(),
                revokedById: adminId,
            },
        });

        // Notify the company's FOUNDER_OWNER.
        const founder = await prisma.companyMember.findFirst({
            where: { companyId: grant.companyId, role: "FOUNDER_OWNER" },
            select: { userId: true },
        });
        if (founder) {
            await notify({
                userId: founder.userId,
                type: NotificationType.FREE_POSTING_REVOKED,
                title: "Free posting grant revoked",
                body: `The free posting grant for "${grant.company.name}" has been revoked by the SpiderSkill team.`,
                link: "/home/manage-listings",
            });
        }

        api.ok({ ok: true });
    } catch (err) {
        handleApiError(err, api);
    }
}
