import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
    ApiError,
    InvalidRequest,
    NotFound,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { prisma } from "../../../db.ts";

const Body = z.object({
    verified: z.boolean(),
});

// admin-only toggle for the display-only "verified student" badge
export default async function setStudentVerification(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const id = req.params.id;
        if (!id) throw new InvalidRequest("Missing user id");
        const body = Body.parse(req.body);

        const profile = await prisma.studentProfile.findUnique({
            where: { userId: id },
            select: { id: true },
        });
        if (!profile) throw new NotFound("Student not found");

        const updated = await prisma.studentProfile.update({
            where: { userId: id },
            data: { isVerified: body.verified },
            select: { userId: true, isVerified: true },
        });

        api.ok(
            { student: updated },
            body.verified ? "Student marked verified" : "Verification removed",
        );
    } catch (err) {
        if (err instanceof ZodError) {
            const issue = err.issues[0];
            api.invalidRequest(issue?.message ?? "Invalid request");
            return;
        }
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        handleApiError(err, api);
    }
}
