# ✈️ Source-Asia Flight Management App

**📁 Repository:** [github.com/dhruvmohan867/source-asia](https://github.com/dhruvmohan867/source-asia)
**🔴 Live Demo:** [INSERT_VERCEL_LINK_HERE]

---

## 📌 Project Summary

Source-Asia Flight Management is a **production-grade, full-stack Progressive Web Application (PWA)** built for the Source Asia Frontend Internship Technical Assignment. It provides a highly concurrent, secure, and responsive flight booking experience.

- ✈️ **Flight Search** — Seamlessly filter by origin, destination, dates, and passenger counts.
- 💺 **Interactive Real-Time Seat Map** — Visual cabin grid (First, Business, Economy) that updates instantly across all connected clients via Supabase Realtime WebSockets.
- 🔒 **Race-Condition-Safe Booking** — Utilizes PostgreSQL `FOR UPDATE SKIP LOCKED` optimistic locking with a 10-minute expiry to guarantee no double-bookings.
- 📋 **Secure Passenger Details** — Collects necessary travel info while strictly ensuring PII (Passport Numbers) never touches unencrypted browser storage.
- 🎫 **Atomic Transactions** — Bookings, seat assignments, and PNR generation happen within single, atomic PostgreSQL RPC functions.
- 🔄 **Manage Bookings** — Users can reschedule flights or cancel tickets, with business logic strictly enforced at the database level.
- 🗃️ **Zustand Persistence** — Search and booking flow survives browser refreshes, leveraging `partialize` to exclude sensitive transient data.
- 📱 **Progressive Web App** — Installable, scores >=90 on Lighthouse, and utilizes `next-pwa` for offline readability and caching.
- 🛡️ **Ironclad RLS** — Database Row Level Security ensures users can only read and write their own data using strict `EXISTS` join checks.

**Tech Stack:** Next.js 14 (App Router) · Supabase (PostgreSQL + Auth + Realtime) · Zustand · Tailwind CSS · TypeScript · next-pwa

---

## 📸 App Screenshots

| Dashboard & Search | Realtime Seat Map |
|:---:|:---:|
| ![Search]([INSERT_IMAGE_LINK]) | ![Seat Map]([INSERT_IMAGE_LINK]) |

| Passenger Details | My Bookings Dashboard |
|:---:|:---:|
| ![Passenger]([INSERT_IMAGE_LINK]) | ![Dashboard]([INSERT_IMAGE_LINK]) |

| PWA Lighthouse Audit |
|:---:|
| ![Lighthouse]([INSERT_IMAGE_LINK]) |

---

## 🧪 Test Accounts (Ready to Use)

These accounts are pre-seeded in the database to test existing bookings, rescheduling, and cancellations immediately.

| Role | Email | Password |
|---|---|---|
| Primary User | `[INSERT_TEST_EMAIL_1]` | `[INSERT_TEST_PASS_1]` |
| Concurrent Tester | `[INSERT_TEST_EMAIL_2]` | `[INSERT_TEST_PASS_2]` |

> 💡 **Testing Race Conditions:** Open two incognito windows with different accounts. View the same flight and try to select the same seat simultaneously. The database's optimistic locking will successfully block the second attempt.

---

## 📋 Assignment Requirements Coverage

| Requirement | Status | Implementation Details |
|---|:---:|---|
| **User Auth** | ✅ | Supabase Auth integrated securely with Next.js |
| **Flight Search** | ✅ | Fetches matching routes, prices, and durations |
| **Interactive Seat Map** | ✅ | Fully responsive grid with hover tooltips and class colors |
| **Realtime Availability** | ✅ | Supabase `postgres_changes` channel on `seats` table |
| **Atomic Seat Locking** | ✅ | `lock_seat` RPC using `FOR UPDATE SKIP LOCKED` |
| **Passenger Form** | ✅ | Validates full name, passport, phone, and email |
| **Booking & PNR** | ✅ | `create_booking` RPC handles atomic multi-table inserts |
| **Cancel Booking** | ✅ | `cancel_booking` RPC atomically frees seats and refunds |
| **Reschedule Booking** | ✅ | Swaps flights and calculates price differences seamlessly |
| **My Bookings Page** | ✅ | Lists active/cancelled/rescheduled tickets with badges |
| **Row Level Security** | ✅ | Strictly implemented across all tables |
| **Zustand Stores** | ✅ | Separated `useFlightStore` and `useUserStore` |
| **PII Exclusion** | ✅ | `partialize` strictly excludes `passengers` array from local storage |
| **PWA Configured** | ✅ | Custom manifest, standalone mode, and caching strategies |
| **Offline Support** | ✅ | Fallback page and `StaleWhileRevalidate` caching |
| **TypeScript Code Quality** | ✅ | Strict typing throughout, leveraging Supabase generated types |

---

## 🏗️ Architecture & State Management

### State Management Separation
State is intentionally decoupled into two dedicated stores to balance user experience and security:

1. **`useFlightStore` (Booking Flow):**
   * Manages step-by-step progress (Flight -> Seats -> Passengers -> Payment).
   * **Security Focus:** Uses the `persist` and `partialize` middlewares to save search parameters and seat selections to `localStorage`, allowing tab recovery. Crucially, the `passengers` array is excluded to prevent Passport Number leakage.
2. **`useUserStore` (Session & Cache):**
   * **Security Focus:** Strictly persists *only* the `sessionToken`. All cached bookings and active user states remain in transient memory and are wiped entirely on logout.

### Database Operations (RPCs)
Complex business logic is pushed down to the PostgreSQL layer to ensure data integrity:
* `lock_seat` / `unlock_seat`: Optimistic locking with automatic expiration via `release_expired_locks()`.
* `create_booking`: A single transaction that generates a PNR, verifies seat locks, calculates total prices from the secure backend base price, updates flight capacity, and inserts passenger records.

---

## 🗃️ Database Schema & Security

**Tables:** `flights`, `seats`, `bookings`, `passengers`, `booking_seats` (junction), `reschedules`

**Security Highlights:**
* **Normalized Data:** Seat data is tracked in its own table to enable real-time UI subscriptions and row-level locking.
* **RLS Policies:** Child tables (like `passengers` and `booking_seats`) do not rely on trusting a client-provided `user_id`. Instead, RLS policies use joined `EXISTS` statements to verify the authenticated user owns the parent `bookings` record.

---

## ⚙️ Local Setup Instructions

### Prerequisites
* Node.js 18+
* Supabase CLI (`npm install -g supabase`)

### 1. Clone & Install
```bash
git clone [https://github.com/dhruvmohan867/source-asia.git](https://github.com/dhruvmohan867/source-asia.git)
cd source-asia
npm install
<<<<<<< HEAD
=======
2. Environment Configuration
Create a .env.local file based on the provided .env.example:

Code snippet
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
3. Database Migration & Seeding
Using the Supabase CLI, push the schema, RLS policies, and RPCs to your project:

Bash
npx supabase login
npx supabase link --project-ref your_project_id

npx supabase db push
npx supabase db reset # Seeds flights, seats, and test users
4. Run the Development Server
Bash
npm run dev
⚖️ Technical Trade-offs & Future Improvements
Cancellation 2-Hour Rule Enforcement: Currently, the UI disables the cancel button based on the 2-hour rule, and the database explicitly enforces this rule for rescheduling via the reschedule_booking RPC. Given more time, I would update the cancel_booking RPC to actively query the flights table and block cancellations at the DB level to prevent potential API bypasses.

Payment Processing Integration: The current application calculates pricing and immediately confirms bookings. In a real-world scenario, I would split the create_booking RPC to insert a booking with a pending_payment status, integrate Stripe webhooks, and confirm the booking asynchronously.

Database Polling for Expired Locks: Expired seat locks are currently released lazily whenever lock_seat or create_booking is called. For maximum efficiency, I would configure a pg_cron extension within Supabase to run release_expired_locks() every 60 seconds.

Built by Dhruv Mohan Shukla for the Source Asia Frontend Internship 
>>>>>>> 6cfd04d (made README structured as want)
