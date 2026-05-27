import type { Request, Response } from "express";
import { z } from "zod";
import {
    Forbidden,
    InvalidRequest,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma, ReportTargetType, UserRole } from "../../../db.ts";

const Body = z
    .object({
        targetType: z.enum(["LISTING", "STUDENT"]),
        targetListingId: z.string().nullable().optional(),
        targetStudentId: z.string().nullable().optional(),
        reason: z
            .string()
            .min(10, "Add a few words explaining the issue")
            .max(2000),
    })
    .refine(
        (v) =>
            (v.targetType === "LISTING" && !!v.targetListingId) ||
            (v.targetType === "STUDENT" && !!v.targetStudentId),
        { message: "Report target id is required" },
    );

export default async function createReport(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const reporter = req.user!;

        if (body.targetType === "LISTING") {
            // Only students may file abuse reports against listings.
            if (reporter.role !== UserRole.STUDENT) {
                throw new Forbidden("Only students can report internships");
            }
            const listing = await prisma.listing.findUnique({
                where: { id: body.targetListingId! },
                select: { id: true },
            });
            if (!listing) throw new NotFound("Listing not found");
        } else {
            // Only employers may report students.
            if (reporter.role !== UserRole.EMPLOYER) {
                throw new Forbidden("Only employers can report students");
            }
            const student = await prisma.user.findUnique({
                where: { id: body.targetStudentId! },
                select: { id: true, role: true },
            });
            if (!student || student.role !== UserRole.STUDENT) {
                throw new NotFound("Student not found");
            }
            if (student.id === reporter.id) {
                throw new InvalidRequest("You can't report yourself");
            }
        }

        const report = await prisma.report.create({
            data: {
                reporterId: reporter.id,
                targetType: body.targetType as ReportTargetType,
                targetListingId: body.targetListingId ?? null,
                targetStudentId: body.targetStudentId ?? null,
                reason: body.reason.trim(),
            },
        });

        api.created({ report }, "Report submitted");
    } catch (err) {
        handleApiError(err, api);
    }
}
