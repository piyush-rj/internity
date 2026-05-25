import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
    ApiError,
    NotFound,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { CompanyVerificationStatus, prisma } from "../../../db.ts";

const Body = z.object({
    name: z.string().min(1).optional(),
    logoUrl: z.string().url().nullable().optional(),
    website: z.string().url("Enter a valid website URL").nullable().optional(),
    linkedinUrl: z
        .string()
        .url("Enter a valid LinkedIn URL")
        .min(1)
        .optional(),
    foundingYear: z
        .number()
        .int()
        .min(1800, "Founding year looks too far back")
        .max(new Date().getUTCFullYear(), "Founding year can't be in the future")
        .optional(),
    about: z.string().nullable().optional(),
    industry: z.string().nullable().optional(),
    size: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
});

export default async function updateCompany(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const id = req.params.id as string;
        const c = await prisma.company.findUnique({ where: { id } });
        if (!c) throw new NotFound();
        const data: Record<string, unknown> = {};
        if (body.name !== undefined) data.name = body.name;
        if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl;
        if (body.website !== undefined) data.website = body.website;
        if (body.linkedinUrl !== undefined) data.linkedinUrl = body.linkedinUrl;
        if (body.foundingYear !== undefined)
            data.foundingYear = body.foundingYear;
        if (body.about !== undefined) data.about = body.about;
        if (body.industry !== undefined) data.industry = body.industry;
        if (body.size !== undefined) data.size = body.size;
        if (body.city !== undefined) data.city = body.city;

        // Edit-and-resubmit: if the founder edits a rejected company, transition
        // it back to PENDING so it re-enters the admin queue. We clear the
        // rejection note and re-stamp submittedAt so the admin sees a fresh
        // submission time.
        if (c.verificationStatus === CompanyVerificationStatus.REJECTED) {
            data.verificationStatus = CompanyVerificationStatus.PENDING;
            data.rejectionNote = null;
            data.submittedAt = new Date();
        }

        const updated = await prisma.company.update({
            where: { id },
            data,
        });
        api.ok({ company: updated });
    } catch (err) {
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        if (err instanceof ZodError) {
            const issue = err.issues[0];
            api.invalidRequest(issue?.message ?? "Please check your details");
            return;
        }
        console.error(err);
        api.internalError();
    }
}
