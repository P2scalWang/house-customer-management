-- สร้าง Users สำหรับ Login แบบง่าย ๆ
-- Copy และ Run ใน Supabase SQL Editor

-- ============================================
-- ขั้นตอนที่ 1: สร้างตาราง users (ถ้ายังไม่มี)
-- ============================================

-- ลบตารางเก่า (ถ้ามี)
DROP TABLE IF EXISTS public.users CASCADE;

-- สร้างตาราง users
CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320) NOT NULL UNIQUE,
  password TEXT NOT NULL, -- เก็บ password แบบ plain text สำหรับการเทียบง่าย ๆ
  "loginMethod" VARCHAR(64) DEFAULT 'simple',
  role VARCHAR(20) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "lastSignedIn" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- สร้าง indexes
CREATE INDEX idx_users_email ON users(email);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all access to users table" ON users;
DROP POLICY IF EXISTS "Service role can do everything on users" ON users;
DROP POLICY IF EXISTS "Allow public access to users for login" ON users;

-- Create policy for service role (full access)
CREATE POLICY "Service role can do everything on users" ON users
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create policy for authenticated users (can read their own data)
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT 
    TO authenticated
    USING (true);

-- Create policy for anon users (for login endpoint)
CREATE POLICY "Allow anon access for login" ON users
    FOR SELECT 
    TO anon
    USING (true);

-- Grant permissions
GRANT ALL ON users TO service_role;
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON users TO anon;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO authenticated;

-- ============================================
-- ขั้นตอนที่ 2: เพิ่ม Users
-- ============================================

-- สร้าง Admin User
INSERT INTO public.users ("openId", email, password, name, role)
VALUES (
  'admin-001',
  'admin@house.com',
  'admin123',
  'ผู้ดูแลระบบ',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- สร้าง User ทั่วไป
INSERT INTO public.users ("openId", email, password, name, role)
VALUES 
  ('user-001', 'user@house.com', 'user123', 'พนักงาน 1', 'user'),
  ('user-002', 'manager@house.com', 'manager123', 'ผู้จัดการ', 'admin'),
  ('user-003', 'demo@house.com', 'demo123', 'ผู้ใช้ทดสอบ', 'user')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- ตรวจสอบ Users ที่สร้าง
-- ============================================

SELECT 
  id,
  email,
  password,
  name,
  role,
  "createdAt"
FROM public.users
ORDER BY id;

-- ============================================
-- Login Information
-- ============================================

-- ข้อมูลสำหรับ Login:
-- Admin: admin@house.com / admin123
-- User: user@house.com / user123  
-- Manager: manager@house.com / manager123
-- Demo: demo@house.com / demo123

-- ============================================
-- Supabase Setup Instructions
-- ============================================

/*
1. ไปที่ Supabase Dashboard
2. เลือก Project ของคุณ
3. ไปที่ SQL Editor
4. Copy & Paste SQL ข้างบนทั้งหมด
5. กด Run

6. ตรวจสอบ Environment Variables ใน Vercel:
   - SUPABASE_URL=https://your-project-id.supabase.co
   - SUPABASE_ANON_KEY=eyJhbGc... (หรือใช้ SUPABASE_SERVICE_ROLE_KEY)

7. ถ้าใช้ ANON_KEY ให้แน่ใจว่า RLS policies อนุญาตให้ anon อ่านข้อมูล users ได้
   ถ้าใช้ SERVICE_ROLE_KEY จะไม่ติด RLS (แนะนำสำหรับ development)

8. ทดสอบ login ที่ /login
*/