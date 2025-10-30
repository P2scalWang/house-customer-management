import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const env = {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'undefined'
    };

    res.status(200).json({
      message: 'Debug endpoint working',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      environment: env,
      trpcPath: '/api/trpc',
      serverStatus: 'OK'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}