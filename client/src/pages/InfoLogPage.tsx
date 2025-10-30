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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Plus, ChevronRight, ChevronDown } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";

export default function InfoLogPage() {
  const { data: infoLogs, isLoading } = trpc.infoLog.list.useQuery();
  const { data: houses } = trpc.house.list.useQuery();
  const { data: availableHouses } = trpc.member.listAvailableHouses.useQuery();
  const utils = trpc.useUtils();
  
  const [editingLog, setEditingLog] = useState<number | null>(null);
  const [editingHouseGroup, setEditingHouseGroup] = useState<string>("");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [note, setNote] = useState("");
  const [packageValue, setPackageValue] = useState("");
  const [houseGroup, setHouseGroup] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");

  const packagePrices: Record<string, number> = {
    "1 mount": 89,
    "3 mount": 264,
    "6 mount": 527,
    "9 mount": 781,
    "12 mount": 1015,
  };
  
  // สร้าง map สำหรับ houseId -> houseNumber
  const houseMap = useMemo(() => {
    if (!houses) return new Map();
    return new Map(houses.map((h) => [h.id, h.houseNumber]));
  }, [houses]);

  // Map: houseNumber -> adminEmail (อีเมลกลุ่ม)
  const houseEmailByNumber = useMemo(() => {
    const map = new Map<string, string | null>();
    (houses ?? []).forEach((h: any) => {
      map.set(String(h.houseNumber), h.adminEmail ?? null);
    });
    return map;
  }, [houses]);

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = infoLogs ?? [];
    if (!q) return source;
    return source.filter((log) =>
      [log.customerName, log.email, log.phoneNumber]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(q))
    );
  }, [infoLogs, query]);
  
  const updateMutation = trpc.infoLog.update.useMutation({
    onSuccess: () => {
      utils.infoLog.list.invalidate();
      toast.success("บันทึกข้อมูลสำเร็จ");
      setEditingLog(null);
      setEditingHouseGroup("");
    },
    onError: () => {
      toast.error("บันทึกข้อมูลไม่สำเร็จ");
    },
  });

  const createMutation = trpc.infoLog.create.useMutation({
    onSuccess: () => {
      utils.infoLog.list.invalidate();
      setCreateDialogOpen(false);
      setEmail("");
      setFirstName("");
      setLastName("");
      setNote("");
      setPackageValue("");
      setHouseGroup("");
      setRegistrationDate("");
      setExpirationDate("");
      toast.success("เพิ่มลูกค้าสำเร็จ");
    },
    onError: () => {
      toast.error("เพิ่มลูกค้าไม่สำเร็จ");
    },
  });
  
  const deleteMutation = trpc.infoLog.delete.useMutation({
    onSuccess: () => {
      utils.infoLog.list.invalidate();
      toast.success("ลบข้อมูลสำเร็จ");
    },
    onError: () => {
      toast.error("ลบข้อมูลไม่สำเร็จ");
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("คุณต้องการลบข้อมูลนี้ใช่หรือไม่?")) {
      deleteMutation.mutate({ id });
    }
  };
  
  const handleEditHouseGroup = (logId: number, currentHouseGroup: string | null) => {
    setEditingLog(logId);
    setEditingHouseGroup(currentHouseGroup || "");
  };
  
  const handleSaveHouseGroup = (logId: number) => {
    if (!editingHouseGroup.trim()) {
      toast.error("กรุณากรอกกลุ่มบ้าน");
      return;
    }
    
    updateMutation.mutate({
      id: logId,
      houseGroup: editingHouseGroup,
    });
  };
  
  const handleCancelEdit = () => {
    setEditingLog(null);
    setEditingHouseGroup("");
  };

  const handleCreateCustomer = () => {
    if (!email.trim()) {
      toast.error("กรุณากรอกอีเมล");
      return;
    }
    if (!packageValue) {
      toast.error("กรุณาเลือกแพคเกจ");
      return;
    }
    const customerName = `${firstName.trim()} ${lastName.trim()}`.trim() || undefined;
    const packagePrice = packagePrices[packageValue] || 0;
    createMutation.mutate({
      email: email.trim(),
      customerName,
      package: packageValue,
      packagePrice,
      houseGroup: houseGroup || undefined,
      registrationDate: registrationDate || undefined,
      expirationDate: expirationDate || undefined,
      syncNote: note || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">InfoLog</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">ตารางรับข้อมูลดิบจากแอดมิน/บอท</p>
        </div>

        <Card className="transition-colors">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              รายการข้อมูล InfoLog
              {infoLogs && (
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 transition-colors">({filteredLogs?.length ?? 0} รายการ)</span>
              )}
            </CardTitle>
            <Button
              onClick={() => {
                setEmail("");
                setFirstName("");
                setLastName("");
                setNote("");
                setPackageValue("");
                setHouseGroup("");
                setRegistrationDate("");
                setExpirationDate("");
                setCreateDialogOpen(true);
              }}
              className="bg-emerald-400 hover:bg-emerald-500 text-black"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              เพิ่มลูกค้า
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-500 dark:text-gray-400">กำลังโหลด...</p>
            ) : !infoLogs || infoLogs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">ยังไม่มีข้อมูล</p>
            ) : (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ค้นหาลูกค้า (ชื่อ/อีเมล/เบอร์)"
                    className="max-w-xs"
                  />
                  {query && (
                    <Button size="sm" variant="outline" onClick={() => setQuery("")}>ล้าง</Button>
                  )}
                </div>
                <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:bg-gray-800 dark:border-b-2 dark:border-gray-600">
                      <TableHead className="sticky top-0 z-10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold w-8"></TableHead>
                      <TableHead className="sticky top-0 z-10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold">ชื่อลูกค้า</TableHead>
                      <TableHead className="sticky top-0 z-10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold">Email</TableHead>
                      <TableHead className="sticky top-0 z-10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold">กลุ่มบ้าน</TableHead>
                      <TableHead className="sticky top-0 z-10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold">แพคเกจ</TableHead>
                      <TableHead className="sticky top-0 z-10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold">ราคา</TableHead>
                      <TableHead className="sticky top-0 z-10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold">วันที่สมัคร</TableHead>
                      <TableHead className="sticky top-0 z-10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold">วันหมดอายุ</TableHead>
                      <TableHead className="sticky top-0 z-10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold">ช่องทาง</TableHead>
                      <TableHead className="sticky top-0 z-10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => {
                      const isExpired = log.expirationDate && new Date(log.expirationDate) < new Date();
                      const noGroup = !log.houseGroup || String(log.houseGroup).trim() === "";
                      const isOpen = expanded.has(log.id);
                      const rowBg = isOpen
                        ? "bg-gray-50 dark:bg-gray-800/50"
                        : (noGroup ? "bg-amber-100/80 border-l-4 border-amber-400 dark:bg-amber-900/30 dark:border-amber-500" : "hover:bg-gray-50 dark:hover:bg-gray-800/50");
                      return (
                      <>
                      <TableRow key={log.id} className={`${rowBg} cursor-pointer transition-colors`} onClick={() => {
                        const next = new Set(expanded);
                        if (next.has(log.id)) next.delete(log.id); else next.add(log.id);
                        setExpanded(next);
                      }}>
                        <TableCell className="w-8">
                          <button
                            aria-label={isOpen ? 'Collapse' : 'Expand'}
                            onClick={(e) => { e.stopPropagation(); const next = new Set(expanded); if (next.has(log.id)) next.delete(log.id); else next.add(log.id); setExpanded(next); }}
                          >
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-200">{log.customerName}</TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-200">{log.email}</TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-200">
                          {editingLog === log.id ? (
                            <div className="flex items-center gap-2">
                              <Select
                                value={editingHouseGroup}
                                onValueChange={(value) => setEditingHouseGroup(value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="เลือกบ้าน" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableHouses?.map((house) => (
                                    <SelectItem key={house.id} value={house.houseNumber}>
                                      {house.houseNumber}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="sm" onClick={() => handleSaveHouseGroup(log.id)}>
                                บันทึก
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                ยกเลิก
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{log.houseGroup || "-"}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditHouseGroup(log.id, log.houseGroup ?? null)}
                              >
                                แก้ไข
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-200">{log.package}</TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-200">{log.packagePrice}</TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-200">{log.registrationDate ? new Date(log.registrationDate).toLocaleDateString('th-TH') : '-'}</TableCell>
                        <TableCell className={isExpired ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-900 dark:text-gray-200"}>
                          {log.expirationDate ? new Date(log.expirationDate).toLocaleDateString('th-TH') : '-'}
                          {isExpired && <span className="ml-2 text-xs">(หมดอายุ)</span>}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500">
                            {log.channel}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(log.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow className="bg-gray-50 dark:bg-gray-800/70 border dark:border-gray-600">
                          <TableCell colSpan={10}>
                            <div className="grid grid-cols-2 gap-6 py-3">
                              <div className="space-y-1 text-sm">
                                <div><span className="text-gray-500 dark:text-gray-400">ชื่อที่แสดง:</span> <span className="ml-2 font-medium text-gray-900 dark:text-gray-200">{log.customerName || '-'}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">User ID:</span> <span className="ml-2 font-mono text-gray-900 dark:text-gray-200">{log.lineId || '-'}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">อีเมลกลุ่ม:</span> <span className="ml-2 text-gray-900 dark:text-gray-200">{log.houseGroup ? (houseEmailByNumber.get(String(log.houseGroup)) || '-') : '-'}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">สถานะ:</span> <span className="ml-2 text-gray-900 dark:text-gray-200">{log.syncStatus || '-'}</span></div>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div><span className="text-gray-500 dark:text-gray-400">ช่องทาง:</span> <span className="ml-2 uppercase text-gray-900 dark:text-gray-200">{log.channel || '-'}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">แพ็กเกจ:</span> <span className="ml-2 text-gray-900 dark:text-gray-200">{log.package || '-'}{log.packagePrice ? ` (${log.packagePrice}฿)` : ''}</span></div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      </>
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

      {/* Create Customer Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>สร้างลูกค้า</DialogTitle>
            <p className="text-sm text-gray-500">เพิ่มลูกค้าใหม่เพื่อจัดระเบียน</p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-email" className="text-red-500">อีเมล *</Label>
                <Input
                  id="create-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <Label htmlFor="create-firstname">โครสพิท</Label>
                <Input
                  id="create-firstname"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="ชื่อจริง"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="create-lastname">ชื่อที่แสดง</Label>
              <Input
                id="create-lastname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="นามสกุล หรือชื่อเล่น"
              />
            </div>
            <div>
              <Label htmlFor="create-note">หมายเหตุ</Label>
              <Textarea
                id="create-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="บันทึกช่องมูลเพิ่มเติมสำหรับกลุ่มนี้"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-package" className="text-red-500">แพคเกจ *</Label>
                <Select value={packageValue} onValueChange={setPackageValue}>
                  <SelectTrigger id="create-package">
                    <SelectValue placeholder="เลือกแพคเกจ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 mount">1 mount - 89฿</SelectItem>
                    <SelectItem value="3 mount">3 mount - 264฿</SelectItem>
                    <SelectItem value="6 mount">6 mount - 527฿</SelectItem>
                    <SelectItem value="9 mount">9 mount - 781฿</SelectItem>
                    <SelectItem value="12 mount">12 mount - 1015฿</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="create-group">กลุ่ม</Label>
                <Select value={houseGroup || undefined} onValueChange={setHouseGroup}>
                  <SelectTrigger id="create-group">
                    <SelectValue placeholder="ไม่มี" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableHouses?.map((house) => (
                      <SelectItem key={house.id} value={house.houseNumber}>
                        {house.houseNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-reg-date" className="text-red-500">วันที่จ่ายเงิน *</Label>
                <Input
                  id="create-reg-date"
                  type="date"
                  value={registrationDate}
                  onChange={(e) => setRegistrationDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="create-exp-date" className="text-red-500">วันหมดอายุ *</Label>
                <Input
                  id="create-exp-date"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleCreateCustomer}
              disabled={createMutation.isPending}
              className="bg-emerald-400 hover:bg-emerald-500 text-black"
            >
              สร้าง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
