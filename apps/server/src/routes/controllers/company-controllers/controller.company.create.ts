import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import { ApiError, ResponseWriter } from "../../../utils/api-response.ts";
import { CompanyRole, prisma } from "../../../db.ts";

const Body = z.object({
    name: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    logoUrl: z.string().url().nullable().optional(),
    website: z.string().url().nullable().optional(),
    about: z.string().nullable().optional(),
    industry: z.string().nullable().optional(),
    size: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
});

export default async function createCompany(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const result = await prisma.$transaction(async (tx) => {
            const c = await tx.company.create({
                data: {
                    name: body.name,
                    slug: body.slug,
                    logoUrl: body.logoUrl ?? null,
                    website: body.website ?? null,
                    about: body.about ?? null,
                    industry: body.industry ?? null,
                    size: body.size ?? null,
                    city: body.city ?? null,
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
        api.created({ company: result }, "Company created");
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
