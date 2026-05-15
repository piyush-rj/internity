import type { Request, Response } from "express";
import z from "zod";
import { prisma, AssetKind, CompanyRole } from "database";
import ResponseWriter from "../../class/response_writer";
import {
    MINIO_BUCKET,
    build_object_key,
    delete_object,
    presign_put,
    public_url_for,
} from "../../lib/minio";

export default class UploadController {
    static sign_schema = z.object({
        kind: z.enum([
            AssetKind.RESUME,
            AssetKind.COMPANY_LOGO,
            AssetKind.PROFILE_IMAGE,
        ]),
        contentType: z.string(),
        sizeBytes: z.number().int().positive(),
    });

    static confirm_schema = z.object({
        kind: z.enum([
            AssetKind.RESUME,
            AssetKind.COMPANY_LOGO,
            AssetKind.PROFILE_IMAGE,
        ]),
        key: z.string(),
        contentType: z.string(),
        sizeBytes: z.number().int().positive(),
        companyId: z.string().optional(),
    });

    // post /upload/sign — returns { key, putUrl, getUrl }
    static async sign(req: Request, res: Response) {
        const { data, success } = UploadController.sign_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const key = build_object_key(data.kind, req.user!.id);
            const putUrl = await presign_put(key, data.contentType);
            const getUrl = public_url_for(key);
            ResponseWriter.success(res, { key, putUrl, getUrl });
        } catch (err) {
            console.error("upload.sign:", err);
            ResponseWriter.server_error(res);
        }
    }

    // post /upload/confirm — registers asset row + updates relevant pointer
    static async confirm(req: Request, res: Response) {
        const { data, success } = UploadController.confirm_schema.safeParse(
            req.body,
        );
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            if (data.kind === AssetKind.COMPANY_LOGO) {
                if (!data.companyId) {
                    ResponseWriter.invalid_data(
                        res,
                        "companyId is required for COMPANY_LOGO",
                    );
                    return;
                }

                const member = await prisma.companyMember.findUnique({
                    where: {
                        companyId_userId: {
                            companyId: data.companyId,
                            userId: req.user!.id,
                        },
                    },
                    select: { role: true },
                });
                if (!member || member.role !== CompanyRole.OWNER) {
                    ResponseWriter.unauthorized(res, "Owner-only action", 403);
                    return;
                }
            }

            const url = public_url_for(data.key);
            const asset = await prisma.asset.create({
                data: {
                    userId: req.user!.id,
                    kind: data.kind,
                    bucket: MINIO_BUCKET(),
                    key: data.key,
                    url,
                    contentType: data.contentType,
                    sizeBytes: data.sizeBytes,
                },
            });

            // db-updates
            if (data.kind === AssetKind.RESUME) {
                await prisma.studentProfile.updateMany({
                    where: { userId: req.user!.id },
                    data: { resumeUrl: url },
                });
            } else if (data.kind === AssetKind.PROFILE_IMAGE) {
                await prisma.user.update({
                    where: { id: req.user!.id },
                    data: { image: url },
                });
            } else if (data.kind === AssetKind.COMPANY_LOGO && data.companyId) {
                await prisma.company.update({
                    where: { id: data.companyId },
                    data: { logoUrl: url },
                });
            }

            ResponseWriter.success(res, { asset }, "Upload confirmed", 201);
        } catch (err) {
            console.error("upload.confirm:", err);
            ResponseWriter.server_error(res);
        }
    }

    // delete /upload/:assetId
    static async remove(req: Request, res: Response) {
        const assetId = req.params.assetId;
        if (typeof assetId !== "string") {
            ResponseWriter.invalid_data(res);
            return;
        }
        try {
            const asset = await prisma.asset.findUnique({
                where: { id: assetId },
            });
            if (!asset || asset.userId !== req.user!.id) {
                ResponseWriter.not_found(res);
                return;
            }
            await delete_object(asset.key);
            await prisma.asset.delete({ where: { id: assetId } });
            ResponseWriter.success(res, { ok: true });
        } catch (err) {
            console.error("upload.remove:", err);
            ResponseWriter.server_error(res);
        }
    }
}
