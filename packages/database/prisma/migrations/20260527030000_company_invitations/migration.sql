-- Email-based team invites. Owner creates an invite for a non-member email,
-- shares the resulting link, and the invitee accepts (while signed in) to
-- become a CompanyMember.

CREATE TABLE "CompanyInvitation" (
  "id"           TEXT NOT NULL,
  "companyId"    TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "role"         "CompanyRole" NOT NULL DEFAULT 'MEMBER',
  "token"        TEXT NOT NULL,
  "invitedById"  TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"    TIMESTAMP(3) NOT NULL,
  "acceptedAt"   TIMESTAMP(3),
  "acceptedById" TEXT,

  CONSTRAINT "CompanyInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CompanyInvitation_token_key" ON "CompanyInvitation" ("token");
CREATE INDEX "CompanyInvitation_companyId_idx" ON "CompanyInvitation" ("companyId");
CREATE INDEX "CompanyInvitation_email_idx" ON "CompanyInvitation" ("email");

ALTER TABLE "CompanyInvitation"
  ADD CONSTRAINT "CompanyInvitation_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompanyInvitation"
  ADD CONSTRAINT "CompanyInvitation_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompanyInvitation"
  ADD CONSTRAINT "CompanyInvitation_acceptedById_fkey"
  FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
