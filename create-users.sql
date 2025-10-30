-- สร้าง Users ตัวอย่างสำหรับระบบ House Management
-- Run หลังจากที่รัน supabase-schema.sql แล้ว

-- สร้าง Admin User
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Admin 1: p2scalworkhost@gmail.com
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, last_sign_in_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated',
    'p2scalworkhost@gmail.com',
    crypt('Admin@2025', gen_salt('bf')), -- เปลี่ยนรหัสผ่านตามต้องการ
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}', NOW(), NOW(), NOW()
  ) RETURNING id INTO new_user_id;

  INSERT INTO public.users ("openId", email, name, "loginMethod", role)
  VALUES (
    new_user_id::text,
    'p2scalworkhost@gmail.com',
    'Work_Host p2scal',
    'email',
    'admin'
  );
  
  RAISE NOTICE 'Created admin: p2scalworkhost@gmail.com';
END $$;

-- สร้าง Users เพิ่มเติม (ถ้าต้องการ)
DO $$
DECLARE
  new_user_id uuid;
  user_data RECORD;
BEGIN
  FOR user_data IN 
    SELECT * FROM (VALUES
      -- (email, password, name, role)
      ('staff@house.com', 'Staff123!', 'พนักงาน', 'user'),
      ('manager@house.com', 'Manager123!', 'ผู้จัดการ', 'admin')
    ) AS t(email, password, name, role)
  LOOP
    -- สร้างใน auth.users
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, last_sign_in_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      user_data.email,
      crypt(user_data.password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}', NOW(), NOW(), NOW()
    ) RETURNING id INTO new_user_id;

    -- สร้างใน public.users
    INSERT INTO public.users ("openId", email, name, "loginMethod", role)
    VALUES (
      new_user_id::text,
      user_data.email,
      user_data.name,
      'email',
      user_data.role
    );
    
    RAISE NOTICE 'Created user: %', user_data.email;
  END LOOP;
END $$;

-- ตรวจสอบ users ที่สร้าง
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u."createdAt"
FROM public.users u
ORDER BY u.id;
