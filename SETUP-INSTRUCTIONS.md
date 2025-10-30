# 🏠 House Customer Management - Setup Instructions

## 📋 วิธีตั้งค่าฐานข้อมูล Supabase ใหม่

### ขั้นตอนที่ 1: เตรียมฐานข้อมูล Supabase

1. **เข้าสู่ Supabase Dashboard**
   - ไปที่ https://supabase.com/dashboard
   - เข้าสู่โปรเจกต์ของคุณ หรือสร้างโปรเจกต์ใหม่

2. **เปิด SQL Editor**
   - ในเมนูด้านซ้าย คลิกที่ **SQL Editor**
   - คลิกปุ่ม **New Query**

3. **รัน SQL Setup Script**
   - เปิดไฟล์ `setup-complete-database.sql` ในโปรเจกต์นี้
   - คัดลอกเนื้อหาทั้งหมด (Ctrl+A, Ctrl+C)
   - วางในหน้า SQL Editor (Ctrl+V)
   - คลิกปุ่ม **RUN** หรือกด F5

4. **ตรวจสอบผลลัพธ์**
   - ดูข้อความ "Database setup complete!"
   - ตรวจสอบจำนวนข้อมูลที่สร้างขึ้น:
     - users_count: 4
     - houses_count: 5
     - members_count: 10
     - info_logs_count: 10

### ขั้นตอนที่ 2: ตั้งค่า Environment Variables

1. **รับ Service Role Key**
   - ไปที่ **Settings** > **API** ในเมนูด้านซ้าย
   - หาส่วน **Project API keys**
   - คัดลอก **Service role key** (ตัวยาวๆ เริ่มต้นด้วย `eyJ...`)

2. **อัปเดตไฟล์ .env**
   - เปิดไฟล์ `.env` ในโฟลเดอร์รากของโปรเจกต์
   - เพิ่มหรืออัปเดตบรรทัดนี้:
   ```env
   SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
   ```
   - เปลี่ยน `YOUR_SERVICE_ROLE_KEY_HERE` เป็น Service Role Key ที่คัดลอกมา

3. **ตรวจสอบไฟล์ .env ให้ครบถ้วน**
   ```env
   SUPABASE_URL=https://wuxwznnoavedknivehkx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_APP_ID=house-customer-management
   JWT_SECRET=change-this-to-a-very-long-and-secure-secret-key
   OAUTH_SERVER_URL=http://localhost:5000
   OWNER_OPEN_ID=11111111-1111-1111-1111-111111111111
   DISABLE_AUTH=true
   VITE_DISABLE_AUTH=true
   ```

### ขั้นตอนที่ 3: รันโปรแกรม

1. **เริ่มต้น Dev Server**
   ```powershell
   pnpm run dev
   ```

2. **เปิดเบราว์เซอร์**
   - ไปที่ http://localhost:3002 (หรือพอร์ตที่แสดงในเทอร์มินัล)

3. **ทดสอบล็อกอิน** (ถ้าปิด DISABLE_AUTH)
   - Email: `admin@example.com`
   - Password: `admin123`

### ขั้นตอนที่ 4: ตรวจสอบข้อมูล

เมื่อเข้าสู่ Dashboard ควรจะเห็น:
- ✅ **ข้อมูล InfoLog**: 10 รายการ
- ✅ **จำนวนบ้าน**: 5 บ้าน
- ✅ **สมาชิกทั้งหมด**: 10 คน
- ✅ **บ้านหมดอายุ**: 0 บ้าน (ขึ้นอยู่กับ status)

---

## 🔐 บัญชีผู้ใช้ตัวอย่าง

### Admin Account
- **Email**: admin@example.com
- **Password**: admin123
- **Role**: admin

### User Accounts
- **Email**: john@example.com | **Password**: password123
- **Email**: jane@example.com | **Password**: password123
- **Email**: bob@example.com | **Password**: password123

---

## 📊 ข้อมูลตัวอย่างที่สร้างขึ้น

### 🏘️ Houses (5 บ้าน)
- บ้านเลขที่ 1-5
- แอดมินอีเมลกำหนดให้แต่ละบ้าน
- สถานะ: active

### 👥 Members (10 สมาชิก)
- กระจายอยู่ใน 5 บ้าน
- มีวันหมดอายุและสถานะแตกต่างกัน
- สมาชิกบางคนใช้งานอยู่ (is_active = true)

### 📝 Info Logs (10 รายการ)
- ข้อมูลลูกค้า พร้อม Line ID, เบอร์โทร
- แพ็กเกจต่างๆ (Basic, Standard, Premium)
- สถานะ sync (ok, pending, error)
- ช่องทางการติดต่อ (line, facebook, walk-in)

---

## 🔧 การแก้ไขปัญหา

### ❌ ข้อมูลไม่แสดง (แสดง 0)

**สาเหตุ 1**: ไม่ได้ตั้งค่า SUPABASE_SERVICE_KEY
```
✅ แก้ไข: เพิ่ม SUPABASE_SERVICE_KEY ในไฟล์ .env
```

**สาเหตุ 2**: ไม่ได้รัน SQL Script
```
✅ แก้ไข: รัน setup-complete-database.sql ใน Supabase SQL Editor
```

**สาเหตุ 3**: Dev server ยังไม่ reload
```
✅ แก้ไข: หยุดเซิร์ฟเวอร์ (Ctrl+C) และรันใหม่ pnpm run dev
```

### ❌ Login ไม่ได้

**สาเหตุ**: ข้อมูล auth.users ไม่ตรงกับ public.users
```
✅ แก้ไข: Trigger จะ sync อัตโนมัติ หรือรัน SQL Script ใหม่ทั้งหมด
```

### ❌ Error: relation "public.users" does not exist

**สาเหตุ**: SQL Script ยังไม่ได้รัน
```
✅ แก้ไข: รัน setup-complete-database.sql ครบทั้งไฟล์
```

---

## 📝 หมายเหตุสำคัญ

1. **Service Role Key**: ใช้เฉพาะฝั่ง server เท่านั้น ห้ามเปิดเผยหรือส่งไปฝั่ง client
2. **Password Hashing**: ระบบใช้ pgcrypto เพื่อเข้ารหัสรหัสผ่านอัตโนมัติ
3. **Auto Sync**: เมื่อเพิ่ม/แก้ไข public.users จะ sync ไป auth.users โดยอัตโนมัติ
4. **RLS**: ปิดไว้เพื่อความสะดวกในการพัฒนา (ใช้ Service Role Key)
5. **Triggers**: อัปเดต updated_at ทุกตารางอัตโนมัติ

---

## 🎯 ขั้นตอนถัดไป

หลังจากระบบทำงานแล้ว คุณสามารถ:
1. ✏️ แก้ไขข้อมูลตัวอย่างใน SQL Script ตามต้องการ
2. 🔐 เปลี่ยน DISABLE_AUTH เป็น false เพื่อบังคับ login
3. 🛡️ เปิด RLS และเพิ่ม Policies สำหรับความปลอดภัย
4. 📊 เพิ่มข้อมูลทดสอบเพิ่มเติมผ่าน UI

---

**✨ หากมีปัญหาหรือข้อสงสัย ติดต่อ Developer ได้เลย!**
