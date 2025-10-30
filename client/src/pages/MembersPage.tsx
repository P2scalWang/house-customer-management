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
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle, XCircle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function MembersPage() {
  const { data: members, isLoading: loadingMembers } = trpc.member.list.useQuery();
  const { data: houses, isLoading: loadingHouses } = trpc.house.list.useQuery();
  const { data: availableHouses } = trpc.member.listAvailableHouses.useQuery();
  const utils = trpc.useUtils();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    houseId: 0,
    memberEmail: "",
    expirationDate: "",
    isActive: true,
    note: "",
  });
  const [filterHouseId, setFilterHouseId] = useState<string>("all");

  const deleteMutation = trpc.member.delete.useMutation({
    onSuccess: () => {
      utils.member.list.invalidate();
      toast.success("ลบข้อมูลสำเร็จ");
    },
    onError: () => {
      toast.error("ลบข้อมูลไม่สำเร็จ");
    },
  });

  const updateMutation = trpc.member.update.useMutation({
    onSuccess: () => {
      utils.member.list.invalidate();
  toast.success("อัปเดตข้อมูลสำเร็จ");
  setIsDialogOpen(false);
  setEditingMember(null);
    },
    onError: () => {
  toast.error("อัปเดตข้อมูลไม่สำเร็จ");
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("คุณต้องการลบสมาชิกนี้ใช่หรือไม่?")) {
      deleteMutation.mutate({ id });
    }
  };

  // สร้าง map สำหรับ houseId -> houseNumber
  const houseMap = useMemo(() => {
    if (!houses) return new Map();
    return new Map(houses.map((h) => [h.id, h.houseNumber]));
  }, [houses]);

  const handleOpenDialog = (member: any) => {
    setEditingMember(member);
    setFormData({
      houseId: member.houseId,
      memberEmail: member.memberEmail,
      expirationDate: member.expirationDate
        ? new Date(member.expirationDate).toISOString().split("T")[0]
        : "",
      isActive: member.isActive ?? true,
      note: member.note || "",
    });
    setIsDialogOpen(true);
  };

  const handleSaveChanges = () => {
    if (!editingMember) return;
    
    if (!formData.houseId) {
      toast.error("กรุณาเลือกเลขบ้าน");
      return;
    }
    if (!formData.memberEmail) {
      toast.error("กรุณากรอกอีเมลสมาชิก");
      return;
    }

    updateMutation.mutate({
      id: editingMember.id,
      houseId: formData.houseId,
      memberEmail: formData.memberEmail,
      expirationDate: formData.expirationDate || undefined,
      isActive: formData.isActive,
      note: formData.note || undefined,
    });
  };

  // กรองสมาชิกตามบ้านที่เลือก
  const filteredMembers = useMemo(() => {
    if (!members) return [];
    if (filterHouseId === "all") return members;
    return members.filter((m) => m.houseId === Number(filterHouseId));
  }, [members, filterHouseId]);

  // นับจำนวนสมาชิกในแต่ละบ้าน
  const memberCountByHouse = useMemo(() => {
    if (!members) return new Map();
    const countMap = new Map<number, number>();
    members.forEach((member) => {
      const count = countMap.get(member.houseId) || 0;
      countMap.set(member.houseId, count + 1);
    });
    return countMap;
  }, [members]);

  // รายการบ้านสำหรับแก้ไข พร้อมข้อมูลจำนวนสมาชิก
  const housesForEdit = useMemo(() => {
    if (!houses) return [];
    
    // แสดงบ้านทั้งหมด พร้อมข้อมูลว่าง/เต็ม
    return houses
      .map((house) => {
        const memberCount = memberCountByHouse.get(house.id) || 0;
        const remaining = Math.max(0, 5 - memberCount);
        const isFull = memberCount >= 5;
        
        return {
          ...house,
          memberCount,
          remaining,
          isFull,
        };
      })
      .sort((a, b) => {
        // เรียงตามสถานะ: ว่าง -> เต็ม, แล้วเรียงตามเลขบ้าน
        if (a.isFull !== b.isFull) return a.isFull ? 1 : -1;
        return a.houseNumber.localeCompare(b.houseNumber, 'th', { numeric: true });
      });
  }, [houses, memberCountByHouse]);

  const isLoading = loadingMembers || loadingHouses;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">สมาชิกบ้าน</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">รายการสมาชิกในแต่ละบ้าน</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>รายการสมาชิก</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">กรองตามบ้าน:</span>
                <Select value={filterHouseId} onValueChange={setFilterHouseId}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="เลือกบ้าน" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {houses?.map((house) => (
                      <SelectItem key={house.id} value={house.id.toString()}>
                        {house.houseNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
            ) : !filteredMembers || filteredMembers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">ไม่พบข้อมูลสมาชิก</p>
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
                      <TableHead className="text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <span className="font-semibold">
                            {houseMap.get(member.houseId) || `ID: ${member.houseId}`}
                          </span>
                        </TableCell>
                        <TableCell>{member.memberEmail}</TableCell>
                        <TableCell>
                          {member.expirationDate
                            ? new Date(member.expirationDate).toLocaleDateString("th-TH")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {member.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3" />
                              ใช้งานอยู่
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <XCircle className="w-3 h-3" />
                              ไม่ใช้งาน
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{member.note || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(member)}
                            >
                              แก้ไขข้อมูล
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(member.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>แก้ไขข้อมูลสมาชิก</DialogTitle>
              <DialogDescription>
                แก้ไขข้อมูลสมาชิกบ้าน
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* เลขบ้าน */}
              <div className="grid gap-2">
                <Label htmlFor="houseId">เลขบ้าน</Label>
                <Select
                  value={formData.houseId.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, houseId: Number(value) })
                  }
                >
                  <SelectTrigger id="houseId" className="w-full">
                    <SelectValue placeholder="เลือกบ้าน">
                      {formData.houseId > 0 && (() => {
                        const selectedHouse = housesForEdit?.find(h => h.id === formData.houseId);
                        if (!selectedHouse) return `บ้าน ID: ${formData.houseId}`;
                        return (
                          <span>
                            {selectedHouse.houseNumber} - {selectedHouse.adminEmail || '-'} ({selectedHouse.memberCount}/5) {selectedHouse.isFull ? '- เต็ม' : `- เหลือว่าง ${selectedHouse.remaining} ที่`}
                          </span>
                        );
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {housesForEdit?.map((house) => (
                      <SelectItem
                        key={house.id}
                        value={house.id.toString()}
                        className="py-2"
                      >
                        <span>
                          {house.houseNumber} - {house.adminEmail || '-'} ({house.memberCount}/5) {house.isFull ? '- เต็ม' : `- เหลือว่าง ${house.remaining} ที่`}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* อีเมลสมาชิก */}
              <div className="grid gap-2">
                <Label htmlFor="memberEmail">อีเมลสมาชิก</Label>
                <Input
                  id="memberEmail"
                  type="email"
                  value={formData.memberEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, memberEmail: e.target.value })
                  }
                  placeholder="example@email.com"
                />
              </div>

              {/* วันหมดอายุ */}
              <div className="grid gap-2">
                <Label htmlFor="expirationDate">วันหมดอายุ</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expirationDate: e.target.value })
                  }
                />
              </div>

              {/* สถานะ */}
              <div className="grid gap-2">
                <Label htmlFor="isActive">สถานะ</Label>
                <Select
                  value={formData.isActive ? "true" : "false"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, isActive: value === "true" })
                  }
                >
                  <SelectTrigger id="isActive">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">ใช้งานอยู่</SelectItem>
                    <SelectItem value="false">ไม่ใช้งาน</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* หมายเหตุ */}
              <div className="grid gap-2">
                <Label htmlFor="note">หมายเหตุ</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  placeholder="หมายเหตุ..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={updateMutation.isPending}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
