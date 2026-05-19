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
    p_seat_id UUID,
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_seat RECORD;
    v_result JSON;
BEGIN
    -- First, release any expired locks
    PERFORM release_expired_locks();

    -- Try to acquire lock on the seat
    SELECT * INTO v_seat
    FROM seats
    WHERE id = p_seat_id
    FOR UPDATE SKIP LOCKED;

    -- Seat is being modified by another transaction
    IF v_seat IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Seat is currently being processed by another user'
        );
    END IF;

    -- Check if seat is available
    IF v_seat.status = 'booked' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Seat is already booked'
        );
    END IF;

    -- Check if locked by another user (and not expired)
    IF v_seat.status = 'locked' AND v_seat.locked_by != p_user_id AND v_seat.locked_until > NOW() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Seat is temporarily reserved by another user'
        );
    END IF;

    -- Lock the seat for this user (5 minute window)
    UPDATE seats
    SET status = 'locked',
        locked_by = p_user_id,
        locked_until = NOW() + INTERVAL '5 minutes'
    WHERE id = p_seat_id;

    RETURN json_build_object(
        'success', true,
        'seat_id', p_seat_id,
        'locked_until', (NOW() + INTERVAL '5 minutes')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. UNLOCK SEAT
-- ============================================================
-- WHY: User deselects a seat or navigates away.
-- Only the user who locked it can unlock it.

CREATE OR REPLACE FUNCTION unlock_seat(
    p_seat_id UUID,
    p_user_id UUID
)
RETURNS JSON AS $$
BEGIN
    UPDATE seats
    SET status = 'available',
        locked_by = NULL,
        locked_until = NULL
    WHERE id = p_seat_id
      AND locked_by = p_user_id
      AND status = 'locked';

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Seat not found or not locked by you'
        );
    END IF;

    RETURN json_build_object('success', true);
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
    p_user_id UUID,
    p_flight_id UUID,
    p_seat_ids UUID[],
    p_passengers JSONB,
    p_total_amount INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_booking_id UUID;
    v_pnr TEXT;
    v_seat RECORD;
    v_seat_id UUID;
    v_passenger JSONB;
    v_seat_number TEXT;
    v_idx INTEGER := 0;
BEGIN
    -- Release expired locks first
    PERFORM release_expired_locks();

    -- Generate unique PNR
    LOOP
        v_pnr := generate_pnr();
        EXIT WHEN NOT EXISTS (SELECT 1 FROM bookings WHERE pnr = v_pnr);
    END LOOP;

    -- Verify all seats are available or locked by this user
    FOR v_seat_id IN SELECT unnest(p_seat_ids) LOOP
        SELECT * INTO v_seat
        FROM seats
        WHERE id = v_seat_id
        FOR UPDATE;

        IF v_seat IS NULL THEN
            RAISE EXCEPTION 'Seat not found: %', v_seat_id;
        END IF;

        IF v_seat.status = 'booked' THEN
            RAISE EXCEPTION 'Seat % is already booked', v_seat.seat_number;
        END IF;

        IF v_seat.status = 'locked' AND v_seat.locked_by != p_user_id THEN
            RAISE EXCEPTION 'Seat % is reserved by another user', v_seat.seat_number;
        END IF;

        IF v_seat.flight_id != p_flight_id THEN
            RAISE EXCEPTION 'Seat % does not belong to this flight', v_seat.seat_number;
        END IF;
    END LOOP;

    -- Create booking record
    INSERT INTO bookings (user_id, flight_id, pnr, status, total_amount, passenger_count)
    VALUES (p_user_id, p_flight_id, v_pnr, 'confirmed', p_total_amount, array_length(p_seat_ids, 1))
    RETURNING id INTO v_booking_id;

    -- Book each seat and create booking_seats junction
    FOREACH v_seat_id IN ARRAY p_seat_ids LOOP
        -- Mark seat as booked
        UPDATE seats
        SET status = 'booked',
            locked_by = NULL,
            locked_until = NULL
        WHERE id = v_seat_id;

        -- Create junction record
        INSERT INTO booking_seats (booking_id, seat_id)
        VALUES (v_booking_id, v_seat_id);

        -- Get seat number for passenger assignment
        SELECT seat_number INTO v_seat_number
        FROM seats WHERE id = v_seat_id;

        -- Insert passenger with seat assignment
        IF v_idx < jsonb_array_length(p_passengers) THEN
            v_passenger := p_passengers->v_idx;
            INSERT INTO passengers (booking_id, first_name, last_name, email, phone, passport_number, seat_number)
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

    -- Update available seat count on flight
    UPDATE flights
    SET available_seats = available_seats - array_length(p_seat_ids, 1)
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
    p_booking_id UUID,
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_booking RECORD;
    v_seat RECORD;
    v_seat_count INTEGER;
BEGIN
    -- Get booking with lock
    SELECT b.*, f.departure_time
    INTO v_booking
    FROM bookings b
    JOIN flights f ON f.id = b.flight_id
    WHERE b.id = p_booking_id
      AND b.user_id = p_user_id
    FOR UPDATE OF b;

    IF v_booking IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Booking not found'
        );
    END IF;

    IF v_booking.status = 'cancelled' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Booking is already cancelled'
        );
    END IF;

    -- 2-hour cancellation restriction
    IF v_booking.departure_time - INTERVAL '2 hours' <= NOW() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cannot cancel within 2 hours of departure'
        );
    END IF;

    -- Count seats to release
    SELECT COUNT(*) INTO v_seat_count
    FROM booking_seats
    WHERE booking_id = p_booking_id;

    -- Release all seats
    UPDATE seats
    SET status = 'available',
        locked_by = NULL,
        locked_until = NULL
    WHERE id IN (
        SELECT seat_id FROM booking_seats
        WHERE booking_id = p_booking_id
    );

    -- Update booking status
    UPDATE bookings
    SET status = 'cancelled',
        cancelled_at = NOW()
    WHERE id = p_booking_id;

    -- Restore available seats on flight
    UPDATE flights
    SET available_seats = available_seats + v_seat_count
    WHERE id = v_booking.flight_id;

    RETURN json_build_object(
        'success', true,
        'refund_amount', v_booking.total_amount
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
