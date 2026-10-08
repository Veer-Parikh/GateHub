# NexGate — Frontend

Gated-community app for residents, security guards and service partners. Residents issue gate passes, approve visitors, pay maintenance, book plumbers and laundry, raise emergency SOS alerts, and earn points for being a good neighbour. Guards verify passes and log visitors. Partners manage their jobs.

Built with **Next.js 15 (App Router)**, React 19, TypeScript, Tailwind CSS and shadcn/ui. The API lives in the companion [`backend`](../backend) repo.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

You don't need a database or a backend. Open **/login** and pick a one-click demo account:

| Role | Name / password | Lands on |
|---|---|---|
| Resident (Arjun Mehta, A-304, RWA committee) | `Arjun` / `password123` | `/user` |
| Security guard (Vikram Singh) | `Vikram` / `password123` | `/security` |
| Plumber (Raju Sharma) | `Raju` / `password123` | `/plumber` |
| Laundry (FreshPress) | `FreshPress` / `password123` | `/laundry` |

### Try the live loop

Open the **resident dashboard** in one tab and the **guard console** in another (the sidebar has a "Guard console ↗" link):

1. In the guard console, **Check in** a visitor for Flat A-304. A notification with Approve/Decline appears in the resident tab instantly.
2. Issue a **gate pass** as the resident, then **Verify PIN** at the gate. Wrong, expired, used and revoked PINs are all rejected.
3. Press and hold an **SOS** button as the resident. The guard console sounds an alarm, and when the guard taps *Respond*, the resident sees who is coming.
4. **Book a plumber** as the resident, then open `/plumber` to start and complete the job. The resident gets notified and can rate it.

Use **Reset demo data** in the sidebar to return to the starting state.

## Features

- **Gate passes**: one-time 6-digit PINs with expiry, revoke, WhatsApp share and a live countdown.
- **Visitors**: approve or decline gate requests, see who is inside, check visitors out, and keep a full history.
- **Guard console**: PIN verification, visitor check-in, approval queue, overstay warnings, an exit log and SOS handling with an audible alarm.
- **Maintenance**: dues with a breakdown, demo checkout or Razorpay (live), printable receipts, and a committee ledger with reminders and CSV export.
- **Services**: book plumber or laundry partners, track a status timeline, cancel, rebook and rate. Partners get their own job console.
- **Emergency SOS**: press-and-hold to trigger (prevents accidental alerts), acknowledgement tracking and an emergency directory.
- **Marketplace**: buy, sell or give away to neighbours, with likes, mark-as-sold and WhatsApp contact.
- **Events & meetings**: RSVP, `.ics` calendar export, auto-generated Jitsi video links and published minutes.
- **Good Neighbour points**: points, levels, badges, a flat leaderboard and a tower cup.
- **Society analytics** (committee only): gate traffic by purpose, peak hours, collection rate and partner performance. Every chart has a table view.
- **Registration**: block → flat dropdowns from `GET /api/user/blocks` and `GET /api/user/rooms?block=X`.
- Light and dark mode, plus layouts that work on phones.

## Demo mode vs live mode

Each session is either **demo** or **live**:

- **Demo** (default): all data lives in one `localStorage` key (`nexgate:demo`). Every tab listens for `storage` events, so the role consoles stay in sync. Demo data is reseeded after 24 hours of inactivity.
- **Live**: signing in with real credentials while the backend is running. Visitors, maintenance, bookings, events and meetings then come from the API. Features the backend doesn't model yet (gate passes, marketplace, SOS, points) keep using the local store. Pages show a **Live** / **Demo data** badge.

Login falls back to demo mode only for the demo personas or when the server can't be reached. Wrong credentials against a running server show an error.

## Configuration

Copy `.env.example` to `.env.local`. Every value is optional:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL (default `http://localhost:5000`) |
| `RAZORPAY_KEY`, `RAZORPAY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY` | Real payments in live sessions |
| `ZOOM_API_KEY`, `ZOOM_API_SECRET` | `/api/zoom` meeting signatures |

## Project structure

```
src/
  app/                 routes: / (landing), /login, /register, /user/*, /security, /plumber, /laundry, /api/*
  components/
    app-shell.tsx      resident layout + console layout, cross-tab notifications
    sidebar.tsx        resident navigation with live badges
    page.tsx           PageHeader, Panel, StatCard, EmptyState
    charts.tsx         dependency-free SVG column chart + chart/table card
    service-console.tsx  shared plumber/laundry console
    ui/                shadcn/ui primitives
  lib/
    types.ts           domain types
    seed.ts            demo data (timestamps relative to "now")
    store.ts           localStorage store + useDemoState() (useSyncExternalStore)
    actions.ts         every demo mutation (visitors, passes, bills, bookings, SOS…)
    data.ts            per-domain hooks that switch between demo store and live API
    live.ts / api.ts   backend client and response mappers
    session.ts         demo/live session + personas
    gamification.ts    points rules, levels, badges, leaderboard
```

## Scripts

| Command | |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build (lint and type-check included) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
