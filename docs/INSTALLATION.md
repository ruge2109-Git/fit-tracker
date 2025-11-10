# 🚀 FitTrackr Installation Guide

Complete step-by-step guide to get FitTrackr running on your machine.

## Prerequisites

Before you begin, ensure you have:
- ✅ Node.js 18 or higher installed
- ✅ npm or yarn package manager
- ✅ A Supabase account (free tier works perfectly)
- ✅ Git installed

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/fittrackr.git
cd fittrackr
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```

This will install all required packages including:
- Next.js 14
- React 18
- TypeScript
- TailwindCSS
- Supabase client
- Zustand
- React Hook Form
- Zod
- Recharts
- And more...

### 3. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: FitTrackr (or any name you prefer)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location
4. Click **"Create new project"**
5. Wait 2-3 minutes for the database to be provisioned

### 4. Get Supabase Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)
4. Keep this tab open, you'll need these values

**Note**: You'll also need the `service_role` key for some operations, but for this app, the `anon` key is sufficient.

### 5. Set Up Environment Variables

1. In your project root, create a `.env.local` file:
   ```bash
   # Windows
   type nul > .env.local
   
   # Linux/Mac
   touch .env.local
   ```

2. Open `.env.local` in your text editor

3. Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

**Important**: 
- Replace `your-project-id` with your actual Supabase project ID
- Replace `your-actual-anon-key-here` with your actual anon key
- The `NEXT_PUBLIC_APP_URL` is used for PWA and metadata

### 6. Set Up Database Schema

Now we need to create the database tables. You need to run **three migrations** in order:

#### Migration 1: Initial Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open `supabase/migrations/001_initial_schema.sql` from the project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. You should see "Success. No rows returned"

This creates:
- `workouts` table
- `exercises` table (with 10 default exercises)
- `sets` table
- `routines` table
- `routine_exercises` table
- Row-Level Security policies

#### Migration 2: Routine Scheduling

1. Click **"New query"** again
2. Open `supabase/migrations/002_add_routine_scheduling.sql`
3. Copy and paste the contents
4. Click **"Run"**

This adds:
- `frequency` column to `routines` table
- `scheduled_days` column to `routines` table
- `routine_id` column to `workouts` table

#### Migration 3: Multimedia Support

1. Click **"New query"** again
2. Open `supabase/migrations/003_add_multimedia.sql`
3. Copy and paste the contents
4. Click **"Run"**

This adds:
- `image_url` column to `exercises` table
- `video_url` column to `exercises` table
- `demonstration_gif` column to `exercises` table

### 7. Verify Database Setup

In Supabase Dashboard:
1. Go to **Table Editor**
2. You should see these tables:
   - ✅ `workouts` - Your workout sessions
   - ✅ `exercises` - Exercise catalog (with 10 default exercises)
   - ✅ `sets` - Individual sets in workouts
   - ✅ `routines` - Workout templates
   - ✅ `routine_exercises` - Exercises in routines

3. Verify columns:
   - `routines` table should have `frequency` and `scheduled_days` columns
   - `exercises` table should have `image_url`, `video_url`, and `demonstration_gif` columns
   - `workouts` table should have `routine_id` column

### 8. Run the Development Server

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in Xms
```

### 9. Open the App

1. Open your browser
2. Navigate to [http://localhost:3000](http://localhost:3000)
3. You should see the FitTrackr login/signup page

### 10. Create Your Account

1. Click on the **"Sign Up"** tab
2. Fill in:
   - Name: Your name
   - Email: Your email
   - Password: At least 6 characters
3. Click **"Sign Up"**
4. You'll be automatically logged in and redirected to the dashboard

🎉 **Congratulations!** FitTrackr is now running on your machine!

## Next Steps

### Test the App

Try these features:
1. ✅ Create your first workout
2. ✅ Add exercises from the catalog
3. ✅ View your dashboard statistics and charts
4. ✅ Try the dark mode toggle
5. ✅ Browse the exercises library
6. ✅ Create a routine with scheduled days
7. ✅ Start a workout from a routine
8. ✅ Use the rest timer during workouts
9. ✅ Try the 1RM calculator
10. ✅ Check your profile page
11. ✅ Test offline mode (disconnect internet)
12. ✅ Change language (if i18n is configured)

### Enable OAuth (Optional)

To enable Google Sign-In:

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. Follow the instructions to set up Google OAuth
4. Add your Google Client ID and Secret
5. Save the configuration

## Troubleshooting

### "Module not found" errors

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database connection errors

- ✅ Verify `.env.local` values are correct
- ✅ Check that your Supabase project is running
- ✅ Ensure you ran the database migration

### Authentication not working

- ✅ Clear browser cookies and cache
- ✅ Check browser console for errors
- ✅ Verify Supabase URL and key in `.env.local`

### Port 3000 already in use

```bash
# Use a different port
npm run dev -- -p 3001
```

### Build errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## Common Issues

### Issue: "Invalid API key"
**Solution**: Double-check your `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. Make sure there are no extra spaces or quotes.

### Issue: Tables not found
**Solution**: Run the SQL migration script again. Make sure all tables were created successfully.

### Issue: Login fails
**Solution**: 
1. Check browser console for errors
2. Verify Supabase project is active
3. Check email confirmation (Supabase sends confirmation emails by default)

### Issue: Exercises not showing
**Solution**: The seed data should have created default exercises. Check the `exercises` table in Supabase Table Editor.

## Development Tips

### Hot Reload
Next.js supports hot module replacement. Changes to files will automatically refresh the browser.

### TypeScript Errors
If you see TypeScript errors in your editor, try:
```bash
# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Database Changes
If you modify the database schema:
1. Make changes in Supabase SQL Editor
2. Update TypeScript types in `src/types/index.ts`
3. Update repositories if needed

## Getting Help

- 📖 Check the main [README.md](README.md) for detailed documentation
- 🐛 [Open an issue](https://github.com/yourusername/fittrackr/issues) on GitHub
- 💬 Check existing issues for solutions
- 📧 Contact: your-email@example.com

## Production Deployment

Ready to deploy? See [DEPLOYMENT.md](DEPLOYMENT.md) for instructions on deploying to Vercel.

---

**Happy Coding! 💪**

