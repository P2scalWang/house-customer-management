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
import { AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useMemo } from "react";

export default function ExpiredMembersPage() {
  const { data: archivedMembers, isLoading: loadingArchived } = trpc.member.listArchived.useQuery();

  // สมาชิกที่หมดอายุจาก archive table
  const expiredMembers = useMemo(() => {
    if (!archivedMembers) return [];
    // เรียงตามวันที่ archive (ล่าสุดก่อน)
    return [...archivedMembers].sort((a, b) => {
      const dateA = new Date(a.archivedAt).getTime();
      const dateB = new Date(b.archivedAt).getTime();
      return dateB - dateA;
    });
  }, [archivedMembers]);

  const isLoading = loadingArchived;

  // คำนวณจำนวนวันที่หมดอายุไปแล้ว
  const getDaysExpired = (expirationDate: Date | string | null) => {
    if (!expirationDate) return null;
    const now = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = now.getTime() - expDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">สมาชิกที่หมดอายุ</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">รายการสมาชิกที่หมดอายุแล้ว เรียงตามวันหมดอายุล่าสุด</p>
        </div>

        <Card className="transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
              รายการสมาชิกที่หมดอายุ ({expiredMembers.length} คน)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
            ) : expiredMembers.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">ไม่มีสมาชิกที่หมดอายุ</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เลขบ้าน</TableHead>
                      <TableHead>อีเมลสมาชิก</TableHead>
                      <TableHead>วันหมดอายุ</TableHead>
                      <TableHead>หมดอายุมาแล้ว</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>หมายเหตุ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiredMembers.map((member) => {
                      const daysExpired = getDaysExpired(member.expirationDate ?? null);
                      return (
                  <TableRow key={member.id} className="bg-red-50/30 dark:bg-red-950/20 transition-colors">
                          <TableCell className="font-semibold">
                     {member.houseNumber || '-'}
                          </TableCell>
                          <TableCell>{member.memberEmail}</TableCell>
                          <TableCell>
                            {member.expirationDate
                              ? new Date(member.expirationDate).toLocaleDateString("th-TH")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {daysExpired !== null && (
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                {daysExpired} วัน
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 transition-colors">
                              <AlertCircle className="w-3 h-3" />
                              หมดอายุ
                            </span>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{member.note || "-"}</TableCell>
                        </TableRow>
                      );
                    })}
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
