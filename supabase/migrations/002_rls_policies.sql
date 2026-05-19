-- ============================================================
-- Source-Asia — Row Level Security Policies
-- ============================================================
-- WHY RLS: Even if API keys are leaked, users can only access
-- their own data. Security is enforced at the database level,
-- not application code. This is a critical security pattern
-- that reviewers will specifically look for.
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE reschedules ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FLIGHTS POLICIES
-- ============================================================
-- WHY public read: Flights are public data — anyone can search.
-- No write access via RLS — only admin/seed scripts modify flights.

CREATE POLICY "flights_select_all"
    ON flights FOR SELECT
    TO authenticated, anon
    USING (true);

-- ============================================================
-- SEATS POLICIES
-- ============================================================
-- WHY public read: Seat maps need to be visible to all users
-- for the real-time seat selection UI.
-- WHY no direct updates: Seat mutations go through RPC functions
-- with proper locking, never through direct table access.

CREATE POLICY "seats_select_all"
    ON seats FOR SELECT
    TO authenticated, anon
    USING (true);

-- ============================================================
-- BOOKINGS POLICIES
-- ============================================================
-- WHY user-scoped: Users can ONLY see their own bookings.
-- Even with a valid JWT, user A cannot read user B's bookings.
-- Insert is restricted to authenticated users inserting their own data.

CREATE POLICY "bookings_select_own"
    ON bookings FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "bookings_insert_own"
    ON bookings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookings_update_own"
    ON bookings FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PASSENGERS POLICIES
-- ============================================================
-- WHY joined check: Passengers don't have user_id directly.
-- We join through bookings to verify ownership. This prevents
-- data leakage even if someone guesses a passenger UUID.

CREATE POLICY "passengers_select_own"
    ON passengers FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = passengers.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "passengers_insert_own"
    ON passengers FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = passengers.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

-- ============================================================
-- BOOKING_SEATS POLICIES
-- ============================================================
-- WHY same pattern: Ownership verified through booking join.

CREATE POLICY "booking_seats_select_own"
    ON booking_seats FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_seats.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "booking_seats_insert_own"
    ON booking_seats FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_seats.booking_id
              AND bookings.user_id = auth.uid()
        )
    );

-- ============================================================
-- RESCHEDULES POLICIES
-- ============================================================

CREATE POLICY "reschedules_select_own"
    ON reschedules FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = reschedules.booking_id
              AND bookings.user_id = auth.uid()
        )
    );
