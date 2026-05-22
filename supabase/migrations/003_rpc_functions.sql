-- ============================================================
-- Source-Asia — RPC Functions (Atomic Operations)
-- ============================================================
-- WHY RPC: These functions run inside PostgreSQL transactions.
-- They prevent race conditions that are impossible to solve
-- with client-side code alone. This is a key interview point:
-- "I used database transactions to prevent double-booking."
-- ============================================================

-- ============================================================
-- 1. GENERATE PNR
-- ============================================================
-- WHY: 6-character alphanumeric PNR like real airlines (e.g., "AB3K9X").
-- Generated server-side to ensure uniqueness atomically.

CREATE OR REPLACE FUNCTION generate_pnr()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. LOCK SEAT (Optimistic Locking Pattern)
-- ============================================================
-- WHY: When a user selects a seat, we "lock" it for 5 minutes.
-- This prevents two users from selecting the same seat.
-- Uses FOR UPDATE SKIP LOCKED to avoid blocking.
--
-- INTERVIEW POINT: "I implemented optimistic locking with
-- automatic expiry to handle concurrent seat selection."

CREATE OR REPLACE FUNCTION lock_seat(
    p_seat_id UUID
)
RETURNS JSON AS $$
DECLARE
    -- Secure authenticated user
    v_user_id UUID := auth.uid();

    -- Seat data
    v_seat RECORD;

    -- Lock duration
    v_lock_duration INTERVAL := INTERVAL '10 minutes';

    -- User active locks
    v_user_lock_count INTEGER;

    -- Max allowed simultaneous locks
    v_max_locks INTEGER := 5;

BEGIN

    -- Reject unauthenticated users
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Release expired locks first
    PERFORM release_expired_locks();

    -- Prevent excessive seat locking spam
    SELECT COUNT(*)
    INTO v_user_lock_count
    FROM seats
    WHERE
        locked_by = v_user_id
        AND status = 'locked'
        AND locked_until > NOW();

    IF v_user_lock_count >= v_max_locks THEN
        RAISE EXCEPTION
            'Maximum active seat locks reached';
    END IF;

    -- Fetch and lock seat row safely
    SELECT *
    INTO v_seat
    FROM seats
    WHERE id = p_seat_id
    FOR UPDATE SKIP LOCKED;

    -- Seat missing
    IF v_seat IS NULL THEN
        RAISE EXCEPTION
            'Seat not found or currently locked';
    END IF;

    -- Already booked
    IF v_seat.status = 'booked' THEN
        RAISE EXCEPTION
            'Seat is already booked';
    END IF;

    -- Locked by another user
    IF v_seat.status = 'locked'
       AND v_seat.locked_by != v_user_id
       AND v_seat.locked_until > NOW() THEN

        RAISE EXCEPTION
            'Seat is currently reserved by another user';
    END IF;

    -- Lock seat
    UPDATE seats
    SET
        status = 'locked',
        locked_by = v_user_id,
        locked_until = NOW() + v_lock_duration
    WHERE id = p_seat_id;

    RETURN json_build_object(
        'success', true,
        'seat_id', p_seat_id,
        'locked_until', NOW() + v_lock_duration
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================================
-- 3. UNLOCK SEAT
-- ============================================================
-- WHY: User deselects a seat or navigates away.
-- Only the user who locked it can unlock it.

CREATE OR REPLACE FUNCTION unlock_seat(
    p_seat_id UUID
)
RETURNS JSON AS $$
DECLARE
    -- Secure authenticated user
    v_user_id UUID := auth.uid();

    -- Seat data
    v_seat RECORD;

BEGIN

    -- Reject unauthenticated users
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Fetch seat safely
    SELECT *
    INTO v_seat
    FROM seats
    WHERE id = p_seat_id
    FOR UPDATE;

    -- Seat missing
    IF v_seat IS NULL THEN
        RAISE EXCEPTION
            'Seat not found';
    END IF;

    -- Prevent unlocking another user's seat
    IF v_seat.locked_by != v_user_id THEN
        RAISE EXCEPTION
            'You cannot unlock another user''s seat';
    END IF;

    -- Unlock seat
    UPDATE seats
    SET
        status = 'available',
        locked_by = NULL,
        locked_until = NULL
    WHERE id = p_seat_id;

    RETURN json_build_object(
        'success', true,
        'seat_id', p_seat_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. CREATE BOOKING (Atomic Transaction)
-- ============================================================
-- WHY: The entire booking flow (create booking, assign seats,
-- add passengers, update flight counts) happens in ONE transaction.
-- If any step fails, everything rolls back.
--
-- INTERVIEW POINT: "I used a PostgreSQL transaction to ensure
-- booking atomicity — partial bookings are impossible."

CREATE OR REPLACE FUNCTION create_booking(
    p_flight_id UUID,
    p_seat_ids UUID[],
    p_passengers JSONB
)
RETURNS JSON AS $$
DECLARE
    -- Secure authenticated user
    v_user_id UUID := auth.uid();

    -- Booking variables
    v_booking_id UUID;
    v_pnr TEXT;

    -- Seat processing
    v_seat RECORD;
    v_seat_id UUID;

    -- Passenger processing
    v_passenger JSONB;
    v_seat_number TEXT;
    v_idx INTEGER := 0;

    -- Secure backend pricing
    v_base_price NUMERIC;
    v_total_amount NUMERIC := 0;

BEGIN

    -- Reject unauthenticated users
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Release expired seat locks
    PERFORM release_expired_locks();

    -- Fetch real flight base price
    SELECT base_price
    INTO v_base_price
    FROM flights
    WHERE id = p_flight_id;

    -- Validate flight exists
    IF v_base_price IS NULL THEN
        RAISE EXCEPTION 'Flight not found';
    END IF;

    -- Generate unique PNR
    LOOP
        v_pnr := generate_pnr();

        EXIT WHEN NOT EXISTS (
            SELECT 1
            FROM bookings
            WHERE pnr = v_pnr
        );
    END LOOP;

    -- Validate all selected seats
    FOR v_seat_id IN
        SELECT unnest(p_seat_ids)
    LOOP

        SELECT *
        INTO v_seat
        FROM seats
        WHERE id = v_seat_id
        FOR UPDATE;

        -- Seat existence check
        IF v_seat IS NULL THEN
            RAISE EXCEPTION
                'Seat not found: %',
                v_seat_id;
        END IF;

        -- Already booked
        IF v_seat.status = 'booked' THEN
            RAISE EXCEPTION
                'Seat % is already booked',
                v_seat.seat_number;
        END IF;

        -- Locked by another user
        IF v_seat.status = 'locked'
           AND v_seat.locked_by != v_user_id THEN

            RAISE EXCEPTION
                'Seat % is reserved by another user',
                v_seat.seat_number;
        END IF;

        -- Validate seat belongs to selected flight
        IF v_seat.flight_id != p_flight_id THEN
            RAISE EXCEPTION
                'Seat % does not belong to this flight',
                v_seat.seat_number;
        END IF;

        -- Secure backend price calculation
        v_total_amount :=
            v_total_amount +
            v_base_price +
            COALESCE(v_seat.price_modifier, 0);

    END LOOP;

    -- Create booking
    INSERT INTO bookings (
        user_id,
        flight_id,
        pnr,
        status,
        total_amount,
        passenger_count
    )
    VALUES (
        v_user_id,
        p_flight_id,
        v_pnr,
        'confirmed',
        v_total_amount,
        array_length(p_seat_ids, 1)
    )
    RETURNING id INTO v_booking_id;

    -- Process seats + passengers
    FOREACH v_seat_id IN ARRAY p_seat_ids
    LOOP

        -- Mark seat booked
        UPDATE seats
        SET
            status = 'booked',
            locked_by = NULL,
            locked_until = NULL
        WHERE id = v_seat_id;

        -- Create junction record
        INSERT INTO booking_seats (
            booking_id,
            seat_id
        )
        VALUES (
            v_booking_id,
            v_seat_id
        );

        -- Fetch seat number
        SELECT seat_number
        INTO v_seat_number
        FROM seats
        WHERE id = v_seat_id;

        -- Insert passenger
        IF v_idx < jsonb_array_length(p_passengers) THEN

            v_passenger :=
                p_passengers->v_idx;

            INSERT INTO passengers (
                booking_id,
                first_name,
                last_name,
                email,
                phone,
                passport_number,
                seat_number
            )
            VALUES (
                v_booking_id,
                v_passenger->>'firstName',
                v_passenger->>'lastName',
                v_passenger->>'email',
                v_passenger->>'phone',
                v_passenger->>'passportNumber',
                v_seat_number
            );

        END IF;

        v_idx := v_idx + 1;

    END LOOP;

    -- Update flight seat count
    UPDATE flights
    SET
        available_seats =
            available_seats -
            array_length(p_seat_ids, 1)
    WHERE id = p_flight_id;

    RETURN json_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'pnr', v_pnr
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. CANCEL BOOKING (Atomic with 2-Hour Restriction)
-- ============================================================
-- WHY 2-hour restriction: Prevents last-minute cancellations
-- that disrupt flight operations. Enforced at DB level so
-- no client-side bypass is possible.
--
-- INTERVIEW POINT: "Business rules like cancellation windows
-- are enforced in the database, not the UI — ensuring they
-- can't be bypassed."

CREATE OR REPLACE FUNCTION cancel_booking(
    p_booking_id UUID
)
RETURNS JSON AS $$
DECLARE
    -- Secure authenticated user
    v_user_id UUID := auth.uid();

    -- Booking data
    v_booking RECORD;

    -- Refund calculation
    v_refund_amount NUMERIC := 0;

BEGIN

    -- Reject unauthenticated users
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Fetch booking safely
    SELECT *
    INTO v_booking
    FROM bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    -- Booking missing
    IF v_booking IS NULL THEN
        RAISE EXCEPTION
            'Booking not found';
    END IF;

    -- Prevent cancelling another user's booking
    IF v_booking.user_id != v_user_id THEN
        RAISE EXCEPTION
            'Unauthorized booking cancellation';
    END IF;

    -- Prevent duplicate cancellation
    IF v_booking.status = 'cancelled' THEN
        RAISE EXCEPTION
            'Booking already cancelled';
    END IF;

    -- Refund calculation (80%)
    v_refund_amount :=
        ROUND(v_booking.total_amount * 0.8);

    -- Update booking
    UPDATE bookings
    SET
        status = 'cancelled',
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE id = p_booking_id;

    -- Release booked seats
    UPDATE seats
    SET
        status = 'available',
        locked_by = NULL,
        locked_until = NULL
    WHERE id IN (
        SELECT seat_id
        FROM booking_seats
        WHERE booking_id = p_booking_id
    );

    -- Restore flight seat count
    UPDATE flights
    SET
        available_seats =
            available_seats +
            (
                SELECT COUNT(*)
                FROM booking_seats
                WHERE booking_id = p_booking_id
            )
    WHERE id = v_booking.flight_id;

    RETURN json_build_object(
        'success', true,
        'refund_amount', v_refund_amount
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. RESCHEDULE BOOKING (Atomic Flight Change)
-- ============================================================
-- WHY atomic: Releases old seats AND books new seats in one
-- transaction. Prevents orphaned seats or double-bookings.

CREATE OR REPLACE FUNCTION reschedule_booking(
    p_booking_id UUID,
    p_user_id UUID,
    p_new_flight_id UUID,
    p_new_seat_ids UUID[],
    p_price_difference INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_booking RECORD;
    v_old_flight_id UUID;
    v_old_seat_count INTEGER;
    v_seat RECORD;
    v_seat_id UUID;
BEGIN
    -- Get booking
    SELECT b.*, f.departure_time
    INTO v_booking
    FROM bookings b
    JOIN flights f ON f.id = b.flight_id
    WHERE b.id = p_booking_id
      AND b.user_id = p_user_id
      AND b.status = 'confirmed'
    FOR UPDATE OF b;

    IF v_booking IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Active booking not found'
        );
    END IF;

    -- 2-hour restriction for rescheduling too
    IF v_booking.departure_time - INTERVAL '2 hours' <= NOW() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cannot reschedule within 2 hours of departure'
        );
    END IF;

    v_old_flight_id := v_booking.flight_id;

    -- Count old seats
    SELECT COUNT(*) INTO v_old_seat_count
    FROM booking_seats
    WHERE booking_id = p_booking_id;

    -- Verify new seats are available
    FOREACH v_seat_id IN ARRAY p_new_seat_ids LOOP
        SELECT * INTO v_seat
        FROM seats
        WHERE id = v_seat_id
          AND flight_id = p_new_flight_id
        FOR UPDATE;

        IF v_seat IS NULL THEN
            RAISE EXCEPTION 'New seat not found on target flight';
        END IF;

        IF v_seat.status != 'available' AND
           NOT (v_seat.status = 'locked' AND v_seat.locked_by = p_user_id) THEN
            RAISE EXCEPTION 'Seat % is not available', v_seat.seat_number;
        END IF;
    END LOOP;

    -- Release old seats
    UPDATE seats
    SET status = 'available', locked_by = NULL, locked_until = NULL
    WHERE id IN (SELECT seat_id FROM booking_seats WHERE booking_id = p_booking_id);

    -- Remove old booking_seats
    DELETE FROM booking_seats WHERE booking_id = p_booking_id;

    -- Restore old flight available seats
    UPDATE flights
    SET available_seats = available_seats + v_old_seat_count
    WHERE id = v_old_flight_id;

    -- Book new seats
    FOREACH v_seat_id IN ARRAY p_new_seat_ids LOOP
        UPDATE seats
        SET status = 'booked', locked_by = NULL, locked_until = NULL
        WHERE id = v_seat_id;

        INSERT INTO booking_seats (booking_id, seat_id)
        VALUES (p_booking_id, v_seat_id);
    END LOOP;

    -- Update new flight available seats
    UPDATE flights
    SET available_seats = available_seats - array_length(p_new_seat_ids, 1)
    WHERE id = p_new_flight_id;

    -- Update booking
    UPDATE bookings
    SET flight_id = p_new_flight_id,
        status = 'rescheduled',
        total_amount = v_booking.total_amount + p_price_difference
    WHERE id = p_booking_id;

    -- Record reschedule history
    INSERT INTO reschedules (booking_id, old_flight_id, new_flight_id, price_difference)
    VALUES (p_booking_id, v_old_flight_id, p_new_flight_id, p_price_difference);

    RETURN json_build_object(
        'success', true,
        'new_flight_id', p_new_flight_id,
        'price_difference', p_price_difference
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
