import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { ENV } from './_core/env';

// Supabase Project URL and Anon Key are stored in environment variables
const supabaseUrl = ENV.supabaseUrl;
// Prefer service role key on the server to bypass RLS for backend operations
const supabaseKey = ENV.supabaseServiceKey || ENV.supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  const errorMsg = `
Missing Supabase configuration. Please set the following environment variables:
- SUPABASE_URL=your_supabase_project_url
- SUPABASE_ANON_KEY=your_supabase_anon_key

Current values:
- SUPABASE_URL: ${supabaseUrl || 'NOT SET'}
- SUPABASE_ANON_KEY: ${supabaseKey ? 'SET' : 'NOT SET'}
`;
  console.error(errorMsg);
  // Don't throw error immediately - let the routes handle it gracefully
}

// Create client even with dummy values to prevent import errors
export const supabase = createClient(
  supabaseUrl || "https://dummy.supabase.co", 
  supabaseKey || "dummy-key"
);

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(ENV.supabaseUrl && (ENV.supabaseServiceKey || ENV.supabaseAnonKey));
}

// Helper function to get the Supabase client (if needed elsewhere)
export function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Missing Supabase configuration. Please check your environment variables.");
  }
  return supabase;
}
