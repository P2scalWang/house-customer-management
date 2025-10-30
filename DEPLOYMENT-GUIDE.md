# 🚀 คู่มือ Deploy แอปพลิเคชัน

## 📋 ขั้นตอนการ Deploy

### 1. เตรียม Repository บน GitHub

1. **สร้าง GitHub Repository ใหม่:**
   - ไปที่ [GitHub.com](https://github.com)
   - กด "New Repository"
   - ตั้งชื่อ: `house-customer-management`
   - เลือก Public หรือ Private ตามต้องการ
   - กด "Create repository"

2. **Push โค้ดขึ้น GitHub:**
   ```bash
   # ใน folder โปรเจกต์
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/house-customer-management.git
   git push -u origin main
   ```

### 2. เตรียม Supabase Database

1. **สร้าง Supabase Project:**
   - ไปที่ [Supabase.com](https://supabase.com)
   - สร้าง Account หรือ Sign in
   - กด "New Project"
   - เลือก Organization
   - ตั้งชื่อ Project: `house-customer-management`
   - เลือก Region: `Southeast Asia (Singapore)`
   - ตั้ง Database Password (เก็บไว้ดีๆ!)
   - กด "Create new project"

2. **รัน SQL Schema:**
   - ไปที่ SQL Editor ใน Supabase Dashboard
   - Copy SQL จากไฟล์ `setup-complete-database.sql`
   - กด "Run" เพื่อสร้างตารางทั้งหมด

3. **เก็บ Environment Variables:**
   - ไปที่ Settings > API
   - copy:
     - `Project URL`
     - `anon public key`
     - `service_role key` (ใช้ระวัง!)

### 3. Deploy บน Vercel

1. **สร้าง Vercel Account:**
   - ไปที่ [Vercel.com](https://vercel.com)
   - Sign up ด้วย GitHub Account

2. **เชื่อม GitHub Repository:**
   - กด "New Project"
   - เลือก GitHub Repository: `house-customer-management`
   - กด "Import"

3. **ตั้งค่า Environment Variables:**
   ใน Vercel Dashboard > Settings > Environment Variables เพิ่ม:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NODE_ENV=production
   ```

4. **Deploy:**
   - กด "Deploy"
   - รอสักครู่ จะได้ URL เสร็จ!

### 4. Custom Domain (Optional)

1. **ซื้อ Domain:**
   - Namecheap, GoDaddy, หรือ CloudFlare

2. **เชื่อม Domain กับ Vercel:**
   - ใน Vercel > Settings > Domains
   - เพิ่ม Domain ของคุณ
   - ตั้งค่า DNS ตามที่ Vercel แนะนำ

## 🛠️ ไฟล์ที่จำเป็นสำหรับ Deploy

### `.env.example` (สำหรับคนอื่นใช้)
```
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NODE_ENV=development
```

### `vercel.json` (มีอยู่แล้ว)
```json
{
  "functions": {
    "server/_core/index.ts": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/server/_core/index.ts"
    },
    {
      "source": "/((?!api).*)",
      "destination": "/client/index.html"
    }
  ]
}
```

## 📚 ข้อมูลเพิ่มเติม

### GitHub Commands ที่ใช้บ่อย:
```bash
# ดู status
git status

# เพิ่มไฟล์ใหม่
git add .

# Commit การเปลี่ยนแปลง
git commit -m "อธิบายการเปลี่ยนแปลง"

# Push ขึ้น GitHub
git push

# ดู branch
git branch

# สร้าง branch ใหม่
git checkout -b feature-name
```

### Vercel Commands:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy จาก Local
vercel

# Deploy Production
vercel --prod
```

### สิ่งที่ต้องระวัง:
1. **ห้าม commit** ไฟล์ `.env` ที่มี secret keys
2. **ใช้ Environment Variables** สำหรับ sensitive data
3. **Test ก่อน deploy** ทุกครั้ง
4. **Backup database** ก่อนทำการเปลี่ยนแปลงใหญ่

### URL ที่สำคัญ:
- **GitHub:** https://github.com/YOUR_USERNAME/house-customer-management
- **Vercel:** https://your-app.vercel.app
- **Supabase:** https://your-project.supabase.co

## 🆘 แก้ปัญหาเบื้องต้น

### ถ้า Deploy ไม่สำเร็จ:
1. ตรวจสอบ Environment Variables
2. ดู Logs ใน Vercel Dashboard
3. ตรวจสอบ Supabase Connection
4. ลอง Deploy ใหม่

### ถ้าฐานข้อมูลเสีย:
1. Export ข้อมูลจาก Supabase (ถ้ามี)
2. รัน SQL Schema ใหม่
3. Import ข้อมูลกลับเข้าไป

---
**🎉 เสร็จแล้ว! แอปพลิเคชันของคุณพร้อม Deploy แล้ว!**