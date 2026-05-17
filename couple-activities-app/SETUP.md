# Gavin & Nicole — Activity App Setup

This takes about 15 minutes. You'll end up with a link you can both open on your phones.

---

## Step 1 — Firebase (the real-time backend)

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"** → name it `couple-activities` → click through the setup
3. In the left sidebar click **"Firestore Database"** → **"Create database"** → choose **"Start in test mode"** → pick a region (e.g. `eur3 (europe-west)`)
4. In the left sidebar click the **gear icon** → **"Project settings"**
5. Scroll down to **"Your apps"** → click the **`</>`** (Web) button → give it any nickname → click **"Register app"**
6. You'll see a config block like this — copy those values:

```js
apiKey: "AIzaSy...",
authDomain: "couple-activities-xxxxx.firebaseapp.com",
projectId: "couple-activities-xxxxx",
storageBucket: "couple-activities-xxxxx.appspot.com",
messagingSenderId: "123456789",
appId: "1:123456789:web:abcdef"
```

---

## Step 2 — Pexels API key (for real activity photos)

1. Go to **https://www.pexels.com/api/** → click **"Get Started"** (free, no credit card)
2. Create an account and you'll get an API key instantly
3. Copy the key — it looks like `563492ad6f91700001000001...`

---

## Step 3 — Deploy to Vercel

### First time setup

1. Install Vercel CLI: `npm install -g vercel`
2. In this folder run: `npm install`
3. Push this folder to a GitHub repo (or let Vercel import it directly)

### Deploy

```bash
vercel --prod
```

When it asks you questions, hit Enter to accept defaults.

### Add your environment variables in Vercel

After deploying, go to **vercel.com → your project → Settings → Environment Variables** and add:

| Name | Value | Notes |
|------|-------|-------|
| `VITE_FIREBASE_API_KEY` | your Firebase apiKey | |
| `VITE_FIREBASE_AUTH_DOMAIN` | your Firebase authDomain | |
| `VITE_FIREBASE_PROJECT_ID` | your Firebase projectId | |
| `VITE_FIREBASE_STORAGE_BUCKET` | your Firebase storageBucket | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | your Firebase messagingSenderId | |
| `VITE_FIREBASE_APP_ID` | your Firebase appId | |
| `PEXELS_KEY` | your Pexels API key | No `VITE_` prefix — stays server-side |

Then run `vercel --prod` again to redeploy with the variables.

You'll get a URL like **`https://couple-activities-xxxx.vercel.app`** — send that to Nicole!

---

## Step 4 (Optional) — Live Irish Events from Eventbrite

To get real, automatically-updating Irish events (concerts, festivals, experiences):

1. Go to **https://www.eventbrite.com/platform/api** → sign up for a free developer account
2. Get your **Private Token**
3. Add it to Vercel env vars: `EVENTBRITE_KEY` = your token
4. Redeploy: `vercel --prod`

Events will now appear at the top of the card stack, refreshed every hour.

---

## Local development

```bash
cp .env.example .env.local
# fill in your Firebase values and VITE_PEXELS_KEY in .env.local
npm install
npm run dev
```

---

## How the app works

- **Gavin** opens the URL on his phone, taps his name, and swipes
- **Nicole** opens the same URL on her phone, taps her name, and swipes  
- When both swipe right on the same thing → **instant match notification on both phones** 🎉
- Tap **❤️ Matches** to see all your matched activities with full details, tips, and images
- Swipes are saved permanently — close and reopen and you pick up where you left off
- The ⭐ Super Like counts as a stronger like (still creates a match if the other person likes it too)

## Adding new activities

Either:
- Ask me to add more to the `src/data/activities.js` file and redeploy
- Or (if you set up Eventbrite) they appear automatically
