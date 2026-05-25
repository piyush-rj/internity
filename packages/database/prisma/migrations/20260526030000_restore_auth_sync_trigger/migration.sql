-- Sync auth.users -> public.User
--
-- Restored after a `prisma migrate dev` squash dropped the hand-written
-- trigger from history. Prisma only captures schema-derived SQL, so any
-- function/trigger we author manually has to be re-applied as its own
-- migration after a squash.
--
-- Strategy on INSERT/UPDATE of an auth.users row:
--   1) If a public.User row exists with matching supabaseUserId, refresh it.
--   2) Else if email or phone matches an existing public.User row, link it
--      (set supabaseUserId).
--   3) Else insert a new public.User row (role defaults to STUDENT,
--      roleConfirmed defaults to false so the frontend prompts for role).

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
    v_name  := COALESCE(
                 NEW.raw_user_meta_data->>'full_name',
                 NEW.raw_user_meta_data->>'name'
               );
    v_image := NEW.raw_user_meta_data->>'avatar_url';
    v_email := NULLIF(NEW.email, '');
    v_phone := NULLIF(NEW.phone, '');

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

-- Wrapped in a schema-existence check so the shadow DB used by
-- `prisma migrate dev` (plain Postgres without Supabase's auth schema)
-- can validate this migration without erroring on the auth.users reference.
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
