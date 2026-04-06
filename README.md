# 🕊️ WE VIBE — Collaborative YouTube Music Rooms

> *Vibe and Play, darling! Made with ❤️ by Team SPY*

Real-time collaborative music rooms — watch and listen to YouTube together in perfect sync, with live chat, AI-powered recommendations, and a host-controlled queue.

---

## ✨ Features

- 🎵 **Synchronized Playback** — YouTube IFrame Player synced across all participants
- 💬 **Live Chat** — Real-time messages with emoji reactions
- 🤖 **AI Recommendations** — Groq (LLaMA 3) reads your room's vibe and suggests tracks
- 🎛️ **Collaborative Queue** — Host-controlled, with optional participant access
- 🔗 **6-Digit Room Codes** — Instant room creation and joining
- 📺 **Music & Video Modes** — Switch between listening and watching
- ⭐ **Host Transfer** — Seamless handoff when host leaves
- 👥 **Up to 50 participants** per room, 100 tracks in queue

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + React 18 |
| Styling | Tailwind CSS + Custom Cyberpunk Theme |
| Auth | Firebase Authentication (Email + Google OAuth) |
| Database | Firebase Firestore (rooms, users, messages) |
| Realtime | Firebase Firestore listeners |
| Video | YouTube IFrame Player API + react-youtube |
| YouTube Search | YouTube Data API v3 |
| AI | Groq API (LLaMA 3 8B) |
| Hosting | Netlify + @netlify/plugin-nextjs |

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-repo/we-vibe.git
cd we-vibe
npm install
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env.local
```

Fill in your values in `.env.local`:

```bash
# Firebase — create a project at console.firebase.google.com
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=

# YouTube Data API v3 — console.cloud.google.com
YOUTUBE_API_KEY=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=

# Groq — console.groq.com
GROQ_API_KEY=

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password + Google
4. Enable **Firestore Database** (start in test mode)
5. Deploy security rules:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
we-vibe/
├── src/
│   ├── app/
│   │   ├── page.jsx                    # Landing page
│   │   ├── layout.jsx                  # Root layout (AuthProvider + Toaster)
│   │   ├── auth/
│   │   │   ├── signup/page.jsx         # Sign up
│   │   │   └── login/page.jsx          # Log in
│   │   ├── dashboard/page.jsx          # Create / Join room
│   │   ├── room/[roomId]/page.jsx      # Main room experience
│   │   ├── settings/page.jsx           # User settings
│   │   └── api/
│   │       ├── youtube/
│   │       │   ├── search/route.js     # YouTube search endpoint
│   │       │   ├── playlists/route.js  # User playlists endpoint
│   │       │   ├── oauth/route.js      # YouTube OAuth redirect
│   │       │   └── oauth/callback/     # OAuth callback handler
│   │       └── groq/
│   │           └── recommendations/    # AI track recommendations
│   ├── context/
│   │   └── AuthContext.jsx             # Global auth state
│   ├── lib/
│   │   ├── firebase.js                 # Firebase initialization
│   │   └── rooms.js                    # All room DB operations
│   └── styles/
│       └── globals.css                 # Global CSS + design system
├── firestore.rules                     # Firestore security rules
├── netlify.toml                        # Netlify deployment config
├── .env.example                        # Environment variable template
└── package.json
```

---

## 🎨 Design System

The app uses a **Cyberpunk Dark** aesthetic with CSS variables:

| Variable | Value | Usage |
|---|---|---|
| `--bg` | `#0d0d0d` | Main background |
| `--green` | `#00ff88` | Primary accent / neon |
| `--pink` | `#e91e63` | Danger / energy |
| `--cyan` | `#3498db` | Secondary accent |
| `--purple` | `#9b59b6` | Tertiary accent |
| `--border` | `rgba(0,255,136,0.15)` | Borders |

**Fonts:** Oswald (headings) + Work Sans (body)

**CSS Classes:** `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.input-vibe`, `.glass-card`, `.badge`, `.tab-btn`, `.neon-green`, `.glitch`

---

## 🌐 Deployment (Netlify)

1. Push to GitHub
2. Connect repo to [Netlify](https://netlify.com)
3. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Plugin:** `@netlify/plugin-nextjs` (auto-detected)
4. Add all environment variables in Netlify dashboard
5. Update Firebase authorized domains with your Netlify URL
6. Update YouTube OAuth redirect URIs with `https://your-site.netlify.app/api/youtube/oauth/callback`
7. Update `NEXT_PUBLIC_APP_URL` to your Netlify URL

---

## 🔑 API Keys Setup

### YouTube Data API v3
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **YouTube Data API v3**
3. Create **API Key** → add to `YOUTUBE_API_KEY`
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/youtube/oauth/callback`

### Groq API
1. Sign up at [console.groq.com](https://console.groq.com)
2. Generate API key → add to `GROQ_API_KEY`
3. Free tier is generous — no credit card needed

---

## 🏗️ Key Architecture Decisions

### Real-Time Sync
Room state lives in **Firestore**. All clients subscribe to `onSnapshot` on the room document. The host pushes playback state (isPlaying, currentTime, currentTrack) — participants receive it and seek/play/pause accordingly. Drift correction triggers if timestamp differs by >2 seconds.

### Host Transfer
When the host leaves, the participant with the earliest `joinedAt` timestamp automatically becomes the new host. If the last person leaves, the room document is deleted.

### Queue Ordering
Queue is stored as an ordered array in the room document. Firestore's `arrayUnion` handles concurrent adds. Host reorders/removes using full array replacement to avoid race conditions.

### Groq AI
Uses `llama3-8b-8192` model. Receives current track + next 5 queue titles + participant count. Returns JSON with 7 recommendations including reasoning. Each recommendation is searched on YouTube before adding to queue.

---

## 📋 Post-Deployment Checklist

- [ ] Firebase authorized domains → add Netlify URL
- [ ] YouTube OAuth redirect URIs → add Netlify callback URL
- [ ] All env variables set in Netlify dashboard
- [ ] `NEXT_PUBLIC_APP_URL` updated to production URL
- [ ] Firebase Firestore rules deployed
- [ ] Test full flow: signup → create room → join → play → chat → AI recs
- [ ] Test host transfer (host leaves mid-session)
- [ ] Test room cleanup (last person leaves)

---

## 🤝 Contributing

Built by **Team SPY**. PRs welcome!

---

*🕊️ Vibe and Play, darling! Made with ❤️ by Team SPY*
