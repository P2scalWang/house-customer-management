-- Sync registration_date and expiration_date across info_log and house_members
-- Postgres (Supabase) safe migration: add missing column, backfill existing rows, and enforce future sync

BEGIN;

-- 1) Ensure house_members has registration_date (date)
ALTER TABLE public.house_members
  ADD COLUMN IF NOT EXISTS registration_date date;

-- 2) Backfill by matching email (authoritative source: info_log)
UPDATE public.house_members AS hm
SET
  registration_date = il.registration_date,
  expiration_date   = il.expiration_date,
  is_active         = CASE
                        WHEN il.expiration_date IS NULL THEN TRUE
                        WHEN il.expiration_date >= CURRENT_DATE THEN TRUE
                        ELSE FALSE
                      END
FROM public.info_log AS il
WHERE lower(hm.member_email) = lower(il.email)
  AND (
    hm.registration_date IS DISTINCT FROM il.registration_date OR
    hm.expiration_date   IS DISTINCT FROM il.expiration_date   OR
    hm.is_active         IS DISTINCT FROM (CASE WHEN il.expiration_date IS NULL OR il.expiration_date >= CURRENT_DATE THEN TRUE ELSE FALSE END)
  );

-- 3) Backfill by matching line_id (fallback when email mapping is missing)
UPDATE public.house_members AS hm
SET
  registration_date = il.registration_date,
  expiration_date   = il.expiration_date,
  is_active         = CASE
                        WHEN il.expiration_date IS NULL THEN TRUE
                        WHEN il.expiration_date >= CURRENT_DATE THEN TRUE
                        ELSE FALSE
                      END
FROM public.info_log AS il
WHERE hm.line_id IS NOT NULL
  AND il.line_id = hm.line_id
  AND NOT EXISTS (
    SELECT 1 FROM public.info_log il2 WHERE lower(il2.email) = lower(hm.member_email)
  )
  AND (
    hm.registration_date IS DISTINCT FROM il.registration_date OR
    hm.expiration_date   IS DISTINCT FROM il.expiration_date   OR
    hm.is_active         IS DISTINCT FROM (CASE WHEN il.expiration_date IS NULL OR il.expiration_date >= CURRENT_DATE THEN TRUE ELSE FALSE END)
  );

-- 4) Keep house_members in sync after InfoLog changes
CREATE OR REPLACE FUNCTION public.sync_house_members_dates_from_info_log()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.house_members AS hm
  SET
    registration_date = NEW.registration_date,
    expiration_date   = NEW.expiration_date,
    is_active         = CASE WHEN NEW.expiration_date IS NULL OR NEW.expiration_date >= CURRENT_DATE THEN TRUE ELSE FALSE END
  WHERE lower(hm.member_email) = lower(NEW.email)
     OR (hm.line_id IS NOT NULL AND hm.line_id = NEW.line_id);
  -- Auto remove expired members immediately
  DELETE FROM public.house_members AS hm2
  WHERE (lower(hm2.member_email) = lower(NEW.email) OR (hm2.line_id IS NOT NULL AND hm2.line_id = NEW.line_id))
    AND NEW.expiration_date IS NOT NULL
    AND NEW.expiration_date < CURRENT_DATE;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_house_members_dates ON public.info_log;
CREATE TRIGGER trg_sync_house_members_dates
AFTER INSERT OR UPDATE OF email, registration_date, expiration_date
ON public.info_log
FOR EACH ROW
EXECUTE FUNCTION public.sync_house_members_dates_from_info_log();

-- 5) Optional: guard house_members writes so is_active always follows expiration_date
CREATE OR REPLACE FUNCTION public.house_members_compute_is_active()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_active := CASE WHEN NEW.expiration_date IS NULL OR NEW.expiration_date >= CURRENT_DATE THEN TRUE ELSE FALSE END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_house_members_compute_is_active ON public.house_members;
CREATE TRIGGER trg_house_members_compute_is_active
BEFORE INSERT OR UPDATE OF expiration_date
ON public.house_members
FOR EACH ROW
EXECUTE FUNCTION public.house_members_compute_is_active();

COMMIT;
