-- Supabase Authentication Setup for House Customer Management
-- Run this in Supabase SQL Editor after enabling Email Auth in Authentication settings

-- 1. Make sure auth.users is synced with our public.users table
-- Create a trigger to automatically create a user record when someone signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users ("openId", email, name, "loginMethod", role, "lastSignedIn")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    'user',
    NOW()
  )
  ON CONFLICT ("openId") DO UPDATE
  SET 
    "lastSignedIn" = NOW(),
    email = EXCLUDED.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Update existing auth.users to sync with public.users (if needed)
-- This helps if you already have users in auth.users but not in public.users
INSERT INTO public.users ("openId", email, name, "loginMethod", role, "createdAt", "updatedAt", "lastSignedIn")
SELECT 
  au.id::text,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', SPLIT_PART(au.email, '@', 1)),
  COALESCE(au.raw_app_meta_data->>'provider', 'email'),
  'user',
  au.created_at,
  NOW(),
  COALESCE(au.last_sign_in_at, au.created_at)
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu."openId" = au.id::text
)
ON CONFLICT ("openId") DO NOTHING;

-- 3. Optional: Create admin user (replace with your actual email)
-- Uncomment and modify the email below to make yourself an admin
/*
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'p2scalworkhost@gmail.com';
*/

-- 4. Set up Row Level Security policies for better security
-- Allow users to read their own data
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (auth.uid()::text = "openId" OR role = 'admin');

-- Allow users to update their own data
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (auth.uid()::text = "openId")
  WITH CHECK (auth.uid()::text = "openId");

-- 5. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO authenticated;

-- 6. Optional: Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE "openId" = auth.uid()::text
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Optional: Create a view for current user info
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
