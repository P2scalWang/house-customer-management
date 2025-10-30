-- Create expired_members_archive table to store historical data when members are auto-removed
-- This allows tracking who was removed and when, preserving full history

BEGIN;

CREATE TABLE IF NOT EXISTS public.expired_members_archive (
  id SERIAL PRIMARY KEY,
  original_member_id INTEGER,
  house_id INTEGER,
  house_number TEXT,
  member_email TEXT NOT NULL,
  expiration_date DATE,
  registration_date DATE,
  note TEXT,
  line_id TEXT,
  phone_number TEXT,
  customer_name TEXT,
  package TEXT,
  package_price NUMERIC,
  channel TEXT,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  archived_reason TEXT DEFAULT 'expired',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_expired_archive_email ON public.expired_members_archive(member_email);
CREATE INDEX IF NOT EXISTS idx_expired_archive_date ON public.expired_members_archive(expiration_date);
CREATE INDEX IF NOT EXISTS idx_expired_archive_archived_at ON public.expired_members_archive(archived_at);

-- Trigger function to archive before deleting from house_members
CREATE OR REPLACE FUNCTION public.archive_expired_member_before_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  house_num TEXT;
BEGIN
  -- Get house number
  SELECT h.house_number INTO house_num
  FROM public.house_list h
  WHERE h.id = OLD.house_id;

  -- Insert into archive (only fields that exist in house_members table)
  INSERT INTO public.expired_members_archive (
    original_member_id,
    house_id,
    house_number,
    member_email,
    expiration_date,
    registration_date,
    note,
    line_id,
    archived_at,
    archived_reason,
    created_at,
    updated_at
  ) VALUES (
    OLD.id,
    OLD.house_id,
    house_num,
    OLD.member_email,
    OLD.expiration_date,
    OLD.registration_date,
    OLD.note,
    OLD.line_id,
    NOW(),
    'expired',
    OLD.created_at,
    OLD.updated_at
  );

  RETURN OLD;
END;
$$;

-- Attach trigger to house_members BEFORE DELETE
DROP TRIGGER IF EXISTS trg_archive_expired_member ON public.house_members;
CREATE TRIGGER trg_archive_expired_member
BEFORE DELETE ON public.house_members
FOR EACH ROW
EXECUTE FUNCTION public.archive_expired_member_before_delete();

COMMIT;

-- Usage notes:
-- 1) Run this script in Supabase SQL Editor
-- 2) All deleted members will be archived automatically
-- 3) Query expired_members_archive to see history: SELECT * FROM expired_members_archive ORDER BY archived_at DESC;
