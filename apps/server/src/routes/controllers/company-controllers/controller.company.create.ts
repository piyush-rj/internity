import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import { ApiError, ResponseWriter } from "../../../utils/api-response.ts";
import { CompanyRole, OrganizationType, Prisma, prisma } from "../../../db.ts";

const ORG_TYPES = [
    "SOLO_FOUNDER",
    "STARTUP_TEAM",
    "BOOTSTRAPPED_STARTUP",
    "PRIVATE_LIMITED",
    "LLP",
    "AGENCY",
    "FREELANCER",
    "STUDENT_STARTUP",
    "OTHER",
] as const;

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
        .nullable()
        .optional(),
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
    country: z.string().min(1, "Country is required"),
    organizationType: z.enum(ORG_TYPES),
});

export default async function createCompany(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);

        // Pre-check the slug so we can return a clear, specific error
        // instead of relying on the Prisma P2002 fallback (whose `meta.target`
        // is the index name "Company_slug_key" on Postgres, not the column
        // name — easy to miss).
        const slugTaken = await prisma.company.findUnique({
            where: { slug: body.slug },
            select: { id: true },
        });
        if (slugTaken) {
            api.fail(
                409,
                "SLUG_TAKEN",
                `The URL "${body.slug}" is already taken. Pick a different one — try adding your city or year (e.g. "${body.slug}-in" or "${body.slug}-2025").`,
            );
            return;
        }

        const now = new Date();
        const freeListingExpiresAt = new Date(
            now.getTime() + 3 * 24 * 60 * 60 * 1000,
        );
        const result = await prisma.$transaction(async (tx) => {
            const c = await tx.company.create({
                data: {
                    name: body.name,
                    slug: body.slug,
                    logoUrl: body.logoUrl ?? null,
                    website: body.website ?? null,
                    linkedinUrl: body.linkedinUrl ?? null,
                    foundingYear: body.foundingYear,
                    about: body.about,
                    industry: body.industry ?? null,
                    size: body.size,
                    city: body.city ?? null,
                    country: body.country,
                    organizationType: body.organizationType as OrganizationType,
                    submittedAt: now,
                    freeListingExpiresAt,
                },
            });
            await tx.companyMember.create({
                data: {
                    companyId: c.id,
                    userId: req.user!.id,
                    role: CompanyRole.FOUNDER_OWNER,
                },
            });
            // Activate the new company so dashboard reads/writes pick it up.
            await tx.user.update({
                where: { id: req.user!.id },
                data: { activeCompanyId: c.id },
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
            // Postgres reports the index name (e.g. "Company_slug_key") in
            // meta.target, not the column. Substring-match so we catch both
            // the index-name form AND the bare column-name form.
            const target = (err.meta?.target as string[] | undefined) ?? [];
            const joined = target.join(",").toLowerCase();
            if (joined.includes("slug")) {
                api.fail(
                    409,
                    "SLUG_TAKEN",
                    `The URL "${(req.body as { slug?: string })?.slug ?? "you picked"}" was just taken by someone else. Pick a different one.`,
                );
                return;
            }
            api.fail(
                409,
                "DUPLICATE",
                joined
                    ? `Another company already uses this ${joined}. Try a different value.`
                    : "Another company already uses one of these details.",
            );
            return;
        }
        console.error(err);
        api.internalError();
    }
}
