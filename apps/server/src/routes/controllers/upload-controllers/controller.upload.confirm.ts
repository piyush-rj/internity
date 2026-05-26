import type { Request, Response } from "express";
import { z } from "zod";
import {
    Forbidden,
    InvalidRequest,
    ResponseWriter,
    handleApiError,
} from "../../../utils/api-response.ts";
import { bucket, publicUrlFor } from "../../../core/storage.ts";
import { AssetKind, CompanyRole, prisma } from "../../../db.ts";

const Body = z.object({
    kind: z.enum(["RESUME", "COMPANY_LOGO", "PROFILE_IMAGE"]),
    key: z.string().min(1),
    contentType: z.string().min(1),
    sizeBytes: z.number().int().positive(),
    companyId: z.string().nullable().optional(),
});

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
            if (!member || member.role !== CompanyRole.OWNER) {
                throw new Forbidden("Owner-only action");
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
                await tx.studentProfile.updateMany({
                    where: { userId },
                    data: { resumeUrl: url },
                });
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
