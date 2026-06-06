# My App - Real-time Chat & AI Assistant

A full-featured cross-platform messaging app with real-time chat, AI integration, and dynamic user presence tracking. Built with React Native and Expo for iOS, Android, and web.

## 🎯 Features

- **Real-time Messaging** - Instant message delivery with Supabase subscriptions
- **AI Chat** - Integrated Google Gemini AI for conversational assistance
- **User Presence** - Dynamic online/offline status with real-time updates
- **Avatar Upload** - Users can upload custom profile pictures
- **Cross-platform** - Native iOS/Android via Expo, plus web support
- **Authentication** - Secure user authentication with Supabase Auth
- **Beautiful UI** - Modern design with Tailwind CSS and NativeWind

## 🛠 Tech Stack

### Frontend
- **React Native** (0.81.5) - Mobile development framework
- **Expo** (54.0.30) - Framework for React Native
- **Expo Router** (6.0.21) - File-based navigation
- **NativeWind** (4.1.2) - Tailwind CSS for React Native
- **React Navigation** (7.x) - Tab and stack navigation
- **Expo Image Picker** - Native image selection

### Backend & Database
- **Supabase** - Backend as a Service (PostgreSQL + Auth + Real-time)
- **PostgreSQL** - Primary database
- **Supabase Storage** - File storage for avatars

### AI & APIs
- **Google Gemini API** - AI chat integration
- **React Native Reanimated** (4.1.1) - Smooth animations
- **Expo Secure Store** - Secure credential storage

### Styling
- **Tailwind CSS** (3.4.19) - Utility-first CSS
- **Expo Vector Icons** - Icon library

## 📱 Architecture

### Authentication Flow
```
User Login → Supabase Auth → Session Management → AuthContext
                ↓
         User Profile Created
                ↓
         Auto-marked as Online
```

### Real-time Messaging
```
Send Message → Supabase DB → Real-time Subscription → Broadcast to All Clients
```

### Presence Tracking
```
App Active → User Online → user_status table updated
                ↓
         Broadcast to all clients
                ↓
         Other users see status change (green/gray dot)
```

## 📁 Project Structure

```
my-app/
├── app/                          # Main app screens (file-based routing)
│   ├── _layout.tsx              # Root layout with AuthProvider
│   ├── index.tsx                # Entry point → Redirect to login
│   ├── login.tsx                # Login screen
│   ├── signup.tsx               # Signup screen
│   ├── globals.css              # Global styles with Tailwind
│   ├── (tabs)/                  # Tab navigation group
│   │   ├── _layout.tsx          # Tab layout with bottom navigation
│   │   ├── chats.tsx            # Main chat list with online status
│   │   ├── ai_chat.tsx          # AI chat with Gemini
│   │   └── settings.tsx         # User settings & profile
│   └── chat/                    # Chat details
│       ├── _layout.tsx          # Chat stack layout
│       └── [id].tsx             # Individual chat screen
├── components/                  # Reusable components (currently empty)
├── context/
│   └── AuthContext.tsx          # Auth state & presence tracking
├── lib/
│   ├── supabase.ts              # Supabase client initialization
│   ├── gemini.ts                # Google Gemini API integration
│   └── usePresence.ts           # Presence tracking hooks
├── package.json                 # Dependencies
├── tailwind.config.js           # Tailwind configuration
├── metro.config.js              # Metro bundler config
├── babel.config.js              # Babel configuration
├── nativewind-env.d.ts          # NativeWind type definitions
├── tsconfig.json                # TypeScript configuration
└── create_user_status_table.sql # Database migration for presence
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Supabase account (free tier available)
- Google Gemini API key

### Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment Variables**
Create `.env.local` in project root:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

3. **Database Setup**
Run the SQL migration in Supabase SQL Editor:
```sql
-- Copy contents from create_user_status_table.sql
```

4. **Start Development Server**
```bash
npm start
```

5. **Run on Device**
- **Android**: Press `a` in terminal
- **iOS**: Press `i` in terminal
- **Web**: Press `w` in terminal
- **Expo Go**: Scan QR code with Expo Go app

## 🗄 Database Schema

### Tables

**profiles**
```sql
id (uuid) → auth.users.id
email (text)
full_name (text)
avatar_url (text)
created_at (timestamp)
```

**messages**
```sql
id (uuid)
sender_id (uuid) → profiles.id
recipient_id (uuid) → profiles.id
content (text)
created_at (timestamp)
```

**user_status**
```sql
user_id (uuid) PRIMARY KEY → auth.users.id
is_online (boolean)
last_seen (timestamp)
created_at (timestamp)
updated_at (timestamp)
```

## 🔑 Key Features Explained

### 1. Real-time Chat
- Messages stored in `messages` table
- Supabase real-time subscriptions broadcast new messages
- Components automatically update on incoming messages
- Conversation history fetched on screen load

### 2. AI Integration
- Google Gemini API for intelligent responses
- Maintains conversation history per session
- Handles errors gracefully with user-friendly messages
- Integration in `lib/gemini.ts`

### 3. Dynamic Presence
- AuthContext tracks login/logout events
- App state changes (foreground/background) update status
- `user_status` table updated via upsert
- Real-time subscriptions push updates to all clients
- Green dot = Online, Gray dot = Offline

### 4. Avatar Upload
- Image picker allows users to select from device storage
- Uploaded to Supabase Storage (`avatars` bucket)
- Public URL stored in `profiles.avatar_url`
- Falls back to initials if no avatar

### 5. Navigation
- **Tabs**: Chats, AI Chat, Settings
- **Stacks**: Auth (Login/Signup), Chat Details
- Expo Router handles deep linking and file-based routing
- Protected routes via AuthContext

## 📊 State Management

- **AuthContext** - Global auth state and user presence
- **useState** - Local component state
- **Supabase Subscriptions** - Real-time updates
- **React Query patterns** - Data fetching and caching (via supabase client)

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Authenticated users can only access their own data
- Avatar storage has secure upload policies
- Session tokens stored securely with Expo Secure Store
- API keys in environment variables only

## 🎨 Styling

- **Tailwind CSS** - Utility-first CSS framework
- **NativeWind** - Brings Tailwind to React Native
- **Dark mode** - Built-in dark theme support
- **Responsive** - Works on all screen sizes

## 📱 Platforms

- **Android** - Native app via Expo
- **iOS** - Native app via Expo
- **Web** - React Native Web support
- Tested on Expo Go app

## 🐛 Troubleshooting

### Tailwind not applying
- Clear metro cache: `npm start --clear`
- Ensure `globals.css` is imported in `_layout.tsx`

### Presence not updating
- Execute `create_user_status_table.sql` in Supabase
- Check RLS policies allow your user role
- Verify real-time subscriptions are enabled

### Gemini API errors
- Verify API key in environment variables
- Check quota limits in Google Cloud Console
- Ensure API is enabled in project

## 📝 Environment Files

Create `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_GEMINI_API_KEY=AIza...
```

## 🚢 Deployment

### Android Build
```bash
expo build:android
```

### iOS Build
```bash
eas build --platform ios
```

### Web Deployment
```bash
npm run web
```

## 📚 Learn More

- [Expo Documentation](https://docs.expo.dev)
- [Supabase Docs](https://supabase.com/docs)
- [NativeWind Docs](https://www.nativewind.dev)
- [Google Gemini API](https://ai.google.dev)

## 📄 License

This project is open source and available under the MIT License.
