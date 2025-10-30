-- ============================================================================
-- COMPLETE SUPABASE DATABASE SETUP
-- House Customer Management System
-- Run this SQL in Supabase SQL Editor to setup everything from scratch
-- ============================================================================

-- Clean up existing tables (if any)
DROP TABLE IF EXISTS public.house_members CASCADE;
DROP TABLE IF EXISTS public.house_list CASCADE;
DROP TABLE IF EXISTS public.info_log CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================================================
-- 1. USERS TABLE (for authentication)
-- ============================================================================

CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  "openId" TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT,
  "loginMethod" TEXT DEFAULT 'password',
  role TEXT DEFAULT 'user',
  "lastSignedIn" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_users_openid ON public.users("openId");
CREATE INDEX idx_users_email ON public.users(email);

-- ============================================================================
-- 2. HOUSE_LIST TABLE (main house/admin table)
-- ============================================================================

CREATE TABLE public.house_list (
  id SERIAL PRIMARY KEY,
  house_number TEXT NOT NULL UNIQUE,
  admin_email TEXT,
  registration_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'moved', 'cancelled')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_house_list_number ON public.house_list(house_number);
CREATE INDEX idx_house_list_status ON public.house_list(status);

-- ============================================================================
-- 3. HOUSE_MEMBERS TABLE (members of each house)
-- ============================================================================

CREATE TABLE public.house_members (
  id SERIAL PRIMARY KEY,
  house_id INTEGER NOT NULL REFERENCES public.house_list(id) ON DELETE CASCADE,
  member_email TEXT NOT NULL,
  note TEXT,
  expiration_date DATE,
  is_active BOOLEAN DEFAULT true,
  line_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(house_id, member_email)
);

-- Index for faster lookups
CREATE INDEX idx_house_members_house_id ON public.house_members(house_id);
CREATE INDEX idx_house_members_email ON public.house_members(member_email);
CREATE INDEX idx_house_members_expiration ON public.house_members(expiration_date);
CREATE INDEX idx_house_members_active ON public.house_members(is_active);

-- ============================================================================
-- 4. INFO_LOG TABLE (customer information log)
-- ============================================================================

CREATE TABLE public.info_log (
  id SERIAL PRIMARY KEY,
  line_id TEXT,
  phone_number TEXT,
  registration_date DATE,
  expiration_date DATE,
  package TEXT,
  package_price DECIMAL(10, 2),
  email TEXT,
  house_group TEXT,
  customer_name TEXT,
  channel TEXT CHECK (channel IN ('line', 'facebook', 'walk-in', 'other', '')),
  cancelled_or_moved TEXT CHECK (cancelled_or_moved IN ('cancelled', 'moved', '')),
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('ok', 'error', 'pending')),
  sync_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_info_log_email ON public.info_log(email);
CREATE INDEX idx_info_log_sync_status ON public.info_log(sync_status);
CREATE INDEX idx_info_log_house_group ON public.info_log(house_group);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) - OPTIONAL
-- ============================================================================
-- Uncomment these if you want to enable RLS and use anon key
-- For development with service role key, RLS is bypassed

-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.house_list ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.house_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.info_log ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything (always works)
-- CREATE POLICY "Service role can do everything on users" ON public.users FOR ALL USING (true);
-- CREATE POLICY "Service role can do everything on house_list" ON public.house_list FOR ALL USING (true);
-- CREATE POLICY "Service role can do everything on house_members" ON public.house_members FOR ALL USING (true);
-- CREATE POLICY "Service role can do everything on info_log" ON public.info_log FOR ALL USING (true);

-- ============================================================================
-- 6. AUTOMATIC UPDATED_AT TRIGGER
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_house_list_updated_at
  BEFORE UPDATE ON public.house_list
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_house_members_updated_at
  BEFORE UPDATE ON public.house_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_info_log_updated_at
  BEFORE UPDATE ON public.info_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. SYNC WITH SUPABASE AUTH (auth.users)
-- ============================================================================
-- Install pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to sync public.users to auth.users on INSERT
CREATE OR REPLACE FUNCTION sync_user_to_auth_insert()
RETURNS TRIGGER AS $$
DECLARE
  hashed_password TEXT;
BEGIN
  -- Hash password if provided
  IF NEW.password IS NOT NULL THEN
    hashed_password := crypt(NEW.password, gen_salt('bf'));
  ELSE
    hashed_password := crypt('defaultpassword123', gen_salt('bf'));
  END IF;

  -- Insert into auth.users if openId doesn't exist
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  )
  VALUES (
    NEW."openId"::uuid,
    '00000000-0000-0000-0000-000000000000',
    COALESCE(NEW.email, 'user-' || NEW.id || '@example.com'),
    hashed_password,
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('name', COALESCE(NEW.name, 'User')),
    'authenticated',
    'authenticated'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync public.users to auth.users on UPDATE
CREATE OR REPLACE FUNCTION sync_user_to_auth_update()
RETURNS TRIGGER AS $$
DECLARE
  hashed_password TEXT;
BEGIN
  -- Update email in auth.users if changed
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE auth.users
    SET email = NEW.email,
        updated_at = NOW()
    WHERE id = NEW."openId"::uuid;
  END IF;

  -- Update password in auth.users if changed
  IF NEW.password IS DISTINCT FROM OLD.password AND NEW.password IS NOT NULL THEN
    hashed_password := crypt(NEW.password, gen_salt('bf'));
    UPDATE auth.users
    SET encrypted_password = hashed_password,
        updated_at = NOW()
    WHERE id = NEW."openId"::uuid;
  END IF;

  -- Update name in metadata
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_build_object('name', COALESCE(NEW.name, 'User')),
        updated_at = NOW()
    WHERE id = NEW."openId"::uuid;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete from auth.users when public.users is deleted
CREATE OR REPLACE FUNCTION sync_user_to_auth_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD."openId"::uuid;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER sync_user_insert
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_to_auth_insert();

CREATE TRIGGER sync_user_update
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_to_auth_update();

CREATE TRIGGER sync_user_delete
  BEFORE DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_to_auth_delete();

-- ============================================================================
-- 8. SEED DATA - USERS
-- ============================================================================

-- Clear auth.users first (optional, for clean setup)
-- TRUNCATE auth.users CASCADE;

INSERT INTO public.users ("openId", name, email, password, role, "loginMethod") VALUES
('11111111-1111-1111-1111-111111111111', 'Admin User', 'admin@example.com', 'admin123', 'admin', 'password'),
('22222222-2222-2222-2222-222222222222', 'John Doe', 'john@example.com', 'password123', 'user', 'password'),
('33333333-3333-3333-3333-333333333333', 'Jane Smith', 'jane@example.com', 'password123', 'user', 'password'),
('44444444-4444-4444-4444-444444444444', 'Bob Wilson', 'bob@example.com', 'password123', 'user', 'password')
ON CONFLICT ("openId") DO NOTHING;

-- ============================================================================
-- 9. SEED DATA - HOUSES
-- ============================================================================

INSERT INTO public.house_list (house_number, admin_email, registration_date, status, note) VALUES
('1', 'somchai.jai@example.com', '2026-01-01', 'active', 'สมาชิกหลัก'),
('2', 'somying.rak@example.com', '2026-01-15', 'active', 'สมาชิกหลัก'),
('3', 'praew.dee@example.com', '2026-02-01', 'active', 'สมาชิกหลัก'),
('4', 'malee.suk@example.com', '2026-02-10', 'active', 'สมาชิกหลัก'),
('5', 'wichai.yim@example.com', '2026-03-01', 'active', 'สมาชิกหลัก 2')
ON CONFLICT (house_number) DO NOTHING;

-- ============================================================================
-- 10. SEED DATA - HOUSE MEMBERS
-- ============================================================================

INSERT INTO public.house_members (house_id, member_email, expiration_date, note, is_active, line_id) VALUES
-- House 1 members
(1, 'somchai.jai@example.com', '2026-01-01', 'สมาชิกหลัก', TRUE, NULL),
(1, 'somying.rak@example.com', '2026-01-15', 'สมาชิกหลัก', TRUE, NULL),
(1, 'praew.dee@example.com', '2026-02-01', 'สมาชิกหลัก', TRUE, NULL),

-- House 2 members
(2, 'suda.chai@example.com', '2026-03-01', 'สมาชิกหลัก 2', TRUE, NULL),
(2, 'wichai.yim@example.com', '2026-03-01', 'สมาชิกหลัก 2', TRUE, NULL),
(2, 'suda.chai@example.com', '2026-03-14', NULL, TRUE, NULL),

-- House 3 members
(3, 'anan.pong@example.com', '2025-03-31', 'สมาชิกหลัก 3', TRUE, NULL),
(3, 'nida.sri@example.com', '2026-04-20', 'สมาชิกหลัก 2', TRUE, NULL),

-- House 4 members
(4, 'kamol.boon@example.com', '2026-05-01', 'สมาชิกหลัก 3', TRUE, NULL),

-- House 5 members (expired)
(5, 'pranee.thong@example.com', '2026-05-15', 'สมาชิกหลัก', FALSE, NULL)
ON CONFLICT (house_id, member_email) DO NOTHING;

-- ============================================================================
-- 11. SEED DATA - INFO LOG
-- ============================================================================

INSERT INTO public.info_log (
  line_id, phone_number, registration_date, expiration_date, 
  package, package_price, email, house_group, customer_name, 
  channel, sync_status, sync_note
) VALUES
('LINE001', '081-234-5678', '2026-01-01', '2027-01-01', 'Premium Package', 599.00, 'somchai.jai@example.com', '1', 'สมชาย ใจดี', 'line', 'ok', NULL),
('LINE002', '082-345-6789', '2026-01-15', '2027-01-15', 'Standard Package', 399.00, 'somying.rak@example.com', '1', 'สมหญิง รักดี', 'line', 'ok', NULL),
('LINE003', '083-456-7890', '2026-02-01', '2027-02-01', 'Basic Package', 299.00, 'praew.dee@example.com', '1', 'แพรว ดีมาก', 'facebook', 'ok', NULL),
('LINE004', '084-567-8901', '2026-02-10', '2027-02-10', 'Premium Package', 599.00, 'malee.suk@example.com', '2', 'มาลี สุขใจ', 'walk-in', 'ok', NULL),
('LINE005', '085-678-9012', '2026-03-01', '2027-03-01', 'Standard Package', 399.00, 'wichai.yim@example.com', '2', 'วิชัย ยิ้มแย้ม', 'line', 'ok', NULL),
('LINE006', NULL, '2026-03-14', '2027-03-14', 'Basic Package', 299.00, 'suda.chai@example.com', '2', 'สุดา ชัยชนะ', 'other', 'pending', 'รอการชำระเงิน'),
('LINE007', '087-890-1234', '2025-03-31', '2026-03-31', 'Premium Package', 599.00, 'anan.pong@example.com', '3', 'อนันต์ พงศ์ไพบูลย์', 'line', 'ok', NULL),
('LINE008', '088-901-2345', '2026-04-20', '2027-04-20', 'Standard Package', 399.00, 'nida.sri@example.com', '3', 'นิดา ศรีสุข', 'facebook', 'ok', NULL),
('LINE009', '089-012-3456', '2026-05-01', '2027-05-01', 'Premium Package', 599.00, 'kamol.boon@example.com', '4', 'กมล บุญมา', 'walk-in', 'ok', NULL),
('LINE010', '090-123-4567', '2026-05-15', '2027-05-15', 'Basic Package', 299.00, 'pranee.thong@example.com', '5', 'ประนี ทองดี', 'line', 'error', 'อีเมลไม่ถูกต้อง')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Get your Service Role Key from Supabase Settings > API
-- 3. Add to .env: SUPABASE_SERVICE_KEY=your_service_role_key
-- 4. Restart your dev server: pnpm run dev
-- 5. Login with: admin@example.com / admin123
-- ============================================================================

SELECT 'Database setup complete!' AS status,
       (SELECT COUNT(*) FROM public.users) AS users_count,
       (SELECT COUNT(*) FROM public.house_list) AS houses_count,
       (SELECT COUNT(*) FROM public.house_members) AS members_count,
       (SELECT COUNT(*) FROM public.info_log) AS info_logs_count;
