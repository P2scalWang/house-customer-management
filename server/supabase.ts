import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { ENV } from './_core/env';

// Supabase Project URL and Anon Key are stored in environment variables
const supabaseUrl = ENV.supabaseUrl;
// Prefer service role key on the server to bypass RLS for backend operations
const supabaseKey = ENV.supabaseServiceKey || ENV.supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  console.error("SUPABASE_URL or SUPABASE_ANON_KEY is not set in environment variables.");
  // In a real application, you might throw an error or handle this more gracefully.
  // For deployment preparation, we'll assume the user will set them in Vercel.
}

export const supabase = createClient(supabaseUrl || "dummy_url", supabaseKey || "dummy_key");

// Helper function to get the Supabase client (if needed elsewhere)
export function getSupabase() {
  return supabase;
}
