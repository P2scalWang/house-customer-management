import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useMemo } from "react";

export default function ActiveMembersPage() {
  const { data: members, isLoading: loadingMembers } = trpc.member.listActive.useQuery();
  const { data: houses, isLoading: loadingHouses } = trpc.house.list.useQuery();

  // สร้าง map สำหรับ houseId -> houseNumber
  const houseMap = useMemo(() => {
    if (!houses) return new Map();
    return new Map(houses.map((h) => [h.id, h.houseNumber]));
  }, [houses]);

  // สมาชิกที่ใช้งานอยู่ถูกกรองมาจากฝั่ง Server แล้ว
  const activeMembers = useMemo(() => {
    if (!members || !houses) return [];
    // เรียงลำดับตามเลขบ้าน
    return [...members].sort((a, b) => {
      const houseA = houseMap.get(a.houseId) || "";
      const houseB = houseMap.get(b.houseId) || "";
      return houseA.localeCompare(houseB, "th", { numeric: true });
    });
  }, [members, houses, houseMap]);

  const isLoading = loadingMembers || loadingHouses;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">สมาชิกที่ใช้งานอยู่</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">แสดงเฉพาะสมาชิกที่ active และยังไม่หมดอายุ</p>
        </div>

        <Card className="transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
              รายการสมาชิกที่ใช้งานอยู่ ({activeMembers.length} คน)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
            ) : activeMembers.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">ไม่มีสมาชิกที่ใช้งานอยู่</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เลขบ้าน</TableHead>
                      <TableHead>อีเมลสมาชิก</TableHead>
                      <TableHead>วันหมดอายุ</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>หมายเหตุ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeMembers.map((member) => (
                      <TableRow key={member.id} className="bg-green-50/30 dark:bg-green-950/20 transition-colors">
                        <TableCell className="font-semibold">
                          {houseMap.get(member.houseId) || `ID: ${member.houseId}`}
                        </TableCell>
                        <TableCell>{member.memberEmail}</TableCell>
                        <TableCell>
                          {member.expirationDate
                            ? new Date(member.expirationDate).toLocaleDateString("th-TH")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 transition-colors">
                            <CheckCircle className="w-3 h-3" />
                            ใช้งานอยู่
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{member.note || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
