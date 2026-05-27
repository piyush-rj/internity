-- Convert screening questions + answers from text[] to jsonb. Postgres
-- forbids subqueries in ALTER COLUMN ... USING, so we go via a temp
-- column, backfill with the aggregate, drop the old column, and rename.
-- Each existing question becomes a SHORT-type entry; each existing answer
-- becomes { value: <text> }.

----------------------------------------------------------------------
-- Listing.screeningQuestions  text[] -> jsonb
----------------------------------------------------------------------

ALTER TABLE "Listing"
  ADD COLUMN "screeningQuestions_new" jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE "Listing"
   SET "screeningQuestions_new" = sub.j
  FROM (
    SELECT l."id" AS id,
           COALESCE(
             jsonb_agg(jsonb_build_object('q', q, 'type', 'SHORT')),
             '[]'::jsonb
           ) AS j
      FROM "Listing" l
      LEFT JOIN LATERAL unnest(l."screeningQuestions") AS q ON true
     GROUP BY l."id"
  ) AS sub
 WHERE "Listing"."id" = sub.id;

ALTER TABLE "Listing" DROP COLUMN "screeningQuestions";
ALTER TABLE "Listing"
  RENAME COLUMN "screeningQuestions_new" TO "screeningQuestions";

----------------------------------------------------------------------
-- Application.screeningAnswers  text[] -> jsonb
----------------------------------------------------------------------

ALTER TABLE "Application"
  ADD COLUMN "screeningAnswers_new" jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE "Application"
   SET "screeningAnswers_new" = sub.j
  FROM (
    SELECT a."id" AS id,
           COALESCE(
             jsonb_agg(jsonb_build_object('value', v)),
             '[]'::jsonb
           ) AS j
      FROM "Application" a
      LEFT JOIN LATERAL unnest(a."screeningAnswers") AS v ON true
     GROUP BY a."id"
  ) AS sub
 WHERE "Application"."id" = sub.id;

ALTER TABLE "Application" DROP COLUMN "screeningAnswers";
ALTER TABLE "Application"
  RENAME COLUMN "screeningAnswers_new" TO "screeningAnswers";
