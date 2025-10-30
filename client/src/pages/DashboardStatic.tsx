import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, UserCircle, AlertCircle, FileText, UserCheck, UserX } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
  // Mock data สำหรับการแสดงผล
  const mockStats = {
    totalInfoLogs: 150,
    totalHouses: 45,
    totalMembers: 180,
    activeMembers: 165,
    expiredMembers: 15,
    houseCounts: {
      "0 ที่": 5,
      "1 ที่": 8,
      "2 ที่": 12,
      "3 ที่": 10,
      "4 ที่": 7,
      "5 ที่": 3,
    },
    packageCounts: {
      "แพคเกจพรีเมียม": 45,
      "แพคเกจมาตรฐาน": 32,
      "แพคเกจพื้นฐาน": 28,
      "แพคเกจทดลอง": 18,
      "ไม่ระบุ": 27,
    }
  };

  const statsCards = [
    {
      title: "InfoLog ทั้งหมด",
      value: mockStats.totalInfoLogs,
      icon: FileText,
      description: "รายการข้อมูลลูกค้าทั้งหมด",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "กลุ่มบ้าน",
      value: mockStats.totalHouses,
      icon: Building2,
      description: "จำนวนกลุ่มบ้านที่ลงทะเบียน",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "สมาชิกทั้งหมด",
      value: mockStats.totalMembers,
      icon: Users,
      description: "จำนวนสมาชิกในระบบ",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "สมาชิกใช้งานอยู่",
      value: mockStats.activeMembers,
      icon: UserCheck,
      description: "สมาชิกที่ยังไม่หมดอายุ",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "สมาชิกหมดอายุ",
      value: mockStats.expiredMembers,
      icon: UserX,
      description: "สมาชิกที่หมดอายุแล้ว",
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            ภาพรวมข้อมูลระบบจัดการบ้านและสมาชิก
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statsCards.map((stat) => (
            <Card key={stat.title} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* House Distribution */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">การกระจายตัวของบ้าน</CardTitle>
              <p className="text-sm text-muted-foreground">
                จำนวนบ้านจัดกลุ่มตามจำนวนสมาชิก
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(mockStats.houseCounts).map(([range, count]) => {
                  let badgeBg = "";
                  let badgeText = "";
                  
                  if (range === "0 ที่") {
                    badgeBg = "bg-red-100 dark:bg-red-900/50";
                    badgeText = "text-red-600 dark:text-red-300";
                  } else if (range === "1 ที่" || range === "2 ที่") {
                    badgeBg = "bg-yellow-100 dark:bg-yellow-900/50";
                    badgeText = "text-yellow-700 dark:text-yellow-300";
                  } else if (range === "3 ที่") {
                    badgeBg = "bg-emerald-200 dark:bg-emerald-900/50";
                    badgeText = "text-emerald-700 dark:text-emerald-300";
                  } else {
                    badgeBg = "bg-emerald-300 dark:bg-emerald-800/50";
                    badgeText = "text-emerald-800 dark:text-emerald-200";
                  }

                  return (
                    <div key={range} className="flex items-center justify-between">
                      <span className={`inline-block px-3 py-1 rounded-md text-sm font-medium ${badgeBg} ${badgeText}`}>
                        {range}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-muted rounded-full w-20 overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(count / Math.max(...Object.values(mockStats.houseCounts))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ลูกค้าแยกตามแพคเกจ</CardTitle>
              <p className="text-sm text-muted-foreground">
                จำนวนลูกค้าแยกตามแพคเกจที่ใช้งาน
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(mockStats.packageCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([pkg, count]) => (
                    <div
                      key={pkg}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="font-medium">{pkg}</span>
                      </div>
                      <span className="text-xl font-bold">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Member Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">สถานะสมาชิก</CardTitle>
            <p className="text-sm text-muted-foreground">
              อัตราส่วนสมาชิกใช้งานอยู่และหมดอายุ
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm">สมาชิกใช้งานอยู่</span>
                  </div>
                  <span className="text-sm font-medium">{mockStats.activeMembers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">สมาชิกหมดอายุ</span>
                  </div>
                  <span className="text-sm font-medium">{mockStats.expiredMembers}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(mockStats.activeMembers / mockStats.totalMembers) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {((mockStats.activeMembers / mockStats.totalMembers) * 100).toFixed(1)}% สมาชิกยังใช้งานอยู่
                </p>
              </div>

              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">
                    {((mockStats.activeMembers / mockStats.totalMembers) * 100).toFixed(0)}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    อัตราการใช้งานระบบ
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Notice */}
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-200">
                  โหมดสาธิต (Demo Mode)
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  ข้อมูลที่แสดงเป็นข้อมูลจำลองเพื่อการสาธิต ระบบจริงจะแสดงข้อมูลจากฐานข้อมูล
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}