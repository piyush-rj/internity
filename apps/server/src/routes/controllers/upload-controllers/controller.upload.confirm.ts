import type { Request, Response } from "express";
import { z } from "zod";
import {
    Forbidden,
    InvalidRequest,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { bucket, publicUrlFor } from "../../../core/storage.ts";
import { AssetKind, prisma } from "../../../db.ts";
import { canManageCompany } from "../../../utils/company-roles.ts";

const Body = z.object({
    kind: z.enum(["RESUME", "COMPANY_LOGO", "PROFILE_IMAGE"]),
    key: z.string().min(1),
    contentType: z.string().min(1),
    sizeBytes: z.number().int().positive(),
    companyId: z.string().nullable().optional(),
    // RESUME only: file name shown in the resume picker. Falls back to a
    // generic label.
    fileName: z.string().max(120).nullable().optional(),
});

const MAX_RESUMES_PER_STUDENT = 4;

export default async function confirmUpload(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const userId = req.user!.id;
        const kind = body.kind as AssetKind;

        if (kind === AssetKind.COMPANY_LOGO) {
            if (!body.companyId) {
                throw new InvalidRequest(
                    "companyId is required for COMPANY_LOGO",
                );
            }
            const member = await prisma.companyMember.findUnique({
                where: {
                    companyId_userId: { companyId: body.companyId, userId },
                },
            });
            if (!member || !canManageCompany(member.role)) {
                throw new Forbidden(
                    "Only founders and co-founders can update the company logo",
                );
            }
        }

        const url = publicUrlFor(body.key);
        const asset = await prisma.$transaction(async (tx) => {
            const created = await tx.asset.create({
                data: {
                    userId,
                    kind,
                    bucket: bucket(),
                    key: body.key,
                    url,
                    contentType: body.contentType,
                    sizeBytes: body.sizeBytes,
                },
            });
            if (kind === AssetKind.RESUME) {
                const profile = await tx.studentProfile.findUnique({
                    where: { userId },
                    select: { id: true, resumes: { select: { id: true } } },
                });
                if (profile) {
                    if (profile.resumes.length >= MAX_RESUMES_PER_STUDENT) {
                        throw new InvalidRequest(
                            `You can keep up to ${MAX_RESUMES_PER_STUDENT} resumes. Delete one before uploading another.`,
                        );
                    }
                    const isFirst = profile.resumes.length === 0;
                    await tx.resume.create({
                        data: {
                            studentId: profile.id,
                            assetId: created.id,
                            fileName: body.fileName?.trim() || "Resume",
                            url,
                            sizeBytes: body.sizeBytes,
                            isDefault: isFirst,
                        },
                    });
                    // Keep the denormalised default URL in sync (only when
                    // this upload becomes the default — i.e. the first one).
                    if (isFirst) {
                        await tx.studentProfile.update({
                            where: { id: profile.id },
                            data: { resumeUrl: url },
                        });
                    }
                }
            } else if (kind === AssetKind.PROFILE_IMAGE) {
                await tx.user.update({
                    where: { id: userId },
                    data: { image: url },
                });
            } else if (kind === AssetKind.COMPANY_LOGO && body.companyId) {
                await tx.company.update({
                    where: { id: body.companyId },
                    data: { logoUrl: url },
                });
            }
            return created;
        });

        api.created({ asset }, "Upload confirmed");
    } catch (err) {
        handleApiError(err, api);
    }
}
