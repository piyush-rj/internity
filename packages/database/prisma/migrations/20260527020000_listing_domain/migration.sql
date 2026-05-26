-- High-level Domain category on Listing for the browse filter. Optional so
-- existing posts stay valid; new posts pick a value via the post form.

CREATE TYPE "ListingDomain" AS ENUM (
  'AI', 'BACKEND', 'WEB', 'MOBILE', 'QA',
  'DESIGN', 'PRODUCT',
  'MARKETING', 'CONTENT', 'SALES',
  'DATA', 'HR',
  'OTHER'
);

ALTER TABLE "Listing"
  ADD COLUMN "domain" "ListingDomain";

CREATE INDEX "Listing_domain_idx" ON "Listing" ("domain");
