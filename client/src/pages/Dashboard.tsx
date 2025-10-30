import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, UserCircle, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useMemo } from "react";

export default function Dashboard() {
  const { data: allInfoLogs, isLoading: loadingInfoLogs } = trpc.infoLog.list.useQuery();
  const { data: houses, isLoading: loadingHouses } = trpc.house.list.useQuery();
  const { data: members, isLoading: loadingMembers } = trpc.member.list.useQuery();

  // นับจำนวนกลุ่มบ้านตามจำนวนสมาชิก (ดึงจาก house_list และนับจาก house_members)
  const houseCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "0 ที่": 0,
      "1 ที่": 0,
      "2 ที่": 0,
      "3 ที่": 0,
      "4 ที่": 0,
      "5 ที่": 0,
    };
    
    if (houses && members) {
      // วนลูปทุกบ้านใน house_list
      houses.forEach((house) => {
        // นับสมาชิกในบ้านนี้จาก house_members โดยเทียบ house_id
        const memberCount = members.filter((m: any) => m.houseId === house.id).length;
        const key = `${memberCount} ที่`;
        if (counts[key] !== undefined) {
          counts[key]++;
        }
      });
    }
    
    return counts;
  }, [houses, members]);

  // นับจำนวนลูกค้าตามแพคเกจ
  const packageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    if (allInfoLogs) {
      allInfoLogs.forEach((log) => {
        const pkg = log.package || "ไม่ระบุ";
        counts[pkg] = (counts[pkg] || 0) + 1;
      });
    }
    
    return counts;
  }, [allInfoLogs]);

  const stats = [
    {
      title: "ข้อมูล InfoLog",
      value: allInfoLogs?.length || 0,
      icon: UserCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "จำนวนบ้าน",
      value: houses?.length || 0,
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "สมาชิกทั้งหมด",
      value: members?.length || 0,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "บ้านหมดอายุ",
      value: houses?.filter((h) => h.status === "expired").length || 0,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">ภาพรวมระบบจัดการลูกค้าและกลุ่มบ้าน</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2 transition-colors">
                      {loadingInfoLogs || loadingHouses || loadingMembers ? "..." : stat.value}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} dark:bg-opacity-20 p-3 rounded-lg transition-colors`}>
                    <stat.icon className={`w-6 h-6 ${stat.color} dark:opacity-90`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* กลุ่มบ้านที่ว่าง */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="transition-colors">
            <CardHeader>
              <CardTitle>กลุ่มบ้านที่ว่าง</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">จำนวนกลุ่มแยกตามที่ว่าง</p>
            </CardHeader>
            <CardContent>
              {loadingHouses || loadingMembers ? (
                <p className="text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
              ) : (
                <div>
                  {/* Header Row */}
                  <div className="flex items-center justify-between py-3 px-2 border-b-2 border-gray-200 dark:border-gray-700 transition-colors">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors">จำนวนที่ว่าง</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors">จำนวนบ้าน</span>
                  </div>
                  
                  {/* Data Rows */}
                  <div className="divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                  {Object.entries(houseCounts).map(([key, count]) => {
                    const slot = key;
                    let badgeBg = "";
                    let badgeText = "";
                    
                    if (slot === "0 ที่") {
                      badgeBg = "bg-red-100 dark:bg-red-900/50";
                      badgeText = "text-red-600 dark:text-red-300";
                    } else if (slot === "1 ที่" || slot === "2 ที่") {
                      badgeBg = "bg-yellow-100 dark:bg-yellow-900/50";
                      badgeText = "text-yellow-700 dark:text-yellow-300";
                    } else if (slot === "3 ที่") {
                      badgeBg = "bg-emerald-200 dark:bg-emerald-900/50";
                      badgeText = "text-emerald-700 dark:text-emerald-300";
                    } else {
                      badgeBg = "bg-emerald-300 dark:bg-emerald-800/50";
                      badgeText = "text-emerald-800 dark:text-emerald-200";
                    }
                    
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between py-4 px-2"
                      >
                        <span className={`inline-block px-3 py-1 rounded-md text-sm font-medium ${badgeBg} ${badgeText} transition-colors`}>
                          {key}
                        </span>
                        <span className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors">{count}</span>
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="transition-colors">
            <CardHeader>
              <CardTitle>ลูกค้าแยกตามแพคเกจ</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">จำนวนลูกค้าแยกตามแพคเกจ</p>
            </CardHeader>
            <CardContent>
              {loadingInfoLogs ? (
                <p className="text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(packageCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([pkg, count]) => (
                      <div
                        key={pkg}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                          <p className="font-medium text-gray-900 dark:text-gray-100 transition-colors">{pkg}</p>
                        </div>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors">{count}</p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
