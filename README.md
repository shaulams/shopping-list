# 🛒 רשימת קניות משפחתית

A real-time collaborative family shopping list app in Hebrew with RTL support.

## Features

- ✅ Real-time sync between family members (Firebase Realtime Database)
- 📂 Organize items by categories (produce, meat, dairy, bakery, etc.)
- ☑️ Mark items as purchased with a tap
- 🔗 Share via link or 6-character list code
- 📱 Mobile-friendly responsive design
- 🇮🇱 Full Hebrew RTL layout

## Tech Stack

- **React + Vite** — Fast development & build
- **Firebase Realtime Database** — Real-time sync
- **Tailwind CSS** — Responsive RTL styling
- **Vercel** — Deployment

## Setup

### 1. Clone and install

```bash
git clone https://github.com/shaulams/shopping-list
cd shopping-list
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Realtime Database** (start in test mode)
4. Go to Project Settings → Your apps → Add web app
5. Copy the config values

### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your Firebase config values
```

### 4. Run locally

```bash
npm run dev
```

### 5. Deploy to Vercel

1. Push to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com)
3. Add environment variables (same as .env)
4. Deploy!

## Firebase Database Rules

Set these rules in Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "lists": {
      "$listId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

## Usage

1. Open the app
2. Click **"צור רשימה חדשה"** (Create new list)
3. Add items with categories
4. Share the link or code with your partner
5. Both can add, check off, and remove items in real time!

## Project Structure

```
src/
├── App.jsx          # Main app component
├── firebase.js      # Firebase configuration
├── main.jsx         # Entry point
└── index.css        # Global styles (Tailwind + RTL)
```
