// Simple test API endpoint for Vercel
export default function handler(req, res) {
  res.status(200).json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });
}