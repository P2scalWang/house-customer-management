# การตั้งค่าระบบ Login ด้วย Supabase

## 🗑️ ขั้นตอนที่ 0A: ลบ Users เก่า (ถ้ามี)

**ถ้ามี users เก่าอยู่แล้ว (จาก Google/Microsoft login) ให้ลบก่อน:**

1. ไปที่ **SQL Editor**
2. Copy และ Run SQL จากไฟล์ `delete-old-users.sql`
3. SQL นี้จะลบ users เก่าทั้งหมด

## ⚠️ ขั้นตอนที่ 0B: ลบตารางเก่าและสร้างใหม่

1. ไปที่ **SQL Editor** ใน Supabase Dashboard
2. Copy และ Run SQL จากไฟล์ `supabase-schema.sql`
3. SQL นี้จะ:
   - ✅ ลบ `users` table เก่า
   - ✅ ลบ `current_user` view เก่า
   - ✅ ลบ triggers และ indexes เก่า
   - ✅ สร้างตาราง `users` ใหม่พร้อม structure ที่ถูกต้อง
   - ✅ สร้าง indexes สำหรับ performance
   - ✅ สร้าง triggers สำหรับ auto-update
   - ✅ สร้าง view `current_user`
   - ✅ ตั้งค่า Row Level Security (RLS)

## ขั้นตอนที่ 1: เปิดใช้งาน Email Authentication

1. ไปที่ Supabase Dashboard: https://supabase.com/dashboard
2. เลือก Project ของคุณ (wuxwznnoavedknivehkx)
3. ไปที่เมนู **Authentication** (ด้านซ้าย)
4. คลิกที่แท็บ **Providers**
5. เปิดใช้งาน **Email** provider:
   - สไลด์ toggle ให้เป็นสีเขียว
   - **Confirm email**: ปิด (ไม่ต้องยืนยันอีเมล)
   - **Enable email confirmations**: ปิด
   - คลิก **Save**

## ขั้นตอนที่ 2: สร้าง Users (Admin เท่านั้นที่สร้างได้)

### วิธีที่ 1: ผ่าน Supabase Dashboard (แนะนำ)

1. ไปที่ **Authentication** → **Users**
2. คลิกปุ่ม **Add user** → **Create new user**
3. กรอกข้อมูล:
   - **Email**: อีเมลของ user
   - **Password**: รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
   - **Auto Confirm User**: เปิด (✅)
4. คลิก **Create user**
5. Copy **User UID** ที่ได้
6. ไปที่ **SQL Editor** และรัน:

```sql
-- เพิ่ม user เข้าตาราง public.users
INSERT INTO public.users ("openId", email, name, "loginMethod", role)
VALUES (
  'user-uid-ที่-copy-มา',  -- เปลี่ยนเป็น User UID จริง
  'user@example.com',       -- อีเมลของ user
  'ชื่อผู้ใช้',             -- ชื่อที่ต้องการแสดง
  'email',
  'user'                    -- หรือ 'admin' ถ้าต้องการให้เป็น admin
);
```

### วิธีที่ 2: ใช้ SQL เลย (เร็วกว่า - แนะนำ!)

**ใช้ไฟล์ `create-users.sql` ที่เตรียมไว้แล้ว:**

1. ไปที่ **SQL Editor**
2. เปิดไฟล์ `create-users.sql`
3. แก้ email, password, name ตามต้องการ (บรรทัด 28-30)
4. คลิก **Run**
5. จะสร้าง admin user และ users อื่นๆ ตามที่กำหนด

**หรือสร้างแบบ custom:**

1. ไปที่ **SQL Editor**
2. รันโค้ดนี้ (แก้ email, password, name ตามต้องการ):

```sql
-- สร้าง user ใน auth.users และ public.users พร้อมกัน
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- สร้าง user ใน auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
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
    'admin@example.com',  -- เปลี่ยนอีเมล
    crypt('password123', gen_salt('bf')),  -- เปลี่ยนรหัสผ่าน (อย่างน้อย 6 ตัว)
    NOW(),
    NOW(),
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

  -- เพิ่มลงใน public.users
  INSERT INTO public.users ("openId", email, name, "loginMethod", role)
  VALUES (
    new_user_id::text,
    'admin@example.com',  -- อีเมลเดียวกับด้านบน
    'ผู้ดูแลระบบ',        -- ชื่อที่ต้องการ
    'email',
    'admin'               -- 'user' หรือ 'admin'
  );

  RAISE NOTICE 'User created successfully with ID: %', new_user_id;
END $$;
```

### สร้าง Admin User (ตัวอย่าง)

```sql
-- สร้าง Admin
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, last_sign_in_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated',
    'p2scalworkhost@gmail.com',
    crypt('Admin@2025', gen_salt('bf')),
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
END $$;
```

### สร้างหลาย Users พร้อมกัน (ตัวอย่าง)

```sql
-- สร้าง 3 users พร้อมกัน
DO $$
DECLARE
  new_user_id uuid;
  user_data RECORD;
BEGIN
  -- กำหนดข้อมูล users (แก้ตามต้องการ)
  FOR user_data IN 
    SELECT * FROM (VALUES
      ('admin@house.com', 'Admin123!', 'ผู้ดูแลระบบ', 'admin'),
      ('staff1@house.com', 'Staff123!', 'พนักงาน 1', 'user'),
      ('staff2@house.com', 'Staff123!', 'พนักงาน 2', 'user')
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
```

## ขั้นตอนที่ 3: ทดสอบ Login

1. เปิด http://localhost:3001/login
2. กรอก Email และ Password ที่สร้างไว้
3. คลิก "เข้าสู่ระบบ"
4. ถ้าสำเร็จจะ redirect ไปหน้า Dashboard

## การจัดการ Users

### ดู Users ทั้งหมด

```sql
-- ดู users ที่ login ได้
SELECT 
  u.id, 
  u."openId", 
  u.email, 
  u.name, 
  u.role,
  u."lastSignedIn"
FROM public.users u;
```

### เปลี่ยน Password

```sql
-- เปลี่ยนรหัสผ่าน (เปลี่ยน email และ new_password)
UPDATE auth.users
SET encrypted_password = crypt('new_password', gen_salt('bf'))
WHERE email = 'user@example.com';
```

### เปลี่ยนเป็น Admin

```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

### ลบ User

```sql
-- ลบจาก public.users
DELETE FROM public.users WHERE email = 'user@example.com';

-- ลบจาก auth.users
DELETE FROM auth.users WHERE email = 'user@example.com';
```

## ปัญหาที่อาจเจอ

### Login ไม่ได้ - "อีเมลหรือรหัสผ่านไม่ถูกต้อง"

**สาเหตุ:**
- Email หรือ Password ผิด
- User ยังไม่ถูกสร้างใน auth.users
- Email Authentication ยังไม่เปิด

**แก้:**
1. ตรวจสอบ Email/Password ให้ถูกต้อง
2. ตรวจสอบว่ามี user ใน auth.users:
```sql
SELECT email, created_at FROM auth.users WHERE email = 'your@email.com';
```

### Login ได้แต่ขึ้น "ไม่พบข้อมูลผู้ใช้"

**สาเหตุ:** User มีใน auth.users แต่ไม่มีใน public.users

**แก้:** เพิ่ม user ลง public.users
```sql
INSERT INTO public.users ("openId", email, name, "loginMethod", role)
SELECT 
  id::text,
  email,
  SPLIT_PART(email, '@', 1),
  'email',
  'user'
FROM auth.users
WHERE email = 'your@email.com';
```

## Environment Variables ที่จำเป็น

ตรวจสอบไฟล์ `.env`:

```env
SUPABASE_URL=https://wuxwznnoavedknivehkx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_ID=house-customer-management
JWT_SECRET=change-this-to-a-very-long-and-secure-secret-key-at-least-32-characters-long
```

## สรุป

✅ **ไม่มีหน้า Signup** - เฉพาะ Admin เท่านั้นที่สร้าง user ได้
✅ **Login ด้วย Email/Password** - เช็คจาก Supabase Auth
✅ **ข้อมูล User** - เก็บใน 2 ที่:
  - `auth.users` - สำหรับ authentication
  - `public.users` - ข้อมูลเพิ่มเติม (role, name, etc.)
✅ **ปลอดภัย** - Password เข้ารหัสด้วย bcrypt ใน Supabase
