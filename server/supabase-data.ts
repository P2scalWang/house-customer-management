import { supabase } from "./supabase";
import { z } from "zod";

// --- Schema Definitions (Aligned to actual Supabase table: public.house_members) ---
// Columns visible in screenshot: id, house_id, member_email, note, expiration_date, is_active,
// created_at, updated_at, line_id

const RawHouseMemberSchema = z.object({
  id: z.number().int(),
  house_id: z.number().int(),
  member_email: z.string(),
  note: z.string().nullable(),
  expiration_date: z.string().nullable(),
  is_active: z.boolean().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  line_id: z.string().nullable(),
});

// App-facing shape (camelCase) used by client pages
export type HouseMember = {
  id: number;
  houseId: number;
  memberEmail: string;
  note: string | null;
  expirationDate: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  lineId: string | null;
};

function mapToHouseMember(row: z.infer<typeof RawHouseMemberSchema>): HouseMember {
  return {
    id: row.id,
    houseId: row.house_id,
    memberEmail: row.member_email,
    note: row.note,
    expirationDate: row.expiration_date,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lineId: row.line_id,
  };
}

// --- Data Fetching Functions ---

/**
 * Fetches all house members from the 'house_members' table.
 */
export async function getAllHouseMembers(): Promise<HouseMember[]> {
  const { data, error } = await supabase
    .from("house_members")
    .select(
      "id, house_id, member_email, note, expiration_date, is_active, created_at, updated_at, line_id"
    );

  if (error) {
    console.error("Error fetching house_members:", error);
    throw new Error("Failed to fetch house members from Supabase.");
  }

  const validated = z.array(RawHouseMemberSchema).parse(data ?? []);
  return validated.map(mapToHouseMember);
}

/**
 * Fetches active house members (expiration_date in the future AND is_active true).
 */
export async function getActiveHouseMembers(): Promise<HouseMember[]> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const { data, error } = await supabase
    .from("house_members")
    .select(
      "id, house_id, member_email, note, expiration_date, is_active, created_at, updated_at, line_id"
    )
    .gt("expiration_date", today)
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching active house_members:", error);
    throw new Error("Failed to fetch active house members from Supabase.");
  }

  const validated = z.array(RawHouseMemberSchema).parse(data ?? []);
  return validated.map(mapToHouseMember);
}

/**
 * Fetches expired house members (expiration_date in the past OR is_active false).
 */
export async function getExpiredHouseMembers(): Promise<HouseMember[]> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const { data, error } = await supabase
    .from("house_members")
    .select(
      "id, house_id, member_email, note, expiration_date, is_active, created_at, updated_at, line_id"
    )
    .lte("expiration_date", today);

  if (error) {
    console.error("Error fetching expired house_members:", error);
    throw new Error("Failed to fetch expired house members from Supabase.");
  }

  const validated = z.array(RawHouseMemberSchema).parse(data ?? []);
  return validated.map(mapToHouseMember);
}

// NOTE: More functions (e.g., for info_log, house_list) can be added similarly when needed.
