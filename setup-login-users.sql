-- SQL สำหรับสร้าง Users ง่ายๆ แค่ Email และ Password
-- Copy และ Run ใน Supabase SQL Editor

-- ============================================
-- ขั้นตอนที่ 0: สร้างตาราง users (ถ้ายังไม่มี)
-- ============================================

-- ลบตารางเก่า (ถ้ามี)
DROP TABLE IF EXISTS public.users CASCADE;

-- สร้างตาราง users
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

-- สร้าง indexes
CREATE INDEX idx_users_openid ON users("openId");
CREATE INDEX idx_users_email ON users(email);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Service role can do everything on users" ON users;
CREATE POLICY "Service role can do everything on users" ON users
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON users TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO authenticated;

-- ============================================
-- ขั้นตอนที่ 1: เปิดใช้งาน Email Authentication
-- ============================================
-- ไปที่ Supabase Dashboard → Authentication → Providers
-- เปิดใช้งาน "Email" provider
-- ปิด "Confirm email" (ไม่ต้องยืนยันอีเมล)

-- ============================================
-- ขั้นตอนที่ 2: สร้าง User สำหรับ Login
-- ============================================

-- สร้าง Admin User
DO $$
DECLARE
  new_user_id uuid;
  existing_email text;
BEGIN
  -- ตรวจสอบว่ามี email นี้อยู่แล้วหรือไม่
  SELECT email INTO existing_email FROM auth.users WHERE email = 'admin@house.com';
  
  IF existing_email IS NOT NULL THEN
    RAISE NOTICE 'User admin@house.com มีอยู่แล้ว - ข้าม';
  ELSE
    -- สร้างใน auth.users (ตาราง authentication ของ Supabase)
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@house.com',                      -- เปลี่ยน Email ตามต้องการ
      crypt('Admin123!', gen_salt('bf')),     -- เปลี่ยน Password ตามต้องการ (อย่างน้อย 6 ตัว)
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO new_user_id;

    -- เพิ่มข้อมูลเพิ่มเติมใน public.users (ถ้ามีตาราง users)
    INSERT INTO public.users ("openId", email, name, "loginMethod", role)
    VALUES (
      new_user_id::text,
      'admin@house.com',                      -- Email เดียวกับด้านบน
      'ผู้ดูแลระบบ',                          -- ชื่อที่ต้องการแสดง
      'email',
      'admin'                                 -- 'user' หรือ 'admin'
    );

    RAISE NOTICE 'สร้าง User สำเร็จ: admin@house.com';
  END IF;
END $$;

-- ============================================
-- สร้างหลาย Users พร้อมกัน
-- ============================================

DO $$
DECLARE
  new_user_id uuid;
  user_info RECORD;
  existing_email text;
BEGIN
  -- กำหนด Email และ Password ของแต่ละคน
  FOR user_info IN 
    SELECT * FROM (VALUES
      ('user1@house.com', 'User1234!', 'พนักงาน 1', 'user'),
      ('user2@house.com', 'User1234!', 'พนักงาน 2', 'user'),
      ('manager@house.com', 'Manager123!', 'ผู้จัดการ', 'admin')
    ) AS t(email, password, name, role)
  LOOP
    -- ตรวจสอบว่ามี email นี้อยู่แล้วหรือไม่
    SELECT email INTO existing_email FROM auth.users WHERE email = user_info.email;
    
    IF existing_email IS NOT NULL THEN
      RAISE NOTICE 'User % มีอยู่แล้ว - ข้าม', user_info.email;
    ELSE
      -- สร้างใน auth.users
      INSERT INTO auth.users (
        instance_id, id, aud, role, email,
        encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token,
        email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(), 'authenticated', 'authenticated',
        user_info.email,
        crypt(user_info.password, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{}', NOW(), NOW(), '', '', '', ''
      ) RETURNING id INTO new_user_id;

      -- เพิ่มใน public.users
      INSERT INTO public.users ("openId", email, name, "loginMethod", role)
      VALUES (
        new_user_id::text,
        user_info.email,
        user_info.name,
        'email',
        user_info.role
      );
      
      RAISE NOTICE 'สร้าง User: % สำเร็จ', user_info.email;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- ตรวจสอบ Users ที่สร้าง
-- ============================================

-- ดู Users ทั้งหมดที่สร้างไว้
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.last_sign_in_at
FROM auth.users au
ORDER BY au.created_at DESC;

-- ดูข้อมูลใน public.users (ถ้ามี)
SELECT 
  id,
  email,
  name,
  role,
  "createdAt"
FROM public.users
ORDER BY id DESC;

-- ============================================
-- คำแนะนำ: เปลี่ยน Password
-- ============================================

/*
-- เปลี่ยน Password ของ User (เปลี่ยน email และ new_password)
UPDATE auth.users
SET 
  encrypted_password = crypt('new_password_here', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'user@house.com';
*/

-- ============================================
-- คำแนะนำ: ลบ User
-- ============================================

/*
-- ลบ User (เปลี่ยน email)
DELETE FROM public.users WHERE email = 'user@house.com';
DELETE FROM auth.users WHERE email = 'user@house.com';
*/
