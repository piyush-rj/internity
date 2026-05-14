import type { Request, Response } from "express";
import { prisma } from "database";
import ResponseWriter from "../../class/response_writer";

export default class SavedController {
    // GET /saved — caller's saved listings
    static async list(req: Request, res: Response) {
        try {
            const items = await prisma.savedListing.findMany({
                where: { userId: req.user!.id },
                orderBy: { createdAt: "desc" },
                include: {
                    listing: {
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
                    },
                },
            });
            ResponseWriter.success(res, { items });
        } catch (err) {
            console.error("saved.list:", err);
            ResponseWriter.server_error(res);
        }
    }

    // POST /saved/:listingId — idempotent
    static async save(req: Request, res: Response) {
        const listingId = req.params.listingId;
        if (typeof listingId !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const saved = await prisma.savedListing.upsert({
                where: {
                    userId_listingId: { userId: req.user!.id, listingId },
                },
                create: { userId: req.user!.id, listingId },
                update: {},
            });
            ResponseWriter.success(res, { saved });
        } catch (err) {
            console.error("saved.save:", err);
            ResponseWriter.server_error(res);
        }
    }

    // DELETE /saved/:listingId — idempotent
    static async unsave(req: Request, res: Response) {
        const listingId = req.params.listingId;
        if (typeof listingId !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            await prisma.savedListing.deleteMany({
                where: { userId: req.user!.id, listingId },
            });
            ResponseWriter.success(res, { ok: true });
        } catch (err) {
            console.error("saved.unsave:", err);
            ResponseWriter.server_error(res);
        }
    }
}
