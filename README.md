# ✈️ Source Asia — Flight Management PWA

A high-performance, production-grade flight management web application engineered with **Next.js 14+ (App Router)**, **Supabase SSR**, and **Zustand**. Designed with a premium dark-themed airline design system and built as a fully installable Progressive Web Application (PWA).

---

## 🚀 Key Capabilities & Core Features

### 1. 💺 High-Concurrency Real-Time Seat Locking & Map
- **Race Condition Prevention**: Employs atomic database transactions and `SELECT FOR UPDATE` locks via custom PostgreSQL RPC functions to ensure two users can never lock or book the same seat simultaneously.
- **Supabase Realtime Sync**: Integrates live Postgres subscriptions inside the React interactive seat map. Seat statuses (locked, booked, available) update dynamically across all connected browsers within milliseconds.
- **Zone & Class Mapping**: Beautiful visual layout reflecting Airbus A320-style maps complete with distinct design zones for **First Class**, **Business Class**, **Economy Class**, **Exit Rows**, and visual cabin features (aircraft nose and tail).

### 2. 🔒 Secure Supabase Backend & Database Architecture
- **Row-Level Security (RLS)**: Comprehensive security rules applied on all tables (`bookings`, `passengers`, `seats`, `reschedules`). Users can only access, view, or manage their own reservations.
- **Relational Integrity**: Built on fully normalized relational schemas containing strict enum constraints (`booking_status`, `seat_class`, `flight_status`), foreign key constraints, and cascade-on-delete handlers.
- **Encapsulated Business Logic**: The 2-hour cancellation buffer, passenger validation, and seat allocation live directly in the database as transactional RPCs, eliminating potential client-side bypasses.

### 3. 🌐 Cookie-Based SSR Auth & Router Protection
- **Dual-Session Sync**: Combines client-side reactive auth via Zustand state sync with server-side secure cookie authentication via `@supabase/ssr`.
- **Next.js Middleware Routing**: Automatically intercepts protected pages (e.g., `/bookings`, `/booking/seats`) on the Edge. Unauthenticated users are gracefully redirected to `/login` with smart return-url redirection.

### 4. 📴 PWA & Offline reliability
- **Installable Native Experience**: Standardized `manifest.json` and high-fidelity flat design icons allow users to install the app on iOS, Android, or Desktop.
- **Custom Service Worker**: Implements a robust Network-First caching strategy for network requests, coupled with Cache-First strategies for static web page assets (JS, CSS, Fonts).
- **Graceful Offline Fallback**: Redirects navigation failures to a tailored, premium `/offline` screen with immediate navigation back to cached bookings.

### 5. 💎 Sleek Glassmorphism UI Design System
- **Next-Gen Aesthetics**: Clean dark-mode UI inspired by Vercel & Linear, featuring vibrant gradients, sleek borders, smooth card scaling, and active glowing hover effects.
- **Shimmer Skeletons**: Tailored loading skeletons for flights search results and bookings lists prevent layout shifts (CLS) and provide premium perceived speed.
- **PII Leak Prevention**: Leverages Zustand `partialize` configuration to sanitize and strip highly sensitive data (like passenger passport numbers) before caching state in localStorage.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Utility |
| :--- | :--- | :--- |
| **Framework** | Next.js 14+ (App Router) | Server Components (RSC), Suspense Streaming, Edge Middleware |
| **Database** | PostgreSQL + Supabase | Row-Level Security, RPC Transactions, Realtime Listeners |
| **State** | Zustand + Middleware | Persisted Search/Booking states, partialize security filter |
| **Styling** | Vanilla CSS + Tailwind CSS | Responsive grids, glassmorphism templates, keyframe animations |
| **Validation** | Zod | Strictly-typed passenger forms, registration schemas, API guards |
| **Utility** | date-fns, sonner | High-efficiency date arithmetic, responsive toast system |

---

## 📂 Architecture & Folder Structure

```
src/
├── app/                  # Next.js App Router (Pages, layouts, middleware)
│   ├── booking/          # Multi-step booking flow (seats, passengers, confirmation)
│   ├── bookings/         # Active passenger dashboard (view, cancel)
│   ├── flights/          # Search results with SSR query pipelines
│   └── globals.css       # Premium Tailwind custom global variables & CSS animations
├── components/           # UI Elements & Component Architecture
│   ├── ui/               # Design system elements (buttons, badges, empty states, skeletons)
│   ├── layout/           # Global shell components (header, footer, auth-listener)
│   └── seats/            # Interactive Realtime Seat Map component
├── lib/                  # Deep system utilities
│   ├── supabase/         # Secure SSR Client / Server / Middleware instantiators
│   ├── constants.ts      # Domain constants (airports, pricing, aircraft models)
│   └── utils.ts          # Mathematical currency formats, date-fns formats
├── stores/               # Zustand Store Management
│   ├── auth-store.ts     # Session state React hooks
│   ├── booking-store.ts  # Volatile mult-step memory (cleaned on final checkout)
│   └── search-store.ts   # Persistent homepage query caches
└── types/                # Strict type models and databases configurations
```

---

## 🚀 Setting Up the Project Locally

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd Source-Asia
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Deploy Database Schema
Execute the SQL migrations found in `supabase/migrations/` (or apply the schema directly inside the Supabase SQL Editor console).

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your local flight dashboard!
