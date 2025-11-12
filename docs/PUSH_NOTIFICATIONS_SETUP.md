# 🔔 Push Notifications Setup Guide

This guide explains how to set up and configure push notifications for FitTrackr.

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase project configured
- HTTPS enabled (required for push notifications)

## 🔑 Step 1: Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required to authenticate your server with push notification services.

1. Install web-push (if not already installed):
```bash
npm install web-push --save
```

2. Generate VAPID keys:
```bash
npm run generate-vapid-keys
```

3. Copy the generated keys to your `.env.local` file:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

⚠️ **Important**: Never commit `VAPID_PRIVATE_KEY` to git! Keep it secret.

## 🗄️ Step 2: Create Database Table

Run the migration to create the `push_subscriptions` table:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the migration file: `supabase/migrations/create_push_subscriptions_table.sql`

Or use the Supabase CLI:
```bash
supabase db push
```

## 🔧 Step 3: Configure Service Worker

The service worker (`public/sw-push.js`) is already created and will handle incoming push notifications.

Make sure it's accessible at `/sw-push.js` in your deployment.

## ⚙️ Step 4: Configure Environment Variables

Add these to your `.env.local` (development) and Vercel environment variables (production):

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_EMAIL=mailto:your-email@example.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note**: `VAPID_EMAIL` is optional but recommended. It should be a `mailto:` URL with your contact email.

## ⏰ Step 5: Set Up Cron Job

To send scheduled notifications automatically, you need to set up a cron job that calls the schedule endpoint.

### Option A: Vercel Cron Jobs (Recommended)

1. Create `vercel.json` in your project root:
```json
{
  "crons": [
    {
      "path": "/api/push/schedule",
      "schedule": "0 8 * * *"
    }
  ]
}
```

This will call the endpoint every day at 8 AM UTC.

### Option B: External Cron Service

Use a service like:
- **cron-job.org** (free)
- **EasyCron** (free tier)
- **GitHub Actions** (free)

Configure it to call:
```
POST https://your-domain.com/api/push/schedule
```

Schedule: Daily at 8 AM (adjust timezone as needed)

### Option C: Supabase Edge Function

Create a Supabase Edge Function that runs on a schedule:

```typescript
// supabase/functions/send-notifications/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const response = await fetch('https://your-domain.com/api/push/schedule', {
    method: 'POST',
  })
  
  return new Response(JSON.stringify(await response.json()), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

Then set up a cron trigger in Supabase.

## 🧪 Step 6: Test Push Notifications

1. **Enable notifications in the app:**
   - Go to Settings/Profile
   - Click "Enable Notifications"
   - Grant permission when prompted

2. **Test notification:**
   - Click "Test Notification" button
   - You should receive a notification

3. **Test push subscription:**
   - The app will automatically subscribe to push notifications
   - Check the browser console for any errors
   - Verify subscription is saved in the database

4. **Test scheduled notifications:**
   - Create a routine with scheduled days
   - Wait for the scheduled time (or manually call `/api/push/schedule`)
   - You should receive a push notification

## 📱 How It Works

### User Flow

1. User enables notifications → Permission requested
2. Push subscription created → Saved to database
3. Routines scheduled → Backend tracks scheduled days
4. Cron job runs → Checks for routines due today
5. Push sent → Service Worker receives and displays notification

### Technical Flow

```
User Action → Push Service → API Route → Database
                                      ↓
Cron Job → Schedule API → Check Routines → Send Push → Service Worker → Notification
```

## 🔍 Troubleshooting

### Notifications not working?

1. **Check VAPID keys:**
   - Verify keys are set in environment variables
   - Make sure public key starts with the app URL

2. **Check Service Worker:**
   - Open DevTools → Application → Service Workers
   - Verify `sw-push.js` is registered
   - Check for errors

3. **Check permissions:**
   - Browser settings → Notifications
   - Make sure site is allowed

4. **Check database:**
   - Verify `push_subscriptions` table exists
   - Check if subscription is saved for your user

5. **Check cron job:**
   - Verify cron is configured correctly
   - Check logs for errors
   - Test endpoint manually: `GET /api/push/schedule`

### Common Issues

**"VAPID keys not configured"**
- Add keys to `.env.local` and restart dev server
- Add keys to Vercel environment variables

**"Service Worker registration failed"**
- Ensure HTTPS is enabled
- Check browser console for errors
- Verify `sw-push.js` is accessible

**"Push subscription failed"**
- Check browser support (Chrome, Firefox, Edge supported)
- Verify VAPID public key is correct
- Check network connectivity

**"Notifications not received"**
- Verify cron job is running
- Check if routine is active and has scheduled days
- Verify subscription exists in database
- Check server logs for errors

## 📚 API Endpoints

### POST `/api/push/subscribe`
Subscribe user to push notifications.

**Body:**
```json
{
  "endpoint": "https://...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

### POST `/api/push/unsubscribe`
Unsubscribe user from push notifications.

**Body:**
```json
{
  "endpoint": "https://..."
}
```

### POST `/api/push/send`
Send a push notification to a user.

**Body:**
```json
{
  "userId": "user-id",
  "title": "Notification Title",
  "body": "Notification body",
  "icon": "/icons/icon-192x192.png",
  "tag": "notification-tag",
  "data": {}
}
```

### POST `/api/push/schedule`
Schedule and send routine notifications (called by cron).

Automatically checks for routines scheduled for today and sends notifications.

## 🔐 Security Notes

- VAPID private key must be kept secret
- Only authenticated users can subscribe
- Row Level Security (RLS) protects subscription data
- Invalid subscriptions are automatically removed

## 📝 Next Steps

1. Generate VAPID keys
2. Run database migration
3. Configure environment variables
4. Set up cron job
5. Test notifications
6. Deploy to production

## 🆘 Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs
3. Verify all environment variables are set
4. Test endpoints manually
5. Review this documentation

