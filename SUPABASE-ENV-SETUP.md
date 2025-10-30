# Supabase Environment Variables Setup

## ขั้นตอนการตั้งค่า Environment Variables ใน Vercel:

### 1. ไปที่ Vercel Dashboard
- เข้า https://vercel.com/dashboard
- เลือก project `house-customer-management`
- ไปที่ tab **Settings**
- เลือก **Environment Variables**

### 2. เพิ่ม Environment Variables:

```bash
# Required Variables:
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# หรือใช้ SERVICE_ROLE_KEY (แนะนำสำหรับ development):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. หา Keys ใน Supabase:
- ไปที่ Supabase Dashboard
- เลือก Project
- ไปที่ **Settings** → **API**
- Copy:
  - **Project URL** → `SUPABASE_URL`
  - **anon public** key → `SUPABASE_ANON_KEY`
  - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (ถ้าต้องการ)

### 4. Environment ทั้งหมด:
ตั้งค่าให้ environment ทั้งหมด:
- ✅ Production
- ✅ Preview  
- ✅ Development

### 5. Redeploy:
หลังจากเพิ่ม environment variables แล้ว:
- ไปที่ tab **Deployments**
- กด **Redeploy** deployment ล่าสุด
- หรือ push commit ใหม่ใน GitHub

## การเลือกใช้ Key:

### ANON_KEY (Public):
- ✅ ปลอดภัยกว่า
- ❌ ต้องตั้งค่า RLS policies ให้ถูกต้อง
- ❌ อาจมีปัญหาการเข้าถึงข้อมูล

### SERVICE_ROLE_KEY (Private):
- ✅ เข้าถึงข้อมูลได้ทั้งหมด (ไม่ติด RLS)
- ✅ ง่ายกว่าสำหรับ development
- ❌ ต้องเก็บไว้เป็นความลับ
- ❌ อันตรายถ้าหลุด

## สำหรับ Development แนะนำใช้ SERVICE_ROLE_KEY
## สำหรับ Production แนะนำใช้ ANON_KEY + RLS policies ที่ถูกต้อง