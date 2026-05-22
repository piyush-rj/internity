import crypto from "node:crypto";

/**
 * ZegoCloud Token04 generator — direct port of the official reference
 * implementation. The Web UIKit's `generateKitTokenForProduction` expects
 * a token produced by this exact algorithm.
 *
 * Encoded payload structure (binary, then base64'd and prefixed "04"):
 *   8 bytes   expire (big-endian, seconds since epoch)
 *   2 bytes   iv length (always 16)
 *  16 bytes   iv
 *   2 bytes   ciphertext length
 *   N bytes   AES-256-CBC( JSON(payload), key=serverSecret, iv )
 *
 * `serverSecret` must be exactly 32 ASCII chars (the AES-256 key).
 */
export function generateZegoToken04(opts: {
    appId: number;
    userId: string;
    serverSecret: string;
    effectiveTimeInSeconds: number;
    payload?: string;
}): string {
    const { appId, userId, serverSecret, effectiveTimeInSeconds } = opts;
    const payload = opts.payload ?? "";

    if (!Number.isInteger(appId) || appId <= 0) {
        throw new Error("zego: appId must be a positive integer");
    }
    if (!userId || userId.length > 64) {
        throw new Error("zego: userId required (max 64 chars)");
    }
    if (serverSecret.length !== 32) {
        throw new Error("zego: serverSecret must be exactly 32 chars");
    }
    if (
        !Number.isInteger(effectiveTimeInSeconds) ||
        effectiveTimeInSeconds <= 0
    ) {
        throw new Error("zego: effectiveTimeInSeconds must be > 0");
    }

    const createTime = Math.floor(Date.now() / 1000);
    const tokenInfo = {
        app_id: appId,
        user_id: userId,
        nonce: crypto.randomInt(0, 2 ** 31 - 1),
        ctime: createTime,
        expire: createTime + effectiveTimeInSeconds,
        payload,
    };
    const plaintext = Buffer.from(JSON.stringify(tokenInfo), "utf8");
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        Buffer.from(serverSecret, "utf8"),
        iv,
    );
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);

    const buf = Buffer.alloc(8 + 2 + iv.length + 2 + encrypted.length);
    let off = 0;
    buf.writeBigInt64BE(BigInt(tokenInfo.expire), off);
    off += 8;
    buf.writeUInt16BE(iv.length, off);
    off += 2;
    iv.copy(buf, off);
    off += iv.length;
    buf.writeUInt16BE(encrypted.length, off);
    off += 2;
    encrypted.copy(buf, off);

    return "04" + buf.toString("base64");
}
