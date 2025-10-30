-- Create test user for login
-- Run this in your Supabase SQL Editor

INSERT INTO public.users (
  openId, 
  name, 
  email, 
  password, 
  loginMethod, 
  lastSignedIn,
  createdAt,
  updatedAt
) VALUES (
  'test-admin-001',
  'Admin User',
  'admin@example.com',
  'admin123',
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  updatedAt = NOW();

-- Verify the user was created
SELECT * FROM public.users WHERE email = 'admin@example.com';