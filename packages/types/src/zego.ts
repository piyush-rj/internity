/**
 * Map our internal user.id (a Prisma cuid) onto a Zego-safe userID.
 *
 * ZegoCloud's ZIM signalling enforces a strict 32-character limit on userIDs,
 * and at certain tiers the effective limit is even shorter. Our cuids can be
 * up to 32 chars, so a naive pass-through breaks ZIM login with the cryptic
 * "userid length limit err" (code 50013).
 *
 * The helper applies FNV-1a 64-bit and emits a `u` + 16-hex-char string — 17
 * chars total, well within Zego's budget. FNV-1a is deterministic and works
 * identically in Node and the browser without depending on `crypto.subtle`
 * (which is async), so both the server's token minting and the client's
 * invitation payload can compute it inline without coordinating asynchronously.
 */
// `BigInt("0x…")` instead of `…n` literals so the helper compiles on tsconfig
// targets below ES2020.
const FNV_OFFSET = BigInt("0xcbf29ce484222325");
const FNV_PRIME = BigInt("0x100000001b3");
const FNV_MASK = BigInt("0xffffffffffffffff");

export function zegoUserIdFor(userId: string): string {
    let h = FNV_OFFSET;
    for (let i = 0; i < userId.length; i++) {
        h ^= BigInt(userId.charCodeAt(i));
        h = (h * FNV_PRIME) & FNV_MASK;
    }
    return "u" + h.toString(16).padStart(16, "0");
}
