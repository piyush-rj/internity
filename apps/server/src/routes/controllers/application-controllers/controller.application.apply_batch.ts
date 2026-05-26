import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import {
    ApiError,
    InvalidRequest,
    ResponseWriter,
} from "../../../utils/api-response.ts";
import { NotificationType, Prisma, prisma } from "../../../db.ts";
import { notifyMany } from "../../../services/notifications.ts";

const Body = z.object({
    listingIds: z
        .array(z.string().min(1))
        .min(1, "Pick at least one listing to apply to")
        .max(50, "Too many — apply to 50 listings at a time at most"),
    coverLetter: z
        .string()
        .max(150, "Keep your cover note under 150 characters")
        .optional(),
});

type SkipReason =
    | "ALREADY_APPLIED"
    | "OWN_COMPANY"
    | "CLOSED"
    | "PAUSED"
    | "EXPIRED"
    | "TAKEN_DOWN"
    | "SCREENING_REQUIRED"
    | "NOT_FOUND";

type Skip = { listingId: string; reason: SkipReason };

// applies to multiple listings in one call returning created and skipped
export default async function applyBatch(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const userId = req.user!.id;

        const profile = await prisma.studentProfile.findUnique({
            where: { userId },
            select: { resumeUrl: true },
        });
        if (!profile) {
            throw new InvalidRequest("Create your profile first");
        }

        const ids = Array.from(new Set(body.listingIds));
        const coverLetter = body.coverLetter?.trim() || null;
        const now = Date.now();

        const listings = await prisma.listing.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                companyId: true,
                title: true,
                closedAt: true,
                takenDownAt: true,
                pausedAt: true,
                expiresAt: true,
                screeningQuestions: true,
            },
        });
        const byId = new Map(listings.map((l) => [l.id, l]));

        const myMemberships = await prisma.companyMember.findMany({
            where: {
                userId,
                companyId: { in: listings.map((l) => l.companyId) },
            },
            select: { companyId: true },
        });
        const myCompanies = new Set(myMemberships.map((m) => m.companyId));

        const existing = await prisma.application.findMany({
            where: { studentId: userId, listingId: { in: ids } },
            select: { listingId: true },
        });
        const alreadyApplied = new Set(existing.map((e) => e.listingId));

        const created: Array<{
            listingId: string;
            title: string;
            companyId: string;
        }> = [];
        const skipped: Skip[] = [];

        for (const id of ids) {
            const l = byId.get(id);
            if (!l) {
                skipped.push({ listingId: id, reason: "NOT_FOUND" });
                continue;
            }
            if (l.takenDownAt) {
                skipped.push({ listingId: id, reason: "TAKEN_DOWN" });
                continue;
            }
            if (l.closedAt) {
                skipped.push({ listingId: id, reason: "CLOSED" });
                continue;
            }
            if (l.pausedAt) {
                skipped.push({ listingId: id, reason: "PAUSED" });
                continue;
            }
            if (l.expiresAt && l.expiresAt.getTime() <= now) {
                skipped.push({ listingId: id, reason: "EXPIRED" });
                continue;
            }
            if (myCompanies.has(l.companyId)) {
                skipped.push({ listingId: id, reason: "OWN_COMPANY" });
                continue;
            }
            if (alreadyApplied.has(id)) {
                skipped.push({ listingId: id, reason: "ALREADY_APPLIED" });
                continue;
            }
            if (l.screeningQuestions.length > 0) {
                skipped.push({ listingId: id, reason: "SCREENING_REQUIRED" });
                continue;
            }
            created.push({
                listingId: id,
                title: l.title,
                companyId: l.companyId,
            });
        }

        if (created.length > 0) {
            try {
                await prisma.application.createMany({
                    data: created.map((c) => ({
                        listingId: c.listingId,
                        studentId: userId,
                        coverLetter,
                        resumeUrl: profile.resumeUrl,
                    })),
                    skipDuplicates: true,
                });
            } catch (err) {
                if (
                    err instanceof Prisma.PrismaClientKnownRequestError &&
                    err.code === "P2002"
                ) {
                    // race with single-apply, ignore
                } else {
                    throw err;
                }
            }
        }

        // group notifications by company to avoid spamming recruiters
        if (created.length > 0) {
            const byCompany = new Map<
                string,
                Array<{ listingId: string; title: string }>
            >();
            for (const c of created) {
                const list = byCompany.get(c.companyId) ?? [];
                list.push({ listingId: c.listingId, title: c.title });
                byCompany.set(c.companyId, list);
            }
            const memberRows = await prisma.companyMember.findMany({
                where: { companyId: { in: Array.from(byCompany.keys()) } },
                select: { companyId: true, userId: true },
            });
            const membersByCompany = new Map<string, string[]>();
            for (const m of memberRows) {
                const arr = membersByCompany.get(m.companyId) ?? [];
                arr.push(m.userId);
                membersByCompany.set(m.companyId, arr);
            }
            await Promise.all(
                Array.from(byCompany.entries()).map(([companyId, listings]) => {
                    const userIds = membersByCompany.get(companyId) ?? [];
                    const first = listings[0]!;
                    const title =
                        listings.length === 1
                            ? `New applicant for ${first.title}`
                            : `${listings.length} new applicants for your listings`;
                    return notifyMany(userIds, {
                        type: NotificationType.APPLICATION_RECEIVED,
                        title,
                        body:
                            listings.length === 1
                                ? undefined
                                : listings.map((l) => l.title).join(", "),
                        link: `/home/applicants?listingId=${first.listingId}`,
                    });
                }),
            );
        }

        api.created(
            {
                created: created.length,
                skipped,
            },
            `Applied to ${created.length} ${created.length === 1 ? "listing" : "listings"}`,
        );
    } catch (err) {
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        if (err instanceof ZodError) {
            const issue = err.issues[0];
            api.invalidRequest(issue?.message ?? "Invalid request");
            return;
        }
        console.error(err);
        api.internalError();
    }
}
