import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Building2, Users, FileText, UserCheck, UserX } from "lucide-react";
import { useEffect } from "react";

export default function Welcome() {
  // Auto redirect to dashboard after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const features = [
    { icon: LayoutDashboard, label: "Dashboard", desc: "ภาพรวมและสถิติ" },
    { icon: FileText, label: "InfoLog", desc: "จัดการข้อมูลลูกค้า" },
    { icon: Building2, label: "รายชื่อรวม", desc: "จัดการบ้านและกลุ่ม" },
    { icon: Users, label: "สมาชิกบ้าน", desc: "จัดการสมาชิก" },
    { icon: UserCheck, label: "สมาชิกใช้งานอยู่", desc: "รายการสมาชิกปัจจุบัน" },
    { icon: UserX, label: "สมาชิกหมดอายุ", desc: "รายการสมาชิกหมดอายุ" },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            House Management System
          </CardTitle>
          <p className="text-lg text-muted-foreground">
            ระบบจัดการข้อมูลบ้านและสมาชิก
          </p>
          <div className="mx-auto w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
        </CardHeader>
        
        <CardContent className="space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              กำลังเข้าสู่ระบบ...
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div 
                key={feature.label}
                className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm">{feature.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>ระบบจะพาคุณเข้าสู่ Dashboard ในอีกสักครู่...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}