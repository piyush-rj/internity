// Wrap every controller body in try/catch with a uniform error->envelope conversion.
// Run once: `node scripts/wrap-controllers.mjs` from apps/server.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = "src/routes/controllers";

const CATCH_BLOCK = `    } catch (err) {
        if (err instanceof ApiError) {
            api.fail(err.status, err.code, err.message);
            return;
        }
        if (err instanceof ZodError) {
            const issue = err.issues[0];
            const where = issue?.path.join(".") || "body";
            api.invalidRequest(
                \`Invalid \${where}: \${issue?.message ?? "invalid"}\`,
            );
            return;
        }
        console.error(err);
        api.internalError();
    }
`;

async function processFile(filepath) {
    let content = await readFile(filepath, "utf-8");

    // Skip if already wrapped.
    if (/^\s{4}try \{$/m.test(content)) return false;

    // 1. Ensure ApiError is imported from utils/api-response.ts
    const apiImportRe =
        /import \{ ([^}]+) \} from "(\.\.\/\.\.\/\.\.\/utils\/api-response\.ts)"/;
    const apiImport = content.match(apiImportRe);
    if (apiImport) {
        const names = apiImport[1]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        if (!names.includes("ApiError")) {
            names.push("ApiError");
            names.sort();
            content = content.replace(
                apiImportRe,
                `import { ${names.join(", ")} } from "${apiImport[2]}"`,
            );
        }
    } else {
        // No api-response import yet — inject a fresh one after express import.
        content = content.replace(
            /(import type \{ Request, Response \} from "express";\n)/,
            `$1import { ApiError, ResponseWriter } from "../../../utils/api-response.ts";\n`,
        );
    }

    // 2. Ensure ZodError is imported from "zod"
    if (/from "zod"/.test(content)) {
        if (!/\bZodError\b/.test(content)) {
            content = content.replace(
                /import \{ z \} from "zod"/,
                'import { z, ZodError } from "zod"',
            );
        }
    } else {
        content = content.replace(
            /(import type \{ Request, Response \} from "express";\n)/,
            `$1import { ZodError } from "zod";\n`,
        );
    }

    // 3. Wrap function body in try/catch. Handles both single-line signatures
    //    `function foo(req: Request, res: Response): Promise<void> {`
    //    and multi-line signatures across several lines ending in `): Promise<void> {`
    //    or just `) {`.
    const sigRe =
        /(export default async function \w+\([\s\S]*?\)(?:: Promise<void>)? \{\n)/;
    const sig = content.match(sigRe);
    if (!sig) {
        console.warn("SKIP (no signature):", filepath);
        return false;
    }

    const bodyStart = sig.index + sig[0].length;

    // Find matching closing brace via depth counter.
    let depth = 1;
    let i = bodyStart;
    while (i < content.length && depth > 0) {
        const ch = content[i];
        if (ch === "{") depth++;
        else if (ch === "}") depth--;
        if (depth === 0) break;
        i++;
    }
    const fnEnd = i;

    const head = content.slice(0, bodyStart);
    const body = content.slice(bodyStart, fnEnd);
    const tail = content.slice(fnEnd);

    // Body must start with `    const api = new ResponseWriter(res);` so we know
    // where to open the try {.
    const apiLineRe = /^(\s{4}const api = new ResponseWriter\(res\);\n)/;
    const apiLineMatch = body.match(apiLineRe);
    if (!apiLineMatch) {
        console.warn("SKIP (no api line):", filepath);
        return false;
    }
    const apiLine = apiLineMatch[1];
    const rest = body
        .slice(apiLine.length)
        .replace(/\n$/, ""); // drop trailing blank before }

    // Re-indent the rest of the body by 4 spaces (now inside try { ... }).
    const indented = rest
        .split("\n")
        .map((l) => (l.length > 0 ? "    " + l : l))
        .join("\n");

    const newBody = `${apiLine}    try {\n${indented}\n${CATCH_BLOCK}`;
    const newContent = head + newBody + tail;
    await writeFile(filepath, newContent);
    return true;
}

async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    let touched = 0;
    for (const entry of entries) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) touched += await walk(path);
        else if (entry.name.endsWith(".ts")) {
            const changed = await processFile(path);
            if (changed) touched++;
        }
    }
    return touched;
}

const count = await walk(ROOT);
console.log(`wrapped ${count} files`);
