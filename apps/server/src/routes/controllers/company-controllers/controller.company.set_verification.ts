import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
    ApiError,
    InvalidRequest,
    NotFound,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import {
    CompanyVerificationStatus,
    NotificationType,
    prisma,
} from "../../../db.ts";
import { notifyMany } from "../../../services/notifications.ts";

const Body = z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
    rejectionNote: z
        .string()
        .max(500, "Keep the note under 500 characters")
        .nullable()
        .optional(),
});

// admin-only transition of company verification status and notify members
export default async function setCompanyVerification(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const id = req.params.id;
        if (!id) throw new InvalidRequest("Missing company id");

        const company = await prisma.company.findUnique({
            where: { id },
            include: { members: { select: { userId: true } } },
        });
        if (!company) throw new NotFound("Company not found");

        if (
            body.status === "REJECTED" &&
            !(body.rejectionNote && body.rejectionNote.trim())
        ) {
            throw new InvalidRequest(
                "Add a short reason so the founder knows what to fix",
            );
        }

        const now = new Date();
        const updated = await prisma.company.update({
            where: { id },
            data:
                body.status === "APPROVED"
                    ? {
                          verificationStatus:
                              CompanyVerificationStatus.APPROVED,
                          rejectionNote: null,
                          approvedAt: now,
                      }
                    : {
                          verificationStatus:
                              CompanyVerificationStatus.REJECTED,
                          rejectionNote: body.rejectionNote!.trim(),
                      },
        });

        const memberIds = company.members.map((m) => m.userId);
        if (body.status === "APPROVED") {
            await notifyMany(memberIds, {
                type: NotificationType.COMPANY_APPROVED,
                title: `${company.name} is verified`,
                body: "You can now post internships and jobs.",
                link: "/home/manage-listings/new",
            });
        } else {
            await notifyMany(memberIds, {
                type: NotificationType.COMPANY_REJECTED,
                title: `${company.name} needs more details`,
                body: body.rejectionNote!.trim(),
                link: "/home/employer/setup",
            });
        }

        api.ok({ company: updated }, "Verification updated");
    } catch (err) {
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        if (err instanceof ZodError) {
            const issue = err.issues[0];
            api.invalidRequest(issue?.message ?? "Invalid request");
            return;
        }
        console.error(err);
        api.internalError();
    }
}
