# 🚌 Real-Time-Transport-Tracking-for-Small-Cities

> A production-ready, real-time bus tracking platform for small cities and rural areas — with three authenticated portals, live bus simulation, and a full Supabase backend.

![Tech Stack](https://img.shields.io/badge/React-TypeScript-blue?style=flat-square&logo=react)
![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38BDF8?style=flat-square&logo=tailwindcss)
![Leaflet](https://img.shields.io/badge/Maps-Leaflet.js-199900?style=flat-square&logo=leaflet)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## 📌 Overview

**Immersive Rural Transit Tracker** is a full-featured web platform that brings real-time bus tracking to underserved transit networks. It features three distinct authenticated user portals — **Public Commuter**, **Driver**, and **Admin** — backed by Supabase Edge Functions, a live bus simulation engine, and interactive 2D/3D map views.

Demo data is pre-seeded with **Bangalore, India** transit routes for instant exploration.

---

## ✨ Features

### 🧑‍💼 Three Authenticated Portals
| Portal | Role | Key Actions |
|---|---|---|
| **Public Commuter** | Passenger | Live bus tracking, ETAs, route filters, chat support |
| **Driver** | Assigned driver | Trip controls, occupancy updates, incident reporting |
| **Admin** | System operator | Bus/route/driver management, analytics, live oversight |

### 🗺️ Live Map Views
- **2D Map** — OpenStreetMap via Leaflet.js with persistent animated bus markers, route polylines, stop popups
- **3D View** — Custom SVG-based perspective renderer with drag-to-rotate, auto-rotate, zoom, and floating bus animations

### 🚍 Real-Time Bus Simulation
- Tick-based simulation engine at ~12fps (80ms interval)
- Haversine geometry for accurate distance/heading calculation
- Buses smoothly interpolate between stops along routes
- Dynamic ETA recalculation based on speed and remaining distance
- Server position sync with seamless segment re-anchoring

### 🔐 Authentication
- Email/password signup and login
- Google OAuth (Supabase)
- Role-based routing: `user → public`, `driver → driver`, `admin → admin`
- Persistent sessions with auto token refresh
- Driver invite code system for controlled onboarding

### 📊 Admin Dashboard
- KPI overview: active buses, open incidents, driver count
- Bus, route, and driver CRUD management
- Incident tracking with status workflow (open → in-progress → resolved)
- Analytics charts (Recharts): utilization, occupancy distribution, on-time performance
- Live tracking overview map
- Demo data seeder with one click

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Styling | Tailwind CSS v4 |
| Routing | react-router |
| Backend | Supabase Edge Functions (Hono) |
| Database | Supabase KV Store |
| Auth | Supabase Auth (email + Google OAuth) |
| Maps | Leaflet.js (CDN) |
| Icons | Lucide React |
| Animations | motion/react |
| Charts | Recharts |

---

## 🗂️ Project Structure

```
├── components/
│   ├── LandingPage.tsx          # Marketing home page
│   ├── LoginPortalSelector.tsx  # Portal entry selector
│   ├── PublicInterface.tsx      # Commuter tracking view
│   ├── DriverDashboard.tsx      # Driver controls
│   ├── AdminDashboard.tsx       # Admin tabbed interface
│   ├── OpenStreetMap.tsx        # 2D Leaflet map
│   ├── ThreeDView.tsx           # Custom SVG 3D renderer
│   ├── ChatSupport.tsx          # Simulated chat overlay
│   ├── debug-panel.tsx          # Dev debug panel
│   └── ui/                      # Full shadcn-style component library
├── hooks/
│   └── useBusSimulation.ts      # Core simulation engine
├── utils/
│   ├── auth.ts                  # Supabase auth helpers
│   └── api.ts                   # API layer with token refresh
├── types/
│   └── index.ts                 # Shared TypeScript types
├── data/
│   └── mockData.ts              # Bangalore demo seed data
├── styles/
│   └── globals.css              # Tailwind v4 + custom keyframes
└── supabase/
    └── functions/
        └── server/
            ├── index.tsx        # Hono Edge Function server
            └── kv_store.tsx     # Deno KV helpers
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone the repository
```bash
git clone https://github.com/your-username/rural-transit-tracker.git
cd rural-transit-tracker
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> ⚠️ Never commit your `.env` file. The app will show an **Environment Setup Modal** automatically if credentials are missing.

### 4. Deploy the Edge Function
```bash
supabase functions deploy server
```

### 5. Start the development server
```bash
npm run dev
```

### 6. Seed demo data
Once logged in as admin, open the **Debug Panel** (⚙️ bottom-right) and click **Init Demo Data** to populate Bangalore transit routes, buses, stops, and drivers.

---

## 🔑 Demo Credentials

After seeding demo data, use these test accounts:

| Role | Email | Password |
|---|---|---|
| Admin | admin@transit.demo | admin123 |
| Driver | driver@transit.demo | driver123 |
| Commuter | user@transit.demo | user123 |

> Driver accounts require a valid invite code — generate one from the Admin → Driver Management panel.

---

## 📍 Demo Data (Bangalore, India)

The seeded dataset includes:

- **8 Bus Stops**: Majestic Bus Station, MG Road Junction, Indiranagar Metro, Victoria Hospital, Commercial Street, Koramangala, Cubbon Park, Electronic City
- **3 Routes**: City Center Loop (blue), Hospital Express (green), IT Corridor Route (yellow)
- **4 Buses** with live speed, heading, occupancy, and ETA values
- **5 Drivers** assigned to buses
- **Sample Incidents**: delay, complaint, and breakdown reports

---

## 🧩 Key Architecture Decisions

### Dual-Header Auth Pattern
All API requests send:
- `Authorization: Bearer <anonKey>` — satisfies Supabase infrastructure
- `X-User-Token: <userJWT>` — read by Hono for role-based access control

### Infinite Loop Prevention
- `useMemo` stabilizes `filteredBuses` and `activeRoutes` arrays passed to the simulation hook
- The simulation's sync `useEffect` only mutates refs, never calls `setState`
- The animation interval has an empty dependency array and reads live data from refs

### Persistent Leaflet Markers
- Bus markers are stored in a `Map<busId, LeafletMarker>` ref
- Positions update via `marker.setLatLng()` in-place — never recreated per tick
- Rotation applied via DOM `style.transform` with CSS transition for smooth heading changes

### Token Refresh & Error Handling
- On any 401 response: attempt `supabase.auth.refreshSession()`, retry once
- On continued failure: sign out and dispatch `auth-expired` window event
- Clipboard writes always use `try/catch` with `document.execCommand('copy')` fallback

---


## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add: your feature description'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please ensure your code follows the existing TypeScript patterns and passes linting before submitting.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Supabase](https://supabase.com) — backend, auth, and edge functions
- [Leaflet.js](https://leafletjs.com) — open-source mapping
- [OpenStreetMap](https://www.openstreetmap.org) — map tile data
- [Lucide Icons](https://lucide.dev) — icon set
- [Recharts](https://recharts.org) — charting library

---

<p align="center">Built with ❤️ for better rural transit connectivity</p>
