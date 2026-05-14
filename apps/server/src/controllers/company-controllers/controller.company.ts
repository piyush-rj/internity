import type { Request, Response } from "express";
import z from "zod";
import { prisma, CompanyRole } from "database";
import ResponseWriter from "../../class/response_writer";

export default class CompanyController {
    static create_schema = z.object({
        name: z.string().min(1),
        slug: z.string().regex(/^[a-z0-9-]+$/),
        logoUrl: z.url().optional(),
        website: z.url().optional(),
        about: z.string().optional(),
        industry: z.string().optional(),
        size: z.string().optional(),
        city: z.string().optional(),
    });

    static update_schema = CompanyController.create_schema
        .partial()
        .omit({ slug: true });

    // POST /company — caller becomes OWNER member of the new company
    static async create(req: Request, res: Response) {
        const { data, success } = CompanyController.create_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const company = await prisma.company.create({
                data: {
                    ...data,
                    members: {
                        create: {
                            userId: req.user!.id,
                            role: CompanyRole.OWNER,
                        },
                    },
                },
                include: { members: true },
            });
            ResponseWriter.success(res, { company }, "Company created", 201);
        } catch (err) {
            console.error("company.create:", err);
            ResponseWriter.server_error(res);
        }
    }

    // GET /company/:slug — public page
    static async get_by_slug(req: Request, res: Response) {
        const slug = req.params.slug;
        if (typeof slug !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const company = await prisma.company.findUnique({
                where: { slug },
                include: {
                    listings: {
                        where: { closedAt: null },
                        orderBy: { createdAt: "desc" },
                        take: 20,
                    },
                },
            });
            if (!company) {
                ResponseWriter.not_found(res);
                return;
            }
            ResponseWriter.success(res, { company });
        } catch (err) {
            console.error("company.get_by_slug:", err);
            ResponseWriter.server_error(res);
        }
    }

    // PATCH /company/:id — OWNER-only (enforced by middleware in the route file)
    static async update(req: Request, res: Response) {
        const id = req.params.id;
        if (typeof id !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        const { data, success } = CompanyController.update_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const company = await prisma.company.update({
                where: { id },
                data,
            });
            ResponseWriter.success(res, { company });
        } catch (err) {
            console.error("company.update:", err);
            ResponseWriter.server_error(res);
        }
    }
}
