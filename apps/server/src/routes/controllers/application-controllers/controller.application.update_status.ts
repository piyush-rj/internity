import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import { ApiError, Forbidden, NotFound, ResponseWriter, handleApiError } from "../../../utils/api-response.ts";
import { ApplicationStatus, NotificationType, prisma } from "../../../db.ts";
import { notify } from "../../../services/notifications.ts";

const Body = z.object({
    status: z.enum([
        "APPLIED",
        "SHORTLISTED",
        "INTERVIEW",
        "HIRED",
        "REJECTED",
    ]),
});

const STATUS_LABEL: Record<ApplicationStatus, string> = {
    APPLIED: "Applied",
    SHORTLISTED: "Shortlisted",
    INTERVIEW: "Interview",
    HIRED: "Hired",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn",
};

export default async function updateApplicationStatus(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const id = req.params.id as string;
        const a = await prisma.application.findUnique({
            where: { id },
            include: { listing: { include: { company: true } } },
        });
        if (!a) throw new NotFound();

        const member = await prisma.companyMember.findUnique({
            where: {
                companyId_userId: {
                    companyId: a.listing.companyId,
                    userId: req.user!.id,
                },
            },
        });
        if (!member) throw new Forbidden("Not a member of this company");

        const status = body.status as ApplicationStatus;
        const updated = await prisma.application.update({
            where: { id },
            data: { status, statusUpdatedAt: new Date() },
            include: { listing: { include: { company: true } } },
        });

        const label = STATUS_LABEL[status];
        await notify({
            userId: updated.studentId,
            type: NotificationType.APPLICATION_STATUS_CHANGED,
            title: `${updated.listing.company.name} marked you as ${label}`,
            body: `${updated.listing.title} · ${label}`,
            link: "/home/applications",
        });

        api.ok({ application: updated });
    } catch (err) {
        handleApiError(err, api);
    }
}
