import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { ENV } from './_core/env';

// Supabase Project URL and Anon Key are stored in environment variables
const supabaseUrl = ENV.supabaseUrl;
// Prefer service role key on the server to bypass RLS for backend operations
const supabaseKey = ENV.supabaseServiceKey || ENV.supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  console.error("SUPABASE_URL or SUPABASE_ANON_KEY is not set in environment variables.");
  console.error("Please set the following environment variables:");
  console.error("- SUPABASE_URL=your_supabase_project_url");
  console.error("- SUPABASE_ANON_KEY=your_supabase_anon_key");
  throw new Error("Missing Supabase configuration. Please check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to get the Supabase client (if needed elsewhere)
export function getSupabase() {
  return supabase;
}
