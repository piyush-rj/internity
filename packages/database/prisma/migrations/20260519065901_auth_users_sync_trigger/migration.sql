-- Sync auth.users -> public.User
--
-- Strategy on INSERT/UPDATE of an auth.users row:
--   1) If a public.User row exists with matching supabaseUserId, update it.
--   2) Else if email or phone matches an existing public.User row, link it
--      (set supabaseUserId). This covers the migration case: existing rows
--      created via the old NextAuth flow get attached to their new
--      Supabase auth identity on first sign-in.
--   3) Else insert a new public.User row.
--
-- Runs with SECURITY DEFINER so the auth schema (owned by supabase_auth_admin)
-- can write to public.User without an extra grant.

CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_name    TEXT;
    v_image   TEXT;
    v_email   TEXT;
    v_phone   TEXT;
    v_now     TIMESTAMP(3) := NOW();
    v_user_id TEXT;
BEGIN
    -- Pull display name / avatar from OAuth provider metadata when present.
    v_name  := COALESCE(
                 NEW.raw_user_meta_data->>'full_name',
                 NEW.raw_user_meta_data->>'name'
               );
    v_image := NEW.raw_user_meta_data->>'avatar_url';
    v_email := NULLIF(NEW.email, '');
    v_phone := NULLIF(NEW.phone, '');

    -- (1) Already linked? Just refresh mutable fields.
    UPDATE public."User"
    SET    "email"     = COALESCE(v_email, "email"),
           "phone"     = COALESCE(v_phone, "phone"),
           "name"      = COALESCE("name", v_name),
           "image"     = COALESCE("image", v_image),
           "updatedAt" = v_now
    WHERE  "supabaseUserId" = NEW.id;

    IF FOUND THEN
        RETURN NEW;
    END IF;

    -- (2) Existing row with same email or phone? Link by setting supabaseUserId.
    UPDATE public."User"
    SET    "supabaseUserId" = NEW.id,
           "email"          = COALESCE("email", v_email),
           "phone"          = COALESCE("phone", v_phone),
           "name"           = COALESCE("name", v_name),
           "image"          = COALESCE("image", v_image),
           "updatedAt"      = v_now
    WHERE  ("supabaseUserId" IS NULL)
      AND  (
              (v_email IS NOT NULL AND "email" = v_email)
           OR (v_phone IS NOT NULL AND "phone" = v_phone)
           )
    RETURNING "id" INTO v_user_id;

    IF v_user_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- (3) First time we see this person. Insert a new row.
    --     id mirrors a Prisma cuid; we generate something cuid-shaped from
    --     gen_random_uuid() so the Prisma client treats it like any other row.
    INSERT INTO public."User" (
        "id", "supabaseUserId", "email", "phone", "name", "image",
        "role", "isBanned", "isPremium", "createdAt", "updatedAt"
    ) VALUES (
        'c' || replace(gen_random_uuid()::text, '-', ''),
        NEW.id,
        v_email,
        v_phone,
        v_name,
        v_image,
        'STUDENT',
        FALSE,
        FALSE,
        v_now,
        v_now
    );

    RETURN NEW;
END;
$$;

-- Trigger fires for both signups (INSERT) and profile updates from the
-- OAuth provider (UPDATE of raw_user_meta_data / email / phone).
--
-- Wrapped in a schema-existence check so `prisma migrate dev` can validate
-- this migration on a fresh shadow database (which is plain Postgres and
-- has no `auth` schema until Supabase GoTrue creates it). On the real DB
-- the auth schema is always present, so the trigger always gets installed.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        DROP TRIGGER IF EXISTS on_auth_user_change ON auth.users;
        CREATE TRIGGER on_auth_user_change
        AFTER INSERT OR UPDATE ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.sync_auth_user_to_public_user();
    END IF;
END
$$;
