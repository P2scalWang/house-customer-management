-- Setup Users พร้อม Trigger อัตโนมัติ
-- Copy ทั้งหมด Run ใน Supabase SQL Editor

-- 0) ต้องมี pgcrypto สำหรับ gen_random_uuid() และ crypt()
create extension if not exists pgcrypto;

-- 1) ล้างข้อมูลเดิม (⚠️ ลบผู้ใช้ทั้งหมด)
truncate table public.users restart identity cascade;
delete from auth.users;

-- 2) เตรียมตาราง public.users ให้รองรับการกรอกแบบกำหนดเอง
alter table public.users
  add column if not exists password text,
  add column if not exists must_change_password boolean default true;

-- เพื่อความเป็นระเบียบ: email และ openId ไม่ซ้ำ
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname='public' and tablename='users' and indexname='users_email_key'
  ) then
    alter table public.users add constraint users_email_key unique (email);
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname='public' and tablename='users' and indexname='users_openid_key'
  ) then
    alter table public.users add constraint users_openid_key unique ("openId");
  end if;
end $$;

-- 3) Trigger: Sync INSERT/UPDATE ไปที่ auth.users
create or replace function public.biu_users_sync_auth()
returns trigger language plpgsql as $$
declare
  v_uid uuid;
begin
  if TG_OP = 'INSERT' then
    if coalesce(new.email,'') = '' then
      raise exception 'email is required';
    end if;
    if coalesce(new.password,'') = '' then
      raise exception 'password is required on insert';
    end if;

    -- สร้างแถวใน auth.users
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated','authenticated',
      new.email,
      crypt(new.password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}', '{}',
      now(), now()
    )
    returning id into v_uid;

    -- เติมค่าใน public.users
    new."openId" := v_uid::text;
    new."loginMethod" := coalesce(new."loginMethod",'email');
    new."createdAt" := coalesce(new."createdAt", now());
    new."updatedAt" := now();
    return new;

  elsif TG_OP = 'UPDATE' then
    if new."openId" is null then
      raise exception 'openId is required for update sync';
    end if;

    -- อัปเดต email ถ้าเปลี่ยน
    if new.email is distinct from old.email then
      update auth.users
        set email = new.email,
            updated_at = now()
      where id = new."openId"::uuid;
    end if;

    -- อัปเดตรหัสผ่านถ้าใส่มาใหม่ (และต่างจากเดิม)
    if new.password is not null and new.password is distinct from old.password then
      update auth.users
        set encrypted_password = crypt(new.password, gen_salt('bf')),
            updated_at = now()
      where id = new."openId"::uuid;

      new.must_change_password := true;
    end if;

    new."updatedAt" := now();
    return new;
  end if;
end $$;

drop trigger if exists trg_biu_users_sync_auth on public.users;
create trigger trg_biu_users_sync_auth
before insert or update on public.users
for each row execute function public.biu_users_sync_auth();

-- 4) Trigger: ลบ auth.users เมื่อแถว public.users ถูกลบ
create or replace function public.bd_users_delete_auth()
returns trigger language plpgsql as $$
begin
  if old."openId" is not null then
    delete from auth.users where id = old."openId"::uuid;
  end if;
  return old;
end $$;

drop trigger if exists trg_bd_users_delete_auth on public.users;
create trigger trg_bd_users_delete_auth
before delete on public.users
for each row execute function public.bd_users_delete_auth();

-- 5) สร้าง Users (ตอนนี้ง่ายมาก แค่ INSERT ลง public.users)
INSERT INTO public.users (email, password, name, role, must_change_password)
VALUES 
  ('admin@house.com', 'Admin123!', 'Admin', 'admin', false),
  ('user1@house.com', 'User1234!', 'User 1', 'user', false),
  ('user2@house.com', 'User1234!', 'User 2', 'user', false),
  ('manager@house.com', 'Manager123!', 'Manager', 'admin', false);

-- 6) ตรวจสอบผลลัพธ์
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u."openId",
  au.email as auth_email
FROM public.users u
LEFT JOIN auth.users au ON u."openId" = au.id::text
ORDER BY u.id;
