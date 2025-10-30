# 🚨 Quick Fix for 404 NOT_FOUND Error

## Problem
When you click "Sign In", you get:
```
404: NOT_FOUND
Code: NOT_FOUND
ID: sin1::xxxxx-xxxxxxxxxx-xxxxxxxxxxxx
```

## Root Cause
The issue is that **Environment Variables are not set in Vercel**, causing the tRPC API to fail.

## Solution

### Step 1: Set Environment Variables in Vercel

1. Go to your **Vercel project dashboard**
2. Click on **Settings** tab  
3. Click on **Environment Variables** in the sidebar
4. Add these **EXACT** variables:

```
Name: SUPABASE_URL
Value: [your_supabase_project_url]

Name: SUPABASE_ANON_KEY  
Value: [your_supabase_anon_key]
```

### Step 2: Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Open your project (p2scalworkhost@gmail.com's Org)
3. Go to **Settings** > **API**
4. Copy these values:
   - **Project URL** → use as `SUPABASE_URL`
   - **anon public** key → use as `SUPABASE_ANON_KEY`

**Example:**
```
SUPABASE_URL = https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Redeploy in Vercel

⚠️ **IMPORTANT:** Environment variables only take effect after redeployment

1. After adding environment variables
2. Go to **Deployments** tab in Vercel
3. Click **"..."** menu on latest deployment
4. Click **"Redeploy"**
5. Wait for deployment to complete

### Step 4: Test the Fix

**Test URLs** (replace with your domain):
1. `https://your-app.vercel.app/api/health` - Should show "OK"
2. `https://your-app.vercel.app/api/debug` - Shows environment status
3. Login page with: admin@example.com / admin123

## Verification Checklist

✅ Environment variables added in Vercel  
✅ Project redeployed after adding variables  
✅ `/api/health` returns "OK"  
✅ Login page loads without 404  
✅ Can attempt login (success/failure both OK, no 404)  

## Still Having Issues?

### Debug Steps:
1. Check `/api/debug` endpoint for environment status
2. Check Vercel function logs:
   - Go to Vercel Dashboard → **Functions** tab
   - Look for error messages
3. Verify Supabase credentials are correct
4. Make sure you redeployed after adding variables

### Common Mistakes:
- ❌ Forgot to redeploy after adding environment variables
- ❌ Wrong Supabase URL (missing https://)
- ❌ Wrong anon key (copied service role key instead)
- ❌ Typo in variable names (SUPABASE_URL vs SUPABASE_URI)