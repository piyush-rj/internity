import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import { ApiError, ResponseWriter } from "../../../utils/api-response.ts";
import { CompanyRole, Prisma, prisma } from "../../../db.ts";

const Body = z.object({
    name: z.string().min(1, "Company name is required"),
    slug: z
        .string()
        .regex(
            /^[a-z0-9-]+$/,
            "Use lowercase letters, numbers, and hyphens only",
        ),
    logoUrl: z.string().url().nullable().optional(),
    website: z.string().url("Enter a valid website URL").nullable().optional(),
    linkedinUrl: z
        .string()
        .url("Enter a valid LinkedIn URL")
        .min(1, "LinkedIn URL is required"),
    foundingYear: z
        .number()
        .int()
        .min(1800, "Founding year looks too far back")
        .max(
            new Date().getUTCFullYear(),
            "Founding year can't be in the future",
        ),
    about: z.string().min(1, "Tell us briefly what your company does"),
    industry: z.string().nullable().optional(),
    size: z.string().min(1, "Team size is required"),
    city: z.string().nullable().optional(),
});

export default async function createCompany(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const now = new Date();
        const result = await prisma.$transaction(async (tx) => {
            const c = await tx.company.create({
                data: {
                    name: body.name,
                    slug: body.slug,
                    logoUrl: body.logoUrl ?? null,
                    website: body.website ?? null,
                    linkedinUrl: body.linkedinUrl,
                    foundingYear: body.foundingYear,
                    about: body.about,
                    industry: body.industry ?? null,
                    size: body.size,
                    city: body.city ?? null,
                    // New companies always start in the admin queue.
                    submittedAt: now,
                },
            });
            await tx.companyMember.create({
                data: {
                    companyId: c.id,
                    userId: req.user!.id,
                    role: CompanyRole.OWNER,
                },
            });
            const members = await tx.companyMember.findMany({
                where: { companyId: c.id },
            });
            return { ...c, members };
        });
        api.created({ company: result }, "Company submitted for verification");
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
        if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002"
        ) {
            // Unique constraint — almost always the slug for company create.
            const target = (err.meta?.target as string[] | undefined) ?? [];
            if (target.includes("slug")) {
                api.fail(
                    409,
                    "SLUG_TAKEN",
                    "A company with this URL is already registered. Try a different one.",
                );
                return;
            }
            api.fail(
                409,
                "DUPLICATE",
                "A company with these details already exists.",
            );
            return;
        }
        console.error(err);
        api.internalError();
    }
}
