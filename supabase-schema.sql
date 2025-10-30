-- House Customer Management System - Users Table Setup
-- Run this in Supabase SQL Editor

-- ลบของเก่าก่อน (ถ้ามี)
DROP VIEW IF EXISTS public.current_user;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TABLE IF EXISTS public.users CASCADE;

-- สร้างตาราง users ใหม่
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

-- Create index on openId for faster lookups
CREATE INDEX idx_users_openid ON users("openId");
CREATE INDEX idx_users_email ON users(email);

-- Create function to automatically update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for better security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to do everything
DROP POLICY IF EXISTS "Service role can do everything on users" ON users;
CREATE POLICY "Service role can do everything on users" ON users
    FOR ALL USING (true);

-- Grant permissions to authenticated users (through service role)
GRANT ALL ON users TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO authenticated;

-- สร้าง view สำหรับดู current user
CREATE OR REPLACE VIEW public.current_user AS
SELECT 
  u.id,
  u."openId",
  u.name,
  u.email,
  u."loginMethod",
  u.role,
  u."createdAt",
  u."lastSignedIn"
FROM public.users u
WHERE u."openId" = auth.uid()::text;

GRANT SELECT ON public.current_user TO authenticated;
