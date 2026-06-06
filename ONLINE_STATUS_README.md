# Dynamic Online/Offline Status Setup

## What's New
- ✅ Real-time online/offline status for all users
- ✅ Green/gray status indicators on chat list
- ✅ Automatic detection when users go online/offline
- ✅ Real-time updates using Supabase subscriptions

## Database Setup

Run the SQL in `create_user_status_table.sql` in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy and paste the contents of `create_user_status_table.sql`
4. Execute the query

This creates:
- `user_status` table with online/offline tracking
- Row Level Security policies
- Automatic timestamps

## How It Works

1. **AuthContext** - Automatically marks user as online when they log in, offline when they log out or app goes to background
2. **Chats Screen** - Shows real-time online status for each conversation partner with:
   - Green dot indicator (Online)
   - Gray dot indicator (Offline)
   - Status text ("● Online" or "● Offline")
3. **Real-time Updates** - All users see status changes instantly via Supabase subscriptions

## Features

- **Automatic Presence** - No manual action needed, status updates automatically
- **App State Tracking** - User marked offline when app goes to background
- **Real-time Sync** - All clients see status changes within seconds
- **Persistent** - Status persists across app restarts (until they log out)

## Testing

1. Open the app on two devices/emulators with different user accounts
2. Go to Chats screen
3. Observe the online status indicators
4. Close the app on one device - status should change to offline within seconds on the other device
