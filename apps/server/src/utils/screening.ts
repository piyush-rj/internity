import { z } from "zod";

// Five response types and their per-type config shape. Stored on Listing
// (Json column) as an array of these objects in order. Validated on
// create/update; re-validated against the listing at apply time.

export const RESPONSE_TYPES = [
    "SHORT",
    "YES_NO",
    "MULTIPLE_CHOICE",
    "NUMBERS",
    "SCALE_1_5",
] as const;

export type ResponseType = (typeof RESPONSE_TYPES)[number];

export const ScreeningQuestionSchema = z.discriminatedUnion("type", [
    z.object({
        q: z.string().min(1).max(200),
        type: z.literal("SHORT"),
    }),
    z.object({
        q: z.string().min(1).max(200),
        type: z.literal("YES_NO"),
        idealAnswer: z.enum(["yes", "no"]).nullable().optional(),
    }),
    z.object({
        q: z.string().min(1).max(200),
        type: z.literal("MULTIPLE_CHOICE"),
        options: z
            .array(z.string().min(1).max(120))
            .min(2, "Add at least 2 options")
            .max(8, "Up to 8 options"),
    }),
    z.object({
        q: z.string().min(1).max(200),
        type: z.literal("NUMBERS"),
        idealMin: z.number().int().nullable().optional(),
    }),
    z.object({
        q: z.string().min(1).max(200),
        type: z.literal("SCALE_1_5"),
        idealMin: z.number().int().min(1).max(5).nullable().optional(),
    }),
]);

export type ScreeningQuestion = z.infer<typeof ScreeningQuestionSchema>;

export const ScreeningQuestionsSchema = z
    .array(ScreeningQuestionSchema)
    .max(3, "Up to 3 screening questions");

// Answer is just { value: string | number } — the per-type interpretation
// happens by lining up indices with the question array.
export const ScreeningAnswerSchema = z.object({
    value: z.union([z.string(), z.number()]),
});

export type ScreeningAnswer = z.infer<typeof ScreeningAnswerSchema>;

export const ScreeningAnswersSchema = z.array(ScreeningAnswerSchema);

// Validate that a set of answers matches a set of questions in length,
// order, and per-type shape. Returns the normalized answers on success or
// throws with a human-readable message on failure.
export function validateAnswers(
    questions: ScreeningQuestion[],
    rawAnswers: ScreeningAnswer[],
): ScreeningAnswer[] {
    if (rawAnswers.length !== questions.length) {
        throw new Error(
            "Please answer every screening question before applying.",
        );
    }
    const out: ScreeningAnswer[] = [];
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i]!;
        const a = rawAnswers[i]!;
        const v = a.value;
        switch (q.type) {
            case "SHORT": {
                if (typeof v !== "string" || v.trim().length === 0) {
                    throw new Error(`Please answer question ${i + 1}.`);
                }
                if (v.length > 500) {
                    throw new Error(
                        `Keep answer ${i + 1} under 500 characters.`,
                    );
                }
                out.push({ value: v.trim() });
                break;
            }
            case "YES_NO": {
                const s = String(v).toLowerCase();
                if (s !== "yes" && s !== "no") {
                    throw new Error(`Question ${i + 1} expects yes or no.`);
                }
                out.push({ value: s });
                break;
            }
            case "MULTIPLE_CHOICE": {
                if (typeof v !== "string" || v.trim().length === 0) {
                    throw new Error(`Pick an option for question ${i + 1}.`);
                }
                const picked = v.trim();
                if (!q.options.includes(picked)) {
                    throw new Error(
                        `Pick one of the listed options for question ${i + 1}.`,
                    );
                }
                out.push({ value: picked });
                break;
            }
            case "NUMBERS": {
                const n = typeof v === "number" ? v : Number(v);
                if (!Number.isFinite(n)) {
                    throw new Error(`Question ${i + 1} expects a number.`);
                }
                out.push({ value: Math.trunc(n) });
                break;
            }
            case "SCALE_1_5": {
                const n = typeof v === "number" ? v : Number(v);
                if (!Number.isInteger(n) || n < 1 || n > 5) {
                    throw new Error(`Question ${i + 1} expects a 1–5 rating.`);
                }
                out.push({ value: n });
                break;
            }
        }
    }
    return out;
}
