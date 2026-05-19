import type { Request, Response } from "express";
import { z, ZodError } from "zod";
import { ApiError, ResponseWriter } from "../../../utils/api-response.ts";
import {
    buildObjectKey,
    presignPut,
    publicUrlFor,
} from "../../../core/storage.ts";

const Body = z.object({
    kind: z.enum(["RESUME", "COMPANY_LOGO", "PROFILE_IMAGE"]),
    contentType: z.string().min(1),
    sizeBytes: z.number().int().positive(),
});

export default async function signUpload(
    req: Request,
    res: Response,
): Promise<void> {
    const api = new ResponseWriter(res);
    try {
        const body = Body.parse(req.body);
        const key = buildObjectKey(body.kind, req.user!.id);
        const putUrl = await presignPut(key, body.contentType);
        const getUrl = publicUrlFor(key);
        api.ok({ key, putUrl, getUrl });
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
