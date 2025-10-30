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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
//
import { Trash2, Plus, Pencil, Power, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { useMemo, useState, type ReactNode } from "react";

export default function HousesPage() {
  const { data: houses, isLoading: loadingHouses } = trpc.house.list.useQuery();
  const { data: members, isLoading: loadingMembers } = trpc.member.list.useQuery();
  const utils = trpc.useUtils();
  const totalHouses = houses?.length ?? 0;
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<any | null>(null);
  
  const [houseNumber, setHouseNumber] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [note, setNote] = useState("");

  const createMutation = trpc.house.create.useMutation({
    onSuccess: () => {
      utils.house.list.invalidate();
      utils.member.list.invalidate();
      setHouseNumber("");
      setAdminEmail("");
      setRegistrationDate("");
      setNote("");
      setCreateDialogOpen(false);
      toast.success("สร้างบ้านสำเร็จ");
    },
    onError: () => {
      toast.error("สร้างบ้านไม่สำเร็จ");
    },
  });

  const updateMutation = trpc.house.update.useMutation({
    onSuccess: () => {
      utils.house.list.invalidate();
      utils.member.list.invalidate();
      setEditDialogOpen(false);
      setEditingHouse(null);
      toast.success("อัปเดตบ้านสำเร็จ");
    },
    onError: () => {
      toast.error("อัปเดตบ้านไม่สำเร็จ");
    },
  });
  
  const deleteMutation = trpc.house.delete.useMutation({
    onSuccess: () => {
      utils.house.list.invalidate();
      utils.member.list.invalidate();
      toast.success("ลบข้อมูลสำเร็จ");
    },
    onError: () => {
      toast.error("ลบข้อมูลไม่สำเร็จ");
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("คุณต้องการลบบ้านนี้ใช่หรือไม่?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleEdit = (house: any) => {
    setEditingHouse(house);
    setHouseNumber(house.houseNumber || "");
    setAdminEmail(house.adminEmail || "");
    setRegistrationDate(house.registrationDate || "");
    setNote(house.note || "");
    setEditDialogOpen(true);
  };

  const handleDisable = (house: any) => {
    updateMutation.mutate({ id: house.id, status: house.status === 'cancelled' ? 'active' : 'cancelled' });
  };

  const handleCreate = () => {
    if (!houseNumber.trim()) {
      toast.error("กรุณากรอกหมายเลขกลุ่ม");
      return;
    }
    createMutation.mutate({
      houseNumber: houseNumber.trim(),
      adminEmail: adminEmail || undefined,
      registrationDate: registrationDate || undefined,
      note: note || undefined,
    });
  };

  const handleUpdate = () => {
    if (!editingHouse) return;
    updateMutation.mutate({
      id: editingHouse.id,
      houseNumber: houseNumber.trim() || undefined,
      adminEmail: adminEmail || undefined,
      registrationDate: registrationDate || undefined,
      note: note || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      expired: "bg-red-100 text-red-800",
      moved: "bg-blue-100 text-blue-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  // Search
  const [query, setQuery] = useState("");
  const [spaceFilter, setSpaceFilter] = useState<string>("all"); // 'all' | '1'..'5'

  // Build map: houseId -> members (max 5)
  const houseMap = useMemo(() => {
    const map = new Map<number, any[]>();
    (members ?? []).forEach((m: any) => {
      const arr = map.get(m.houseId) ?? [];
      arr.push(m);
      map.set(m.houseId, arr);
    });
    // sort each by expiration date asc
    map.forEach((arr) => {
      arr.sort((a, b) => {
        const ta = a.expirationDate ? new Date(a.expirationDate).getTime() : Number.POSITIVE_INFINITY;
        const tb = b.expirationDate ? new Date(b.expirationDate).getTime() : Number.POSITIVE_INFINITY;
        return ta - tb;
      });
    });
    return map;
  }, [members]);

  const filteredHouses = useMemo(() => {
    const list = (houses ?? []).filter((h: any) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        String(h.houseNumber).toLowerCase().includes(q) ||
        String(h.adminEmail ?? '').toLowerCase().includes(q)
      );
    });
    // Filter by remaining spaces (เหลือว่าง N ที่)
    const withMembers = list.map((h: any) => ({
      house: h,
      used: (houseMap.get(h.id) ?? []).length,
    }));
    const filteredBySpace = withMembers.filter(({ house, used }) => {
      if (spaceFilter === 'all') return true;
      const remain = 5 - used;
      return String(remain) === spaceFilter;
    }).map(({ house }) => house);
    // Sort by houseNumber asc (numeric when possible) to keep stable order even after updates
    return filteredBySpace.sort((a: any, b: any) => {
      const an = Number(a.houseNumber);
      const bn = Number(b.houseNumber);
      const aIsNum = !isNaN(an);
      const bIsNum = !isNaN(bn);
      if (aIsNum && bIsNum) return an - bn;
      return String(a.houseNumber).localeCompare(String(b.houseNumber), 'th-TH');
    });
  }, [houses, query, spaceFilter, members]);

  const daysUntil = (date?: string | null) => {
    if (!date) return null;
    const now = new Date();
    const d = new Date(date);
    const diff = Math.floor((d.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / (1000*60*60*24));
    return diff;
  };

  const loading = loadingHouses || loadingMembers;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">กลุ่มบ้าน</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">จัดการกลุ่มลูกค้า</p>
        </div>

        <Card className="transition-colors">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>รายการกลุ่ม ({totalHouses} รายการ)</CardTitle>
            <Button
              onClick={() => {
                setHouseNumber("");
                setAdminEmail("");
                setRegistrationDate("");
                setNote("");
                setCreateDialogOpen(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-500 dark:shadow-lg dark:shadow-green-900/50"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              เพิ่มกลุ่ม
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                  <div className="relative w-full max-w-xs">
                    <Input
                      placeholder="ค้นหากลุ่ม (อีเมล/หมายเลข)..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-9"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setQuery(""); setSpaceFilter("all"); }}>
                    ล้าง
                  </Button>
                  <div>
                    <Label className="sr-only">ตัวกรองจำนวนที่ว่าง</Label>
                    <Select value={spaceFilter} onValueChange={setSpaceFilter}>
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="ทั้งหมด" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        <SelectItem value="1">เหลือว่าง 1 ที่</SelectItem>
                        <SelectItem value="2">เหลือว่าง 2 ที่</SelectItem>
                        <SelectItem value="3">เหลือว่าง 3 ที่</SelectItem>
                        <SelectItem value="4">เหลือว่าง 4 ที่</SelectItem>
                        <SelectItem value="5">เหลือว่าง 5 ที่</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                    <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
                      <Table className="min-w-[1200px] w-full">
                  <TableHeader>
                    <TableRow className="dark:bg-gray-800 dark:border-gray-700">
                      <TableHead className="w-16 text-gray-700 dark:text-gray-300 font-semibold">จำนวนที่ว่าง</TableHead>
                      <TableHead className="w-40 text-gray-700 dark:text-gray-300 font-semibold">อีเมล</TableHead>
                      <TableHead className="w-16 text-gray-700 dark:text-gray-300 font-semibold">หมายเลข</TableHead>
                      <TableHead className="w-20 text-gray-700 dark:text-gray-300 font-semibold">วันที่สมัคร</TableHead>
                      <TableHead className="w-36 text-gray-700 dark:text-gray-300 font-semibold">ลูกค้า 1</TableHead>
                      <TableHead className="w-36 text-gray-700 dark:text-gray-300 font-semibold">ลูกค้า 2</TableHead>
                      <TableHead className="w-36 text-gray-700 dark:text-gray-300 font-semibold">ลูกค้า 3</TableHead>
                      <TableHead className="w-36 text-gray-700 dark:text-gray-300 font-semibold">ลูกค้า 4</TableHead>
                      <TableHead className="w-36 text-gray-700 dark:text-gray-300 font-semibold">ลูกค้า 5</TableHead>
                      <TableHead className="w-32 text-gray-700 dark:text-gray-300 font-semibold">หมายเหตุ</TableHead>
                      <TableHead className="text-right w-20 text-gray-700 dark:text-gray-300 font-semibold">การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!filteredHouses || filteredHouses.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={11} className="py-10 text-center text-gray-500 dark:text-gray-400">ไม่พบข้อมูลกลุ่ม</TableCell>
                      </TableRow>
                    )}
                    {filteredHouses.map((house: any) => {
                      const slots = houseMap.get(house.id) ?? [];
                      const used = slots.length;
                      const remain = Math.max(0, 5 - used);
                      const capBadge = (
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            remain === 0
                              ? 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40'
                              : remain === 5
                              ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/40'
                              : remain >= 3
                              ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/40'
                              : 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/40'
                          }`}
                        >
                          {remain}/5
                        </span>
                      );
                      const renderCell = (slot: any | undefined) => {
                        if (!slot) {
                          return (
                            <div className="rounded-md bg-green-100 text-gray-400 border border-green-200 dark:bg-green-500/10 dark:text-gray-500 dark:border-green-500/20 px-2 py-2 text-center h-16 flex items-center justify-center">
                              -
                            </div>
                          );
                        }
                        const d = daysUntil(slot.expirationDate ?? null);
                        let badge: ReactNode = null;
                        let cellColor = '';
                        if (d !== null) {
                          if (d < 0) {
                            badge = (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white dark:bg-red-600 dark:text-white">
                                หมดอายุแล้ว
                              </span>
                            );
                            cellColor = 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30';
                          } else if (d === 0) {
                            badge = (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white dark:bg-red-600 dark:text-white">
                                หมดอายุวันนี้
                              </span>
                            );
                            cellColor = 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30';
                          } else if (d === 1) {
                            badge = (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500 text-white dark:bg-orange-600 dark:text-white">
                                จะหมดอายุใน 1 วัน
                              </span>
                            );
                            cellColor = 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30';
                          }
                        }
                        return (
                          <div className={`min-w-0 h-16 flex flex-col justify-center rounded-md border px-2 py-1 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 ${cellColor}`}>
                            <div className="text-xs leading-tight text-gray-900 dark:text-gray-200 break-all overflow-hidden" style={{ maxHeight: '2.5rem' }} title={slot.memberEmail}>
                              {slot.memberEmail}
                            </div>
                            <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              วันหมดอายุ: {slot.expirationDate ? new Date(slot.expirationDate).toLocaleDateString('th-TH') : '-'}
                            </div>
                            {badge && (
                              <div className="mt-1">
                                {badge}
                              </div>
                            )}
                          </div>
                        );
                      };
                      const dimmed = house.status === 'cancelled';
                      return (
                      <TableRow key={house.id} className={`transition-colors ${dimmed ? 'bg-gray-50 text-gray-500 dark:bg-gray-900/50 dark:text-gray-600' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                        <TableCell className="whitespace-nowrap align-top py-2">{capBadge}</TableCell>
                        <TableCell className="whitespace-nowrap align-top py-2 text-sm text-gray-700 dark:text-gray-300">{house.adminEmail || "-"}</TableCell>
                        <TableCell className="font-semibold whitespace-nowrap align-top py-2 text-gray-900 dark:text-gray-200">{house.houseNumber}</TableCell>
                        <TableCell className="whitespace-nowrap align-top py-2 text-gray-900 dark:text-gray-200">
                          {house.registrationDate ? new Date(house.registrationDate).toLocaleDateString('th-TH') : '-'}
                        </TableCell>
                        <TableCell className="py-2">{renderCell(slots[0])}</TableCell>
                        <TableCell className="py-2">{renderCell(slots[1])}</TableCell>
                        <TableCell className="py-2">{renderCell(slots[2])}</TableCell>
                        <TableCell className="py-2">{renderCell(slots[3])}</TableCell>
                        <TableCell className="py-2">{renderCell(slots[4])}</TableCell>
                        <TableCell className="w-32 max-w-[8rem] align-top py-2 truncate text-gray-900 dark:text-gray-200" title={house.note || undefined}>{house.note || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDisable(house)}
                              title={house.status === 'cancelled' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                            >
                              <Power className={`w-4 h-4 ${house.status === 'cancelled' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(house)}
                            >
                              <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(house.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างกลุ่ม</DialogTitle>
            <p className="text-sm text-gray-500">เพิ่มกลุ่มใหม่เพื่อจัดระเบียนลูกค้า</p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="create-email" className="text-red-500">อีเมล *</Label>
              <Input
                id="create-email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="group@example.com"
              />
            </div>
            <div>
              <Label htmlFor="create-house" className="text-red-500">หมายเลขกลุ่ม *</Label>
              <Input
                id="create-house"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                placeholder="ORD-001"
              />
            </div>
            <div>
              <Label htmlFor="create-date" className="text-red-500">วันที่จ่ายเงิน *</Label>
              <Input
                id="create-date"
                type="date"
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="create-note">หมายเหตุ</Label>
              <Input
                id="create-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เพิ่มหมายเหตุสำหรับกลุ่มนี้"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-emerald-400 hover:bg-emerald-500 text-black"
            >
              สร้าง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขกลุ่ม</DialogTitle>
            <p className="text-sm text-gray-500">
              อัปเดตข้อมูลกลุ่ม สามารถแก้ไขได้เว้นอีเมลและหมายเลขกลุ่มตั้งชื่อเก่านั้น
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-email" className="text-red-500">อีเมล *</Label>
              <Input
                id="edit-email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="group@example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-house" className="text-red-500">หมายเลขกลุ่ม *</Label>
              <Input
                id="edit-house"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                placeholder="ORD-001"
              />
            </div>
            <div>
              <Label htmlFor="edit-note">หมายเหตุ</Label>
              <Input
                id="edit-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เพิ่มหมายเหตุสำหรับกลุ่มนี้"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="bg-emerald-400 hover:bg-emerald-500 text-black"
            >
              อัปเดต
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
