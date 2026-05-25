import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
    ApiError,
    Forbidden,
    NotFound,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

export default async function listApplicationsForListing(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const id = req.params.id as string;
        const found = await prisma.listing.findUnique({
            where: { id },
            select: { companyId: true, screeningQuestions: true },
        });
        if (!found) throw new NotFound();
        const member = await prisma.companyMember.findUnique({
            where: {
                companyId_userId: {
                    companyId: found.companyId,
                    userId: req.user!.id,
                },
            },
        });
        if (!member) throw new Forbidden("Not a member of this company");

        // The founder is opening their applicants list — stamp every unseen
        // applicant on this listing as seen. Orthogonal to status; runs
        // before the read below so the returned rows carry the fresh
        // seenAt value.
        await prisma.application.updateMany({
            where: { listingId: id, seenAt: null },
            data: { seenAt: new Date() },
        });

        const rows = await prisma.application.findMany({
            where: { listingId: id },
            orderBy: { appliedAt: "desc" },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        studentProfile: {
                            select: {
                                firstName: true,
                                lastName: true,
                                phone: true,
                                city: true,
                                bio: true,
                            },
                        },
                    },
                },
            },
        });
        api.ok({
            items: rows,
            screeningQuestions: found.screeningQuestions,
        });
    } catch (err) {
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        if (err instanceof ZodError) {
            const issue = err.issues[0];
            const where = issue?.path.join(".") || "body";
            api.invalidRequest(
                `Invalid ${where}: ${issue?.message ?? "invalid"}`,
            );
            return;
        }
        console.error(err);
        api.internalError();
    }
}
