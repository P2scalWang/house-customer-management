-- Auto-remove expired members from house_members
-- This script will automatically delete members whose expiration_date has passed
-- The trigger from create-expired-members-archive.sql will archive them before deletion

BEGIN;

-- Function to remove expired members
CREATE OR REPLACE FUNCTION public.remove_expired_members()
RETURNS TABLE(deleted_count INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  count_deleted INTEGER;
BEGIN
  -- Delete all members where expiration_date is in the past
  WITH deleted AS (
    DELETE FROM public.house_members
    WHERE expiration_date IS NOT NULL
      AND expiration_date < CURRENT_DATE
    RETURNING id
  )
  SELECT COUNT(*) INTO count_deleted FROM deleted;
  
  RETURN QUERY SELECT count_deleted;
END;
$$;

-- Trigger to automatically remove member when expiration_date is updated to a past date
CREATE OR REPLACE FUNCTION public.check_and_remove_expired_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If expiration_date is set to a past date, prevent the update and delete the row instead
  IF NEW.expiration_date IS NOT NULL AND NEW.expiration_date < CURRENT_DATE THEN
    -- Delete the row (the archive trigger will fire before deletion)
    DELETE FROM public.house_members WHERE id = NEW.id;
    -- Return NULL to cancel the UPDATE operation
    RETURN NULL;
  END IF;
  
  -- Otherwise, allow the update
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_expired_on_update ON public.house_members;
CREATE TRIGGER trg_check_expired_on_update
BEFORE UPDATE OF expiration_date ON public.house_members
FOR EACH ROW
EXECUTE FUNCTION public.check_and_remove_expired_on_update();

-- Schedule automatic cleanup using pg_cron (if available)
-- Note: pg_cron extension must be enabled first
-- To enable: CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Run daily at 2 AM to remove expired members
-- Uncomment the following lines if pg_cron is available:
-- SELECT cron.schedule(
--   'remove-expired-members-daily',
--   '0 2 * * *',  -- Every day at 2 AM
--   'SELECT public.remove_expired_members();'
-- );

COMMIT;

-- Manual usage:
-- To manually remove expired members, run:
-- SELECT public.remove_expired_members();

-- To check how many expired members exist without deleting:
-- SELECT COUNT(*) FROM public.house_members 
-- WHERE expiration_date IS NOT NULL AND expiration_date < CURRENT_DATE;
