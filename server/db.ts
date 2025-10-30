import { z } from "zod";
import { supabase } from "./supabase";
import { HouseMember, getAllHouseMembers, getActiveHouseMembers, getExpiredHouseMembers } from "./supabase-data";

// --- Type Definitions (Simplified for Supabase Migration) ---
// Since we are moving away from Drizzle, we only need the types used in routers.ts

// The original project used Drizzle types, which we now replace with placeholders
// or the actual Supabase-derived types.

// Type definitions matching the Supabase schema

export async function getAllMembers(): Promise<HouseMember[]> {
  // This function is used by member.list, house.listWithMemberCount, member.listAvailableHouses
  return getAllHouseMembers();
}

export async function getActiveMembers(): Promise<HouseMember[]> {
  // This function is used by a dashboard component (likely ActiveMembersPage.tsx)
  return getActiveHouseMembers();
}

export async function getExpiredMembers(): Promise<HouseMember[]> {
  // This function is used by a dashboard component (likely ExpiredMembersPage.tsx)
  return getExpiredHouseMembers();
}

// Type for archived members
export type ArchivedMember = {
  id: number;
  originalMemberId: number | null;
  houseId: number | null;
  houseNumber: string | null;
  memberEmail: string;
  expirationDate: string | null;
  registrationDate: string | null;
  note: string | null;
  lineId: string | null;
  archivedAt: string;
  archivedReason: string | null;
};

export async function getArchivedMembers(): Promise<ArchivedMember[]> {
  // Get all archived members from expired_members_archive table
  const { data, error } = await supabase
    .from('expired_members_archive')
    .select('*')
    .order('archived_at', { ascending: false });
  
  if (error) {
    console.error("Error fetching archived members:", error);
    throw new Error("Failed to fetch archived members from Supabase.");
  }
  
  return (data ?? []).map((row: any) => ({
    id: row.id,
    originalMemberId: row.original_member_id,
    houseId: row.house_id,
    houseNumber: row.house_number,
    memberEmail: row.member_email,
    expirationDate: row.expiration_date,
    registrationDate: row.registration_date,
    note: row.note,
    lineId: row.line_id,
    archivedAt: row.archived_at,
    archivedReason: row.archived_reason,
  }));
}

// NOTE: The original project had many more functions (getMemberById, createMember, updateMember, etc.)
// and tables (InfoLog, HouseList). Since the user only provided Supabase credentials
// and a screenshot of the 'house_members' table, we will implement the core read
// operations for 'house_members' to get the dashboard working.
// A full migration would require implementing all CRUD operations for all tables.

// --- Mock/Placeholder for InfoLog and HouseList (Assuming they are not critical for the main dashboard view) ---

// Type definitions for InfoLog
export type InfoLog = {
  id: number;
  lineId?: string | null;
  phoneNumber?: string | null;
  registrationDate?: string | null;
  expirationDate?: string | null;
  package?: string | null;
  packagePrice?: number | null;
  email?: string | null;
  houseGroup?: string | null;
  customerName?: string | null;
  channel?: 'line' | 'facebook' | 'walk-in' | 'other' | '' | null;
  cancelledOrMoved?: 'cancelled' | 'moved' | '' | null;
  syncStatus?: 'ok' | 'error' | 'pending' | null;
  syncNote?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

// Type definitions for House
export type House = {
  id: number;
  houseNumber: string;
  adminEmail?: string | null;
  registrationDate?: string | null;
  status: 'active' | 'expired' | 'moved' | 'cancelled';
  note?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export async function getAllInfoLogs(): Promise<InfoLog[]> {
  const { data, error } = await supabase.from('info_log').select('*');
  if (error) {
    console.error("Error fetching info_log:", error);
    throw new Error("Failed to fetch info_log from Supabase.");
  }
  // Map snake_case to camelCase
  const items: InfoLog[] = (data ?? []).map((item: any) => ({
    id: item.id,
    lineId: item.line_id,
    phoneNumber: item.phone_number,
    registrationDate: item.registration_date,
    expirationDate: item.expiration_date,
    package: item.package,
    packagePrice: item.package_price,
    email: item.email,
    houseGroup: item.house_group,
    customerName: item.customer_name,
    channel: item.channel,
    cancelledOrMoved: item.cancelled_or_moved,
    syncStatus: item.sync_status,
    syncNote: item.sync_note,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));

  // Sort with priority:
  // 1) No house_group (null/empty) first
  // 2) Newest first by updatedAt, then createdAt
  items.sort((a, b) => {
    const aNoGroup = !a.houseGroup || String(a.houseGroup).trim() === '';
    const bNoGroup = !b.houseGroup || String(b.houseGroup).trim() === '';
    if (aNoGroup !== bNoGroup) return aNoGroup ? -1 : 1;

    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime()
      : a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime()
      : b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime; // desc
  });

  return items;
}

export async function getAllHouses(): Promise<House[]> {
  const { data, error } = await supabase.from('house_list').select('*');
  if (error) {
    console.error("Error fetching house_list:", error);
    throw new Error("Failed to fetch house_list from Supabase.");
  }
  // Map snake_case to camelCase
  return (data ?? []).map((item: any) => ({
    id: item.id,
    houseNumber: item.house_number,
    adminEmail: item.admin_email,
    registrationDate: item.registration_date,
    status: item.status,
    note: item.note,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

// --- Placeholder CRUD functions (to prevent compile errors in routers.ts) ---

export async function getInfoLogById(id: number): Promise<InfoLog | null> {
  const { data, error } = await supabase.from('info_log').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    lineId: data.line_id,
    phoneNumber: data.phone_number,
    registrationDate: data.registration_date,
    expirationDate: data.expiration_date,
    package: data.package,
    packagePrice: data.package_price,
    email: data.email,
    houseGroup: data.house_group,
    customerName: data.customer_name,
    channel: data.channel,
    cancelledOrMoved: data.cancelled_or_moved,
    syncStatus: data.sync_status,
    syncNote: data.sync_note,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getLatestInfoLogByEmail(email: string): Promise<InfoLog | null> {
  // Fetch latest info_log for an email by updated_at desc, then created_at desc, then id desc
  const { data, error } = await supabase
    .from('info_log')
    .select('*')
    .eq('email', email)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false })
    .limit(1);
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return {
    id: row.id,
    lineId: row.line_id,
    phoneNumber: row.phone_number,
    registrationDate: row.registration_date,
    expirationDate: row.expiration_date,
    package: row.package,
    packagePrice: row.package_price,
    email: row.email,
    houseGroup: row.house_group,
    customerName: row.customer_name,
    channel: row.channel,
    cancelledOrMoved: row.cancelled_or_moved,
    syncStatus: row.sync_status,
    syncNote: row.sync_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Sync membership by picking the latest info_log for the given email
export async function syncMembershipByEmail(email: string): Promise<void> {
  const latest = await getLatestInfoLogByEmail(email);
  if (!latest) return;
  if (!latest.houseGroup) return; // require admin-provided house group
  await createMemberFromInfoLog(latest);
}

export async function createInfoLog(data: Partial<InfoLog>): Promise<InfoLog> {
  const payload: any = {
    line_id: data.lineId ?? null,
    phone_number: data.phoneNumber ?? null,
    registration_date: data.registrationDate ?? null,
    expiration_date: data.expirationDate ?? null,
    package: data.package ?? null,
    package_price: data.packagePrice ?? null,
    email: data.email ?? null,
    house_group: data.houseGroup ?? null,
    customer_name: data.customerName ?? null,
    channel: data.channel ?? null,
    cancelled_or_moved: data.cancelledOrMoved ?? null,
    sync_status: data.syncStatus ?? 'pending',
    sync_note: data.syncNote ?? null,
  };
  const { data: inserted, error } = await supabase.from('info_log').insert(payload).select('*').single();
  if (error) throw error;
  return (await getInfoLogById(inserted.id)) as InfoLog;
}

export async function updateInfoLog(id: number, data: Partial<InfoLog>): Promise<void> {
  const payload: any = {};
  if (data.lineId !== undefined) payload.line_id = data.lineId;
  if (data.phoneNumber !== undefined) payload.phone_number = data.phoneNumber;
  if (data.registrationDate !== undefined) payload.registration_date = data.registrationDate;
  if (data.expirationDate !== undefined) payload.expiration_date = data.expirationDate;
  if (data.package !== undefined) payload.package = data.package;
  if (data.packagePrice !== undefined) payload.package_price = data.packagePrice;
  if (data.email !== undefined) payload.email = data.email;
  if (data.houseGroup !== undefined) payload.house_group = data.houseGroup;
  if (data.customerName !== undefined) payload.customer_name = data.customerName;
  if (data.channel !== undefined) payload.channel = data.channel as any;
  if (data.cancelledOrMoved !== undefined) payload.cancelled_or_moved = data.cancelledOrMoved as any;
  if (data.syncStatus !== undefined) payload.sync_status = data.syncStatus as any;
  if (data.syncNote !== undefined) payload.sync_note = data.syncNote;
  const { error } = await supabase.from('info_log').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteInfoLog(id: number): Promise<void> {
  const { error } = await supabase.from('info_log').delete().eq('id', id);
  if (error) throw error;
}
export async function createMemberFromInfoLog(log: InfoLog): Promise<void> {
  if (!log.email || !log.houseGroup) return;
  // Resolve target house by number, auto-create if missing
  let house = await getHouseByNumber(String(log.houseGroup));
  if (!house) {
    house = await createHouse({ houseNumber: String(log.houseGroup) });
  }
  // Find existing member by email
  const { data: existingRows, error } = await supabase
    .from('house_members')
    .select('id, house_id, member_email')
    .eq('member_email', log.email)
    .order('id', { ascending: true })
    .limit(1);
  if (error) throw error;
  const existing = existingRows?.[0] as any | undefined;
  // Always mirror expiration date from the log
  const expirationDateFromLog = log.expirationDate ?? null;
  const isActiveFromLog = expirationDateFromLog ? new Date(expirationDateFromLog) >= new Date() : true;
  // If expired: auto remove from house immediately
  if (!isActiveFromLog) {
    if (existing) {
      await deleteMember(existing.id);
    }
    // If there is no existing membership and already expired, do nothing
    return;
  }
  if (!existing) {
    // Create new member with expiration equal to info_log
    await createMember({
      houseId: house.id,
      memberEmail: log.email,
      note: null,
      expirationDate: expirationDateFromLog,
      isActive: isActiveFromLog,
    });
    return;
  }
  // Update target house if changed and sync expiration
  const updatePayload: Partial<{ houseId: number; memberEmail: string; expirationDate: string | null; note: string | null; isActive: boolean | null; }> = {
    expirationDate: expirationDateFromLog,
    isActive: isActiveFromLog,
  };
  if (existing.house_id !== house.id) {
    updatePayload.houseId = house.id;
  }
  await updateMember(existing.id, updatePayload);
}

export async function getHouseById(id: number): Promise<House | null> {
  const { data, error } = await supabase.from('house_list').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    houseNumber: data.house_number,
    adminEmail: data.admin_email,
    registrationDate: data.registration_date,
    status: data.status,
    note: data.note,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
export async function getHouseByNumber(houseNumber: string): Promise<House | null> {
  const { data, error } = await supabase.from('house_list').select('*').eq('house_number', houseNumber).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    houseNumber: data.house_number,
    adminEmail: data.admin_email,
    registrationDate: data.registration_date,
    status: data.status,
    note: data.note,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
export async function createHouse(data: Partial<House>): Promise<House> {
  const payload: any = {
    house_number: data.houseNumber,
    admin_email: data.adminEmail ?? null,
    registration_date: data.registrationDate ?? null,
    status: data.status ?? 'active',
    note: data.note ?? null,
  };
  const { data: inserted, error } = await supabase.from('house_list').insert(payload).select('*').single();
  if (error) throw error;
  return {
    id: inserted.id,
    houseNumber: inserted.house_number,
    adminEmail: inserted.admin_email,
    registrationDate: inserted.registration_date,
    status: inserted.status,
    note: inserted.note,
    createdAt: inserted.created_at,
    updatedAt: inserted.updated_at,
  };
}
export async function updateHouse(id: number, data: Partial<House>): Promise<House> {
  const payload: any = {};
  if (data.houseNumber !== undefined) payload.house_number = data.houseNumber;
  if (data.adminEmail !== undefined) payload.admin_email = data.adminEmail;
  if (data.registrationDate !== undefined) payload.registration_date = data.registrationDate;
  if (data.status !== undefined) payload.status = data.status as any;
  if (data.note !== undefined) payload.note = data.note;
  const { data: updated, error } = await supabase.from('house_list').update(payload).eq('id', id).select('*').single();
  if (error) throw error;
  return {
    id: updated.id,
    houseNumber: updated.house_number,
    adminEmail: updated.admin_email,
    registrationDate: updated.registration_date,
    status: updated.status,
    note: updated.note,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  };
}
export async function deleteHouse(id: number): Promise<void> {
  const { error } = await supabase.from('house_list').delete().eq('id', id);
  if (error) throw error;
}

export async function getMemberById(id: number): Promise<HouseMember | null> {
  const { data, error } = await supabase
    .from('house_members')
    .select('id, house_id, member_email, note, expiration_date, is_active, created_at, updated_at, line_id')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    houseId: data.house_id,
    memberEmail: data.member_email,
    note: data.note,
    expirationDate: data.expiration_date,
    isActive: Boolean(data.is_active),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    lineId: data.line_id,
  };
}

export async function getMembersByHouseId(houseId: number): Promise<HouseMember[]> {
  const { data, error } = await supabase
    .from('house_members')
    .select('id, house_id, member_email, note, expiration_date, is_active, created_at, updated_at, line_id')
    .eq('house_id', houseId);
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    houseId: row.house_id,
    memberEmail: row.member_email,
    note: row.note,
    expirationDate: row.expiration_date,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lineId: row.line_id,
  }));
}

async function countMembersByHouse(houseId: number, excludeMemberId?: number) {
  // When excluding, select IDs and filter client-side (Supabase head/count doesn't support neq with head reliably)
  if (excludeMemberId) {
    const { data, error } = await supabase
      .from('house_members')
      .select('id')
      .eq('house_id', houseId);
    if (error) throw error;
    return (data ?? []).filter((r: any) => r.id !== excludeMemberId).length;
  }
  const { count, error } = await supabase
    .from('house_members')
    .select('id', { count: 'exact', head: true })
    .eq('house_id', houseId);
  if (error) throw error;
  return count ?? 0;
}

export async function createMember(data: { houseId: number; memberEmail: string; expirationDate?: string | null; note?: string | null; isActive?: boolean | null; }): Promise<HouseMember> {
  const current = await countMembersByHouse(data.houseId);
  if (current >= 5) {
    throw new Error('บ้านนี้มีสมาชิกครบ 5 คนแล้ว');
  }
  const payload: any = {
    house_id: data.houseId,
    member_email: data.memberEmail,
    expiration_date: data.expirationDate ?? null,
    note: data.note ?? null,
    is_active: data.isActive ?? true,
  };
  const { data: inserted, error } = await supabase
    .from('house_members')
    .insert(payload)
    .select('id, house_id, member_email, note, expiration_date, is_active, created_at, updated_at, line_id')
    .single();
  if (error) throw error;
  return {
    id: inserted.id,
    houseId: inserted.house_id,
    memberEmail: inserted.member_email,
    note: inserted.note,
    expirationDate: inserted.expiration_date,
    isActive: Boolean(inserted.is_active),
    createdAt: inserted.created_at,
    updatedAt: inserted.updated_at,
    lineId: inserted.line_id,
  };
}

export async function updateMember(id: number, data: Partial<{ houseId: number; memberEmail: string; expirationDate: string | null; note: string | null; isActive: boolean | null; }>): Promise<HouseMember> {
  if (data.houseId !== undefined) {
    const current = await countMembersByHouse(data.houseId, id);
    if (current >= 5) {
      throw new Error('บ้านนี้มีสมาชิกครบ 5 คนแล้ว');
    }
  }
  const payload: any = {};
  if (data.houseId !== undefined) payload.house_id = data.houseId;
  if (data.memberEmail !== undefined) payload.member_email = data.memberEmail;
  if (data.expirationDate !== undefined) payload.expiration_date = data.expirationDate;
  if (data.note !== undefined) payload.note = data.note;
  if (data.isActive !== undefined) payload.is_active = data.isActive;
  const { data: updated, error } = await supabase
    .from('house_members')
    .update(payload)
    .eq('id', id)
    .select('id, house_id, member_email, note, expiration_date, is_active, created_at, updated_at, line_id')
    .single();
  if (error) throw error;
  return {
    id: updated.id,
    houseId: updated.house_id,
    memberEmail: updated.member_email,
    note: updated.note,
    expirationDate: updated.expiration_date,
    isActive: Boolean(updated.is_active),
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
    lineId: updated.line_id,
  };
}

export async function deleteMember(id: number): Promise<void> {
  const { error } = await supabase.from('house_members').delete().eq('id', id);
  if (error) throw error;
}

// --- Minimal user helpers for auth middleware (used by SDK) ---

export type UserRow = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role?: string | null;
  lastSignedIn?: string | Date | null;
};

export async function getUserByOpenId(openId: string): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, openId, name, email, loginMethod, role, lastSignedIn")
    .eq("openId", openId)
    .maybeSingle();
  if (error) {
    console.error("getUserByOpenId error:", error);
    return null;
  }
  return (data as any) ?? null;
}

export async function upsertUser(partial: Partial<UserRow> & { openId: string }): Promise<void> {
  const payload = {
    name: null,
    email: null,
    loginMethod: null,
    role: "user",
    ...partial,
  };
  const { error } = await supabase.from("users").upsert(payload, {
    onConflict: "openId",
  });
  if (error) {
    console.error("upsertUser error:", error);
    throw error;
  }
}
