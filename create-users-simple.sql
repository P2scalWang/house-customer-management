-- Copy ทั้งหมดไป Run ใน Supabase SQL Editor
-- สร้าง Users 4 คน จบในครั้งเดียว

-- ลบทิ้งก่อน
DROP TABLE IF EXISTS public.users CASCADE;
TRUNCATE auth.users CASCADE;

-- สร้างตาราง users

CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role VARCHAR(20) DEFAULT 'user' NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "lastSignedIn" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_users_openid ON users("openId");
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON users FOR ALL USING (true);
GRANT ALL ON users TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO authenticated;

-- สร้าง Users
DO $$
DECLARE uid uuid;
BEGIN
  -- Admin
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'admin@house.com', crypt('Admin123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '') RETURNING id INTO uid;
  INSERT INTO public.users ("openId", email, name, "loginMethod", role) VALUES (uid::text, 'admin@house.com', 'Admin', 'email', 'admin');
  
  -- User 1
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'user1@house.com', crypt('User1234!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '') RETURNING id INTO uid;
  INSERT INTO public.users ("openId", email, name, "loginMethod", role) VALUES (uid::text, 'user1@house.com', 'User 1', 'email', 'user');
  
  -- User 2
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'user2@house.com', crypt('User1234!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '') RETURNING id INTO uid;
  INSERT INTO public.users ("openId", email, name, "loginMethod", role) VALUES (uid::text, 'user2@house.com', 'User 2', 'email', 'user');
  
  -- Manager
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'manager@house.com', crypt('Manager123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', '') RETURNING id INTO uid;
  INSERT INTO public.users ("openId", email, name, "loginMethod", role) VALUES (uid::text, 'manager@house.com', 'Manager', 'email', 'admin');
END $$;

-- ตรวจสอบ
SELECT au.email, pu.name, pu.role FROM auth.users au LEFT JOIN public.users pu ON au.id::text = pu."openId";
