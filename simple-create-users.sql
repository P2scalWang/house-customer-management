-- ==============================================
-- SQL สำหรับสร้าง Users ง่ายๆ (ลบและสร้างใหม่)
-- Copy และ Run ใน Supabase SQL Editor
-- ==============================================

-- ขั้นตอนที่ 1: ลบตารางเก่าและ Users เก่า
-- ==============================================
DROP TABLE IF EXISTS public.users CASCADE;
DELETE FROM auth.users;

-- ขั้นตอนที่ 2: สร้างตาราง users ใหม่
-- ==============================================

CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role VARCHAR(20) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "lastSignedIn" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_openid ON users("openId");
CREATE INDEX idx_users_email ON users(email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can do everything on users" ON users;
CREATE POLICY "Service role can do everything on users" ON users FOR ALL USING (true);

GRANT ALL ON users TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO authenticated;

-- ขั้นตอนที่ 3: สร้าง Admin User
-- ==============================================
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@house.com',
    crypt('Admin123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(), NOW(), '', '', '', ''
  ) RETURNING id INTO new_user_id;

  INSERT INTO public.users ("openId", email, name, "loginMethod", role)
  VALUES (new_user_id::text, 'admin@house.com', 'ผู้ดูแลระบบ', 'email', 'admin');

  RAISE NOTICE 'สร้าง Admin: admin@house.com / Admin123!';
END $$;

-- ขั้นตอนที่ 4: สร้าง Users อื่นๆ
-- ==============================================
DO $$
DECLARE
  new_user_id uuid;
  user_info RECORD;
BEGIN
  FOR user_info IN 
    SELECT * FROM (VALUES
      ('user1@house.com', 'User1234!', 'พนักงาน 1', 'user'),
      ('user2@house.com', 'User1234!', 'พนักงาน 2', 'user'),
      ('manager@house.com', 'Manager123!', 'ผู้จัดการ', 'admin')
    ) AS t(email, password, name, role)
  LOOP
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      user_info.email,
      crypt(user_info.password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}', NOW(), NOW(), '', '', '', ''
    ) RETURNING id INTO new_user_id;

    INSERT INTO public.users ("openId", email, name, "loginMethod", role)
    VALUES (new_user_id::text, user_info.email, user_info.name, 'email', user_info.role);
    
    RAISE NOTICE 'สร้าง User: % / %', user_info.email, user_info.password;
  END LOOP;
END $$;

-- ตรวจสอบ Users ที่สร้าง
-- ==============================================
SELECT 
  au.email,
  pu.name,
  pu.role,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id::text = pu."openId"
ORDER BY au.created_at DESC;
