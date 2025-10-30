# House Customer Management System

A full-stack house customer management application built with React, tRPC, and Supabase.

## Features

- 🏠 House management
- 👥 Customer/Member management  
- 📊 Dashboard with analytics
- 🌓 Dark/Light mode support
- 📱 Responsive design
- 🔐 Authentication with Supabase

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: tRPC, Express.js, Node.js
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle
- **Deployment**: Vercel

## Quick Deploy to Vercel

### 1. Prerequisites
- A [Supabase](https://supabase.com) project
- A [Vercel](https://vercel.com) account

### 2. Deploy Steps

1. **Click to Deploy**:
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/P2scalWang/house-customer-management)

2. **Set Environment Variables** in Vercel:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Deploy** - Vercel will automatically build and deploy your app!

### 3. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** to get your credentials:
   - `Project URL` → use as `SUPABASE_URL`
   - `anon public` key → use as `SUPABASE_ANON_KEY`
3. **Important**: Make sure these environment variables are set in Vercel
4. Run the SQL scripts in your Supabase SQL editor (optional, for sample data):
   - `setup-complete-database.sql` - Creates tables and sample data
   - `setup-login-users.sql` - Creates test user (admin@example.com / admin123)

## Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/P2scalWang/house-customer-management.git
   cd house-customer-management
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Run development server**:
   ```bash
   pnpm dev
   ```

5. **Open your browser**: http://localhost:3000

## Project Structure

```
├── client/          # React frontend
├── server/          # tRPC backend
├── shared/          # Shared types and utilities  
├── drizzle/         # Database schema and migrations
├── *.sql           # Database setup scripts
└── vercel.json     # Vercel deployment config
```

## Environment Variables

### Required (Minimum for deployment):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Optional (with sensible defaults):
- `VITE_APP_ID` - App identifier (default: "house-management-app")
- `JWT_SECRET` - Session secret (auto-generated for development)
- `DISABLE_AUTH` - Disable authentication (default: false)

## Scripts

```bash
# Development
pnpm dev          # Start dev server

# Building
pnpm build        # Build for production
pnpm start        # Start production server

# Database
pnpm db:push      # Push schema changes to database

# Code Quality  
pnpm check        # Type checking
pnpm format       # Format code
pnpm test         # Run tests
```

## Deployment

This project is optimized for Vercel deployment with:
- ✅ Automatic builds from GitHub
- ✅ Serverless functions for API
- ✅ Static site generation for frontend
- ✅ Environment variable management

## Troubleshooting

### Common Deployment Issues

1. **404 NOT_FOUND Error when signing in**:
   ```
   404: NOT_FOUND
   Code: NOT_FOUND
   ```
   **Solution**: This means Supabase environment variables are not set properly
   - Go to your Vercel project settings
   - Add Environment Variables:
     ```
     SUPABASE_URL=your_supabase_project_url
     SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
   - Redeploy your project

2. **"Missing Supabase configuration" Error**:
   - Check that your environment variables are correct
   - Verify your Supabase project is active
   - Make sure you're using the correct Project URL and anon key

3. **Login fails with "อีเมลหรือรหัสผ่านไม่ถูกต้อง"**:
   - Run the SQL script `setup-login-users.sql` in your Supabase SQL editor
   - Or create a user manually in your Supabase `users` table
   - Test credentials: admin@example.com / admin123

4. **PNPM Lockfile Issues** (resolved):
   - This project has been optimized to avoid lockfile conflicts

### Quick Test

After deployment, you should be able to:
1. Visit your Vercel URL
2. See the login page
3. Login with: admin@example.com / admin123
4. Access the dashboard

## Support

For issues and questions, please open an issue in the GitHub repository.

## License

MIT License - see LICENSE file for details.