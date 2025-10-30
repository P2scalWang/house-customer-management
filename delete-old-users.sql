-- ลบ Users เก่าทั้งหมดจาก Supabase
-- Run ก่อนที่จะสร้าง users ใหม่

-- ลบจาก public.users ก่อน
DELETE FROM public.users WHERE email IN (
  'p2scalworkhost@gmail.com',
  'tgdsrgfdsgfdgdfsg@gmail.com',
  'akekorn.yord@bu.ac.th'
);

-- ลบจาก auth.users
DELETE FROM auth.users WHERE email IN (
  'p2scalworkhost@gmail.com',
  'tgdsrgfdsgfdgdfsg@gmail.com',
  'akekorn.yord@bu.ac.th'
);

-- ลบทั้งหมด (ถ้าต้องการเริ่มต้นใหม่หมด)
-- TRUNCATE TABLE public.users CASCADE;
-- DELETE FROM auth.users;

-- ตรวจสอบว่าลบหมดแล้ว
SELECT COUNT(*) as remaining_users FROM public.users;
SELECT COUNT(*) as remaining_auth_users FROM auth.users;
