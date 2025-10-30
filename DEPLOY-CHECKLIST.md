# 📝 Checklist สำหรับ Deploy

## ✅ ขั้นตอนการ Deploy ทีละขั้น

### 🔧 เตรียมโค้ด
- [ ] ตรวจสอบโค้ดทำงานปกติใน localhost
- [ ] สร้าง `.env.example` ไฟล์
- [ ] ลบไฟล์ `.env` ออกจาก git (ถ้ามี)
- [ ] ตรวจสอบ `vercel.json` config
- [ ] เขียน `README.md` ให้ครบถ้วน

### 🗃️ เตรียม Database
- [ ] สร้าง Supabase Project ใหม่
- [ ] รัน `setup-complete-database.sql`
- [ ] รัน `setup-sales-emails.sql` (ถ้าต้องการ)
- [ ] ตรวจสอบข้อมูลตัวอย่างใน tables
- [ ] เก็บ Supabase URL และ Keys

### 📤 Push ขึ้น GitHub
- [ ] `git init` (ถ้ายังไม่ได้ทำ)
- [ ] `git add .`
- [ ] `git commit -m "Initial commit"`
- [ ] สร้าง GitHub Repository
- [ ] `git remote add origin [URL]`
- [ ] `git push -u origin main`

### 🚀 Deploy บน Vercel
- [ ] สร้าง Vercel Account
- [ ] เชื่อม GitHub Repository
- [ ] ตั้งค่า Environment Variables:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NODE_ENV=production`
- [ ] กด Deploy
- [ ] ทดสอบเว็บไซต์ที่ Vercel URL

### 🧪 ทดสอบหลัง Deploy
- [ ] ทดสอบ Login/Logout
- [ ] ทดสอบทุกหน้าทำงานปกติ
- [ ] ทดสอบ Dark Mode
- [ ] ทดสอบ CRUD operations
- [ ] ตรวจสอบ Database connections
- [ ] ทดสอบบนมือถือ

### 🌐 ตั้งค่า Domain (Optional)
- [ ] ซื้อ Domain name
- [ ] เชื่อม Domain กับ Vercel
- [ ] ตั้งค่า DNS records
- [ ] ทดสอบ SSL certificate

## 📋 Environment Variables ที่จำเป็น

### ใน Vercel Dashboard:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
```

## 🛠️ Commands ที่ใช้

```bash
# เริ่มต้น Git
git init
git add .
git commit -m "Initial commit"

# เชื่อมกับ GitHub
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main

# Update หลัง Deploy
git add .
git commit -m "Update feature"
git push

# Vercel CLI (Optional)
npm install -g vercel
vercel
vercel --prod
```

## 🚨 สิ่งที่ต้องระวัง

### ❌ อย่าทำ:
- อย่า commit ไฟล์ `.env`
- อย่าใส่ secret keys ในโค้ด
- อย่าลืมตั้งค่า Environment Variables
- อย่าใช้ `localhost` ใน production

### ✅ ควรทำ:
- ใช้ Environment Variables
- ตั้งค่า RLS ใน Supabase
- Backup database สม่ำเสมอ
- ทดสอบก่อน deploy ทุกครั้ง

## 📞 ถ้าติดปัญหา

### GitHub Issues:
- Database connection failed
- Vercel deploy error
- Environment variables missing

### Supabase Issues:
- RLS policies not working
- Tables not created
- Auth not working

### Vercel Issues:
- Build failed
- Function timeout
- Domain not working

---

**🎯 เสร็จทุกข้อแล้วใช่มั้ย? ยินดีด้วย! 🎉**