import type { Request, Response } from "express";
import z from "zod";
import type { Prisma } from "database";
import { prisma } from "database";
import ResponseWriter from "../../class/response_writer";

export default class ListingController {
    static create_schema = z.object({
        companyId: z.string(),
        type: z.enum(["INTERNSHIP", "JOB"]),
        title: z.string().min(1),
        mode: z.enum(["REMOTE", "HYBRID", "ONSITE"]),
        city: z.string().optional(),
        description: z.string().min(1),
        responsibilities: z.array(z.string()).default([]),
        perks: z.array(z.string()).default([]),
        preferences: z.array(z.string()).default([]),
        skillTagsRaw: z.array(z.string()).default([]),
        stipendMin: z.number().int().optional(),
        stipendMax: z.number().int().optional(),
        durationMonths: z.number().int().optional(),
        startDate: z.iso.datetime().optional(),
        applyBy: z.iso.datetime().optional(),
        openings: z.number().int().optional(),
        partTime: z.boolean().optional(),
    });

    static update_schema = ListingController.create_schema
        .partial()
        .omit({ companyId: true });

    static list_query_schema = z.object({
        type: z.enum(["INTERNSHIP", "JOB"]).optional(),
        q: z.string().optional(),
        city: z.string().optional(),
        mode: z.enum(["REMOTE", "HYBRID", "ONSITE"]).optional(),
        skills: z.string().optional(),
        stipendMin: z.coerce.number().int().optional(),
        durationMax: z.coerce.number().int().optional(),
        partTime: z.enum(["true", "false"]).optional(),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(50).default(20),
    });

    private static async listing_company_for(listingId: string) {
        const row = await prisma.listing.findUnique({
            where: { id: listingId },
            select: { companyId: true },
        });
        return row?.companyId ?? null;
    }

    private static async is_member(companyId: string, userId: string) {
        const row = await prisma.companyMember.findUnique({
            where: { companyId_userId: { companyId, userId } },
            select: { role: true },
        });
        return !!row;
    }

    static async list(req: Request, res: Response) {
        const { data, success } = ListingController.list_query_schema.safeParse(
            req.query,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const where: Prisma.ListingWhereInput = { closedAt: null };
            if (data.type) where.type = data.type;
            if (data.mode) where.mode = data.mode;
            if (data.city)
                where.city = { contains: data.city, mode: "insensitive" };
            if (data.q) {
                const q = data.q.trim();
                if (q) {
                    where.OR = [
                        { title: { contains: q, mode: "insensitive" } },
                        {
                            company: {
                                name: { contains: q, mode: "insensitive" },
                            },
                        },
                        { skillTagsRaw: { has: q.toLowerCase() } },
                    ];
                }
            }
            if (data.stipendMin !== undefined)
                where.stipendMax = { gte: data.stipendMin };
            if (data.durationMax !== undefined)
                where.durationMonths = { lte: data.durationMax };
            if (data.partTime) where.partTime = data.partTime === "true";
            if (data.skills) {
                const tags = data.skills
                    .split(",")
                    .map((s) => s.trim().toLowerCase())
                    .filter(Boolean);
                if (tags.length) where.skillTagsRaw = { hasSome: tags };
            }

            const [items, total] = await Promise.all([
                prisma.listing.findMany({
                    where,
                    orderBy: { createdAt: "desc" },
                    skip: (data.page - 1) * data.pageSize,
                    take: data.pageSize,
                    include: {
                        company: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                logoUrl: true,
                            },
                        },
                    },
                }),
                prisma.listing.count({ where }),
            ]);

            ResponseWriter.success(res, {
                items,
                page: data.page,
                pageSize: data.pageSize,
                total,
            });
        } catch (err) {
            console.error("listing.list:", err);
            ResponseWriter.server_error(res);
        }
    }

    static async list_mine(req: Request, res: Response) {
        try {
            const memberships = await prisma.companyMember.findMany({
                where: { userId: req.user!.id },
                select: { companyId: true },
            });
            const companyIds = memberships.map((m) => m.companyId);
            if (companyIds.length === 0) {
                ResponseWriter.success(res, { items: [] });
                return;
            }
            const items = await prisma.listing.findMany({
                where: { companyId: { in: companyIds } },
                orderBy: { createdAt: "desc" },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            logoUrl: true,
                        },
                    },
                    _count: { select: { applications: true } },
                },
            });
            ResponseWriter.success(res, { items });
        } catch (err) {
            console.error("listing.list_mine:", err);
            ResponseWriter.server_error(res);
        }
    }

    // get /listing/:id — public detail
    static async get(req: Request, res: Response) {
        const id = req.params.id;
        if (typeof id !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const listing = await prisma.listing.findUnique({
                where: { id },
                include: {
                    company: true,
                    skills: { include: { skill: true } },
                },
            });
            if (!listing) {
                ResponseWriter.not_found(res);
                return;
            }
            ResponseWriter.success(res, { listing });
        } catch (err) {
            console.error("listing.get:", err);
            ResponseWriter.server_error(res);
        }
    }

    // post /listing — must be company-member of body.companyId
    static async create(req: Request, res: Response) {
        const { data, success } = ListingController.create_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            if (
                !(await ListingController.is_member(
                    data.companyId,
                    req.user!.id,
                ))
            ) {
                ResponseWriter.unauthorized(
                    res,
                    "Not a member of this company",
                    403,
                );
                return;
            }

            const { companyId, skillTagsRaw, ...rest } = data;
            const listing = await prisma.listing.create({
                data: {
                    ...rest,
                    companyId,
                    postedById: req.user!.id,
                    skillTagsRaw: skillTagsRaw
                        .map((t) => t.trim().toLowerCase())
                        .filter(Boolean),
                },
            });
            ResponseWriter.success(res, { listing }, "Listing created", 201);
        } catch (err) {
            console.error("listing.create:", err);
            ResponseWriter.server_error(res);
        }
    }

    // patch /listing/:id
    static async update(req: Request, res: Response) {
        const id = req.params.id;
        if (typeof id !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        const { data, success } = ListingController.update_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const companyId = await ListingController.listing_company_for(id);
            if (!companyId) {
                ResponseWriter.not_found(res);
                return;
            }
            if (!(await ListingController.is_member(companyId, req.user!.id))) {
                ResponseWriter.unauthorized(
                    res,
                    "Not a member of this company",
                    403,
                );
                return;
            }

            const patch = { ...data };
            if (patch.skillTagsRaw) {
                patch.skillTagsRaw = patch.skillTagsRaw
                    .map((t) => t.trim().toLowerCase())
                    .filter(Boolean);
            }

            const listing = await prisma.listing.update({
                where: { id },
                data: patch,
            });
            ResponseWriter.success(res, { listing });
        } catch (err) {
            console.error("listing.update:", err);
            ResponseWriter.server_error(res);
        }
    }

    // post /listing/:id/close
    static async close(req: Request, res: Response) {
        const id = req.params.id;
        if (typeof id !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const companyId = await ListingController.listing_company_for(id);
            if (!companyId) {
                ResponseWriter.not_found(res);
                return;
            }
            if (!(await ListingController.is_member(companyId, req.user!.id))) {
                ResponseWriter.unauthorized(
                    res,
                    "Not a member of this company",
                    403,
                );
                return;
            }
            const listing = await prisma.listing.update({
                where: { id },
                data: { closedAt: new Date() },
            });
            ResponseWriter.success(res, { listing });
        } catch (err) {
            console.error("listing.close:", err);
            ResponseWriter.server_error(res);
        }
    }

    // post /listing/:id/reopen
    static async reopen(req: Request, res: Response) {
        const id = req.params.id;
        if (typeof id !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const companyId = await ListingController.listing_company_for(id);
            if (!companyId) {
                ResponseWriter.not_found(res);
                return;
            }
            if (!(await ListingController.is_member(companyId, req.user!.id))) {
                ResponseWriter.unauthorized(
                    res,
                    "Not a member of this company",
                    403,
                );
                return;
            }
            const listing = await prisma.listing.update({
                where: { id },
                data: { closedAt: null },
            });
            ResponseWriter.success(res, { listing });
        } catch (err) {
            console.error("listing.reopen:", err);
            ResponseWriter.server_error(res);
        }
    }

    // delete /listing/:id
    static async remove(req: Request, res: Response) {
        const id = req.params.id;
        if (typeof id !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const companyId = await ListingController.listing_company_for(id);
            if (!companyId) {
                ResponseWriter.not_found(res);
                return;
            }
            if (!(await ListingController.is_member(companyId, req.user!.id))) {
                ResponseWriter.unauthorized(
                    res,
                    "Not a member of this company",
                    403,
                );
                return;
            }
            await prisma.listing.delete({ where: { id } });
            ResponseWriter.success(res, { ok: true });
        } catch (err) {
            console.error("listing.remove:", err);
            ResponseWriter.server_error(res);
        }
    }
}
