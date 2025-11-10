# 💪 FitTrackr

A modern, scalable workout tracking application built with Next.js 14, TypeScript, Supabase, and following SOLID principles and Clean Architecture patterns.

## ✨ Features

- 🔐 **Authentication**: Secure user authentication with Supabase Auth (email/password + OAuth)
- 📊 **Dashboard**: Comprehensive overview of your fitness progress with statistics and charts
- 🏋️ **Workouts**: 
  - Create, view, edit, and delete workouts
  - Track sets, reps, weights, and rest times
  - Start workouts from routine templates
  - Edit existing workouts (date, duration, notes, sets)
- 💪 **Exercises**: Browse and manage a catalog of exercises with filtering by type and muscle group
- 📝 **Routines**: 
  - Create reusable workout templates
  - Configure frequency (1-6x per week, daily, or custom)
  - Schedule specific days (Mon, Tue, Wed, etc.)
  - Edit routine details and scheduling
  - Start workouts pre-filled from routine templates
- 📈 **Progress Tracking**: Visualize your improvements over time with interactive charts
- 📱 **PWA (Progressive Web App)**: Installable as native app on any device
- 📴 **Offline Mode**: Full functionality without internet connection
- 🔔 **Notifications**: Reminders for scheduled workout routines
- 🎬 **Multimedia**: Support for exercise images, videos, and GIFs
- 🌓 **Dark Mode**: Beautiful light and dark themes with system preference detection
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- ⚡ **Real-time Updates**: Fast and reactive UI powered by Zustand state management

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- **Next.js 14** - App Router, Server Components, Server Actions
- **TypeScript** - Full type safety across the application
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible UI components
- **Zustand** - Lightweight state management
- **React Hook Form** - Performant form handling
- **Zod** - Runtime type validation
- **Recharts** - Beautiful data visualization
- **Sonner** - Elegant toast notifications

**Backend:**
- **Supabase** - PostgreSQL database with Row-Level Security
- **Supabase Auth** - Authentication and authorization
- **Supabase Edge Functions** - Serverless TypeScript functions

**Hosting:**
- **Vercel** - Frontend deployment (free tier)
- **Supabase Cloud** - Backend and database (free tier)

### Design Principles

This project implements:

- ✅ **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- ✅ **Clean Architecture**: Separation of concerns with domain, repositories, and services layers
- ✅ **Design Patterns**: Repository, Factory, Observer, Command, and Adapter patterns
- ✅ **Type Safety**: End-to-end TypeScript with strict mode enabled
- ✅ **Component Composition**: Reusable, testable, and maintainable components

### Project Structure

```
fittrackr/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── workouts/       # Workouts pages
│   │   │   ├── exercises/      # Exercises catalog
│   │   │   ├── routines/       # Routines management
│   │   │   └── profile/        # User profile
│   │   ├── auth/               # Authentication pages
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── workouts/           # Workout-specific components
│   │   ├── exercises/          # Exercise-specific components
│   │   ├── charts/             # Data visualization components
│   │   ├── navigation/         # Navigation components
│   │   └── providers/          # Context providers
│   ├── domain/                 # Domain layer (business logic)
│   │   ├── repositories/       # Data access layer
│   │   └── services/           # Business services
│   ├── store/                  # Zustand state stores
│   ├── lib/                    # Utility libraries
│   │   ├── supabase/           # Supabase client configuration
│   │   ├── utils.ts            # Helper functions
│   │   └── constants.ts        # App constants
│   └── types/                  # TypeScript type definitions
├── supabase/
│   ├── functions/              # Edge Functions
│   └── migrations/             # Database migrations
├── public/                     # Static assets
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier is sufficient)
- Git
- Modern web browser (Chrome, Firefox, Safari, or Edge)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/fittrackr.git
cd fittrackr
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Go to **Project Settings** → **API**
4. Copy your **Project URL** and **anon/public key**

### 4. Run Database Migration

**Method 1: Using Supabase Dashboard (Recommended)**

1. In your Supabase project dashboard, go to **SQL Editor** (icon in left sidebar)
2. Click **"New query"** button
3. Open the file `supabase/migrations/001_initial_schema.sql` from your project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **"Run"** button (or press `Ctrl/Cmd + Enter`)
7. You should see "Success. No rows returned"

This will create all necessary tables, indexes, Row-Level Security policies, and seed 10 default exercises.

**Method 2: Using Supabase CLI (Optional)**

If you have Supabase CLI installed:
```bash
npx supabase db push
```

**Verify the setup:**
- Go to **Table Editor** in Supabase Dashboard
- You should see tables: `workouts`, `exercises`, `sets`, `routines`, `routine_exercises`
- The `exercises` table should have 10 pre-loaded exercises

#### 4.1 Run Second Migration (Routine Scheduling)

**NEW FEATURE:** Support for routine frequency and scheduled days

1. In Supabase SQL Editor, click **"New query"**
2. Open the file `supabase/migrations/002_add_routine_scheduling.sql`
3. Copy and paste the contents
4. Click **"Run"**

This adds:
- `frequency` column to `routines` table (for 1x/week, 2x/week, etc.)
- `scheduled_days` column to `routines` table (for specific days: Mon, Tue, etc.)
- `routine_id` column to `workouts` table (to track which routine was used)

**Verify:**
```sql
-- Run this in SQL Editor to check columns exist:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'routines' 
AND column_name IN ('frequency', 'scheduled_days');
```

#### 4.2 Run Third Migration (Multimedia Support)

**NEW FEATURE:** Support for exercise images, videos, and GIFs

1. In Supabase SQL Editor, click **"New query"**
2. Open the file `supabase/migrations/003_add_multimedia.sql`
3. Copy and paste the contents
4. Click **"Run"**

This adds:
- `image_url` column to `exercises` table (for demonstration images)
- `video_url` column to `exercises` table (for tutorial videos)
- `demonstration_gif` column to `exercises` table (for animated GIFs)

**Verify:**
```sql
-- Run this in SQL Editor to check columns exist:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'exercises' 
AND column_name IN ('image_url', 'video_url', 'demonstration_gif');
```

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Create Your Account

1. Navigate to the app
2. Click on "Sign Up"
3. Enter your name, email, and password
4. Start tracking your workouts!

## ⚠️ Important Notes

### Supabase CLI Installation

**Note**: Installing Supabase CLI globally with `npm install -g supabase` is no longer supported and will fail.

**You don't need Supabase CLI for this project!** All database setup can be done through the Supabase Dashboard (recommended approach).

**If you need CLI for advanced features**, use one of these methods:

**Option 1: Use npx (No installation needed)**
```bash
npx supabase --help
npx supabase login
```

**Option 2: Install via Scoop (Windows)**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Option 3: Install via Homebrew (macOS/Linux)**
```bash
brew install supabase/tap/supabase
```

**Option 4: Download binary directly**
- Visit: https://github.com/supabase/cli/releases
- Download the appropriate version for your OS

## 📚 Database Schema

### Tables

**users**
- Extends Supabase auth.users
- Stores additional user profile information

**workouts**
- User's workout sessions
- Fields: date, duration, notes, routine_id (optional)
- Related to user via `user_id`
- `routine_id` tracks which routine template was used to create the workout

**exercises**
- Catalog of available exercises
- Fields: name, type, muscle_group, description, image_url, video_url, demonstration_gif
- Types: strength, cardio, mobility, flexibility
- Muscle groups: chest, back, legs, shoulders, arms, core, full_body, cardio
- Multimedia: Support for images, videos, and animated GIFs

**sets**
- Individual sets performed in workouts
- Fields: workout_id, exercise_id, reps, weight, rest_time
- Links workouts and exercises with performance data

**routines**
- User-created workout templates
- Fields: name, description, is_active, frequency, scheduled_days
- `frequency`: How often to perform (weekly_1, weekly_2, ..., daily, custom)
- `scheduled_days`: Array of days [monday, tuesday, ...] when frequency is 'custom'

**routine_exercises**
- Exercises included in routines
- Fields: routine_id, exercise_id, target_sets, target_reps, target_weight

### Row-Level Security (RLS)

All tables have RLS enabled to ensure users can only access their own data:

- Users can only view/modify their own workouts
- Users can only view/modify their own routines
- Sets are accessible only through owned workouts
- Exercises are publicly readable, authenticated users can create

## 🎨 UI Components

Built with **shadcn/ui** - a collection of re-usable, accessible components:

**Base UI Components:**
- **Button** - Multiple variants (default, destructive, outline, ghost, link)
- **Card** - Container for content sections
- **Input** - Form input fields with validation
- **Select** - Dropdown selectors
- **Dialog** - Modal dialogs
- **Tabs** - Tabbed interfaces
- **Label** - Form labels
- **Sonner** - Toast notifications

**Custom Domain Components:**
- **WorkoutCard** - Display workout summaries with stats
- **WorkoutForm** - Create/edit workouts with validation
- **ExerciseSelect** - Exercise dropdown with auto-load
- **ProgressChart** - Interactive data visualization with Recharts
- **NavBar** - Responsive navigation with theme toggle
- **ThemeProvider** - Dark mode support with system detection

## 🔐 Authentication Flow

1. User visits the app
2. Middleware checks for authentication
3. If not authenticated → redirect to `/auth`
4. User can login or sign up
5. Supabase handles session management
6. Authenticated users access protected routes

**OAuth Support:**
- Google OAuth is configured
- Callback handled at `/auth/callback`
- Easy to add more providers (GitHub, Facebook, etc.)

## 📊 State Management

Uses **Zustand** for global state with multiple stores:

- **useAuthStore** - Authentication state and user data
- **useWorkoutStore** - Workout data and operations
- **useExerciseStore** - Exercise catalog with filters

Each store follows the Observer pattern and provides:
- State management
- Actions for data operations
- Loading states
- Error handling

## 🛠️ Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

Vercel will automatically:
- Build your Next.js app
- Deploy to a global CDN
- Provide HTTPS
- Enable automatic deployments on push

### Supabase Edge Functions (Optional)

To deploy Edge Functions:

```bash
# Using npx (no installation needed)
npx supabase login

# Link your project
npx supabase link --project-ref your-project-ref

# Deploy functions
npx supabase functions deploy create-workout

# Alternative: If you installed CLI via Scoop/Homebrew
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy create-workout
```

**Note**: Edge Functions are optional. The app works perfectly without deploying them as all functionality is already implemented in the repositories and services.

## 🎯 Key Features Explained

### Repository Pattern

All data access is abstracted through repositories:
- `WorkoutRepository` - Workout CRUD operations
- `ExerciseRepository` - Exercise catalog management
- `SetRepository` - Set data management
- `RoutineRepository` - Routine management

Benefits:
- Easy to test (mock repositories)
- Easy to swap data sources
- Consistent error handling
- Type-safe operations

### Service Layer

Business logic is separated into services:
- `WorkoutService` - Workout business logic (e.g., create workout with sets)
- `StatsService` - Calculate statistics and analytics
- `AuthService` - Authentication operations

### Form Validation

Uses **React Hook Form** + **Zod** for type-safe validation:

```typescript
const schema = z.object({
  date: z.string().min(1),
  duration: z.number().min(1),
  notes: z.string().optional(),
})
```

Benefits:
- Runtime validation
- TypeScript type inference
- Clear error messages
- Excellent performance

## 📈 Advanced Features

### ✅ Implemented
- 📱 **PWA** - Installable as native app, works offline
- 📴 **Offline Mode** - Full functionality without internet
- 🔔 **Notifications** - Reminders for scheduled routines
- 📸 **Multimedia** - Exercise images, videos, and GIFs
- 📊 **Advanced Analytics** - Volume progression, PRs, top exercises
- 🎨 **Charts & Visualizations** - Interactive progress charts
- 🔍 **Advanced Filtering** - Filter workouts by date, duration, notes
- 📋 **Duplication** - Duplicate workouts and routines
- 🎯 **Drag & Drop** - Reorder exercises in routines
- ⏱️ **Rest Timer** - Built-in rest period timer
- 🧮 **1RM Calculator** - Calculate one-rep max and training percentages

### 🚀 Future Enhancements
- 🤖 AI-powered workout recommendations
- 👥 Social features (follow friends, share workouts)
- 🏆 Achievements and badges
- 📤 Export data (CSV, PDF)
- 🌍 Multi-language support
- 🔗 Integrations (Google Fit, Apple Health)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [Vercel](https://vercel.com/) - Hosting platform

## 🐛 Common Issues & Solutions

### Issue: "Module not found" errors
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Environment variables not working
**Solution**: 
- Restart the dev server after changing `.env.local`
- Ensure variables start with `NEXT_PUBLIC_`
- Check for extra spaces or quotes

### Issue: Database connection errors
**Solution**: 
- Verify Supabase credentials in `.env.local`
- Check that your Supabase project is active
- Ensure SQL migration was run successfully

### Issue: Build fails with TypeScript errors
**Solution**: 
```bash
rm -rf .next
npm run build
```

### Issue: Authentication not working
**Solution**: 
- Clear browser cookies and cache
- Check Supabase Auth is enabled in dashboard
- Verify redirect URLs are configured

## 📧 Support

- 🐛 [Open an issue](https://github.com/yourusername/fittrackr/issues)
- 📖 Check [INSTALLATION.md](INSTALLATION.md) for detailed setup
- 📖 Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
- 💬 Supabase Discord: https://discord.supabase.com
- 💬 Next.js Discussions: https://github.com/vercel/next.js/discussions

## 🌟 Show Your Support

If you find this project helpful:
- ⭐ Star this repository
- 🐛 Report bugs or request features
- 🤝 Contribute improvements
- 📢 Share with others

---

**Built with ❤️ and TypeScript**

Happy training! 💪🏋️‍♂️

## 📝 Changelog

### v3.0.0 (PWA Edition) - Latest
- ✅ **PWA Support** - Installable as native app
- ✅ **Offline Mode** - Full offline functionality with IndexedDB
- ✅ **Notifications** - Reminders for scheduled workout routines
- ✅ **Multimedia** - Support for exercise images, videos, and GIFs
- ✅ **Service Worker** - Intelligent caching strategies
- ✅ **Auto-sync** - Automatic synchronization when coming online

### v2.0.0 (Full Featured)
- ✅ **Advanced Charts** - Volume progression, muscle distribution, top exercises
- ✅ **Advanced Filtering** - Filter workouts by date, duration, notes
- ✅ **Duplication** - Duplicate workouts and routines
- ✅ **Exercise Statistics** - Detailed stats per exercise
- ✅ **Rest Timer** - Built-in rest period timer
- ✅ **1RM Calculator** - Calculate one-rep max and percentages
- ✅ **Drag & Drop** - Reorder exercises in routines
- ✅ **Routine Scheduling** - Frequency and scheduled days

### v1.0.0 (Initial Release)
- ✅ Complete authentication system
- ✅ Workout tracking with exercises and sets
- ✅ Exercise catalog with filtering
- ✅ Dashboard with statistics
- ✅ Profile management
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Full TypeScript coverage
- ✅ SOLID principles implementation
- ✅ Clean architecture with repository pattern

