-- ===================================================================
-- 📧 SALES EMAILS TABLE - เตรียมพร้อมสำหรับหน้าอีเมลขาย
-- ===================================================================
-- รันไฟล์นี้เพิ่มเติมหลังจาก setup-complete-database.sql แล้ว
-- ===================================================================

-- สร้างตาราง Sales Emails (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS public.sales_emails (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT '24553xxto' CHECK (status IN ('24553xxto', 'meen1122', 'meen332211')),
    house_group TEXT, -- เลขบ้านที่เชื่อมโยง
    customer_name TEXT,
    note TEXT,
    last_contact DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- เพิ่ม Index สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_sales_emails_email ON public.sales_emails(email);
CREATE INDEX IF NOT EXISTS idx_sales_emails_status ON public.sales_emails(status);
CREATE INDEX IF NOT EXISTS idx_sales_emails_house_group ON public.sales_emails(house_group);

-- เพิ่ม Trigger สำหรับ updated_at
CREATE TRIGGER update_sales_emails_updated_at 
    BEFORE UPDATE ON public.sales_emails 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ตั้งค่า Row Level Security
ALTER TABLE public.sales_emails ENABLE ROW LEVEL SECURITY;

-- Policy สำหรับ authenticated users
CREATE POLICY "Allow authenticated access" ON public.sales_emails 
    FOR ALL USING (auth.role() = 'authenticated');

-- Policy สำหรับ service role
CREATE POLICY "Service role access" ON public.sales_emails 
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ===================================================================
-- 📊 ใส่ข้อมูลตัวอย่างตามภาพ
-- ===================================================================

INSERT INTO public.sales_emails (email, status, house_group, customer_name, note) VALUES
-- Status: 24553xxto
('goaweui@gmail.com', '24553xxto', '', '', ''),
('nzioium@gmail.com', '24553xxto', '', '', ''),
('Peopleeee79@gmail.com', '24553xxto', '', '', ''),
('czserei@gmail.com', '24553xxto', '0310', '', ''),
('vjsvccujsc@gmail.com', '24553xxto', '0309', '', ''),

-- Status: meen1122
('meentgdkdd@gmail.com', 'meen1122', '0309', '', ''),
('bonarakmeen@gmail.com', 'meen1122', '0308', '', ''),
('cronubmeen516@gmail.com', 'meen1122', '0307', '', ''),
('mantithemeen06@gmail.com', 'meen1122', '0305', '', 'mantithemeen06@gmail.com BR'),
('toatlemeen@gmail.com', 'meen1122', '0304', '', ''),
('whirlacudameen7@gmail.com', 'meen1122', '0303', '', ''),

-- Status: meen332211
('pwinpwin5109@gmail.com', 'meen332211', '0302', '', ''),
('flamairymeen5@gmail.com', 'meen332211', '0300', '', ''),
('senqtaoq@gmail.com', 'meen332211', '0299', '', 'pwin0931866674@gmail.com C markna ✅✅'),

-- เพิ่มข้อมูลตัวอย่างเพิ่มเติม
('test1@example.com', '24553xxto', '0301', 'ทดสอบ 1', 'ลูกค้าใหม่'),
('test2@example.com', 'meen1122', '0302', 'ทดสอบ 2', 'ติดต่อแล้ว'),
('test3@example.com', 'meen332211', '0303', 'ทดสอบ 3', 'ยกเลิกแล้ว')

ON CONFLICT (email) DO NOTHING;

-- ===================================================================
-- 📋 เพิ่มข้อมูลบ้านเพื่อรองรับอีเมลขาย
-- ===================================================================

INSERT INTO public.house_list (house_number, admin_email, registration_date, status) VALUES
('021', 'admin21@example.com', '2025-01-21', 'active'),
('022', 'admin22@example.com', '2025-01-22', 'active'),
('023', 'admin23@example.com', '2025-01-23', 'active'),
('024', 'admin24@example.com', '2025-01-24', 'active'),
('025', 'admin25@example.com', '2025-01-25', 'active'),
('026', 'admin26@example.com', '2025-01-26', 'active'),
('027', 'admin27@example.com', '2025-01-27', 'active'),
('028', 'admin28@example.com', '2025-01-28', 'active'),
('029', 'admin29@example.com', '2025-01-29', 'active'),
('030', 'admin30@example.com', '2025-01-30', 'active'),
('031', 'admin31@example.com', '2025-01-31', 'active'),
('032', 'admin32@example.com', '2025-02-01', 'active'),
('033', 'admin33@example.com', '2025-02-02', 'active'),
('034', 'admin34@example.com', '2025-02-03', 'active'),
('035', 'admin35@example.com', '2025-02-04', 'active'),
('036', 'admin36@example.com', '2025-02-05', 'active'),
('037', 'admin37@example.com', '2025-02-06', 'active'),
('038', 'admin38@example.com', '2025-02-07', 'active'),
('039', 'admin39@example.com', '2025-02-08', 'active'),
('040', 'admin40@example.com', '2025-02-09', 'active')
ON CONFLICT (house_number) DO NOTHING;

-- ===================================================================
-- 🎯 Query ตัวอย่างสำหรับตรวจสอบข้อมูล
-- ===================================================================

-- ดูข้อมูล Sales Emails ทั้งหมด
SELECT 
    email,
    status,
    house_group,
    customer_name,
    note,
    created_at
FROM public.sales_emails 
ORDER BY status, email;

-- นับจำนวนตาม Status
SELECT 
    status,
    COUNT(*) as count
FROM public.sales_emails 
GROUP BY status
ORDER BY count DESC;

-- ดูอีเมลที่มี house_group
SELECT 
    se.email,
    se.status,
    se.house_group,
    hl.admin_email,
    hl.status as house_status
FROM public.sales_emails se
LEFT JOIN public.house_list hl ON se.house_group = hl.house_number
WHERE se.house_group IS NOT NULL AND se.house_group != ''
ORDER BY se.house_group;

-- ===================================================================
-- ✅ เสร็จสิ้น! Sales Emails พร้อมใช้งาน
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '📧 Sales Emails table setup completed!';
    RAISE NOTICE '📊 Sample data inserted successfully';
    RAISE NOTICE '🔒 Security policies configured';
    RAISE NOTICE '✅ Ready for Sales Emails page implementation!';
END $$;