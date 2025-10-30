# 🚨 Quick Fix for 404 NOT_FOUND Error

## Problem
When you click "Sign In", you get:
```
404: NOT_FOUND
Code: NOT_FOUND
ID: sin1::xxxxx-xxxxxxxxxx-xxxxxxxxxxxx
```

## Solution

### Step 1: Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings** tab
3. Click on **Environment Variables** in the sidebar
4. Add these two variables:

```
SUPABASE_URL = your_supabase_project_url
SUPABASE_ANON_KEY = your_supabase_anon_key
```

### Step 2: Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Go to **Settings** > **API**
4. Copy the values:
   - **Project URL** → use as `SUPABASE_URL`
   - **anon public** key → use as `SUPABASE_ANON_KEY`

### Step 3: Redeploy

1. After adding environment variables in Vercel
2. Go to **Deployments** tab
3. Click **Redeploy** on the latest deployment
4. Or push any small change to trigger new deployment

### Step 4: Test Login

Use these credentials to test:
- **Email**: admin@example.com
- **Password**: admin123

## Verification

After fixing, you should see:
- ✅ Login page loads
- ✅ No 404 error when clicking "Sign In"
- ✅ Either successful login or proper error message

## Still Having Issues?

Check the Vercel function logs:
1. Go to Vercel Dashboard
2. Click on your project
3. Go to **Functions** tab
4. Check the logs for error details