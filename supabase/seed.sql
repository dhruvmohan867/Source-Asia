-- ============================================================
-- Source-Asia — Seed Data
-- ============================================================
-- Realistic flight data with proper seat maps for demo purposes.
-- Covers multiple routes, dates, and aircraft configurations.
-- ============================================================

-- ============================================================
-- FLIGHTS (Next 7 days from seed date)
-- ============================================================

INSERT INTO flights (id, flight_number, airline, origin, destination, departure_time, arrival_time, base_price, status, aircraft_type, total_seats, available_seats) VALUES
-- Delhi to Mumbai routes
('a1000000-0000-0000-0000-000000000001', 'SA-101', 'Source Asia', 'DEL', 'BOM', NOW() + INTERVAL '1 day' + INTERVAL '6 hours', NOW() + INTERVAL '1 day' + INTERVAL '8 hours 15 minutes', 4500, 'scheduled', 'A320', 180, 180),
('a1000000-0000-0000-0000-000000000002', 'SA-102', 'Source Asia', 'DEL', 'BOM', NOW() + INTERVAL '1 day' + INTERVAL '14 hours', NOW() + INTERVAL '1 day' + INTERVAL '16 hours 15 minutes', 5200, 'scheduled', 'A320', 180, 180),
('a1000000-0000-0000-0000-000000000003', 'SA-103', 'Source Asia', 'DEL', 'BOM', NOW() + INTERVAL '2 days' + INTERVAL '8 hours', NOW() + INTERVAL '2 days' + INTERVAL '10 hours 15 minutes', 3800, 'scheduled', 'A320', 180, 180),

-- Mumbai to Delhi routes
('a1000000-0000-0000-0000-000000000004', 'SA-201', 'Source Asia', 'BOM', 'DEL', NOW() + INTERVAL '1 day' + INTERVAL '7 hours', NOW() + INTERVAL '1 day' + INTERVAL '9 hours 15 minutes', 4800, 'scheduled', 'A320', 180, 180),
('a1000000-0000-0000-0000-000000000005', 'SA-202', 'Source Asia', 'BOM', 'DEL', NOW() + INTERVAL '2 days' + INTERVAL '18 hours', NOW() + INTERVAL '2 days' + INTERVAL '20 hours 15 minutes', 5500, 'scheduled', 'A320', 180, 180),

-- Delhi to Bangalore routes
('a1000000-0000-0000-0000-000000000006', 'SA-301', 'Source Asia', 'DEL', 'BLR', NOW() + INTERVAL '1 day' + INTERVAL '9 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours 45 minutes', 6200, 'scheduled', 'B737', 180, 180),
('a1000000-0000-0000-0000-000000000007', 'SA-302', 'Source Asia', 'DEL', 'BLR', NOW() + INTERVAL '3 days' + INTERVAL '12 hours', NOW() + INTERVAL '3 days' + INTERVAL '14 hours 45 minutes', 5800, 'scheduled', 'B737', 180, 180),

-- Bangalore to Delhi routes
('a1000000-0000-0000-0000-000000000008', 'SA-401', 'Source Asia', 'BLR', 'DEL', NOW() + INTERVAL '2 days' + INTERVAL '10 hours', NOW() + INTERVAL '2 days' + INTERVAL '12 hours 45 minutes', 6500, 'scheduled', 'B737', 180, 180),

-- Mumbai to Bangalore routes
('a1000000-0000-0000-0000-000000000009', 'SA-501', 'Source Asia', 'BOM', 'BLR', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', NOW() + INTERVAL '1 day' + INTERVAL '12 hours 30 minutes', 3500, 'scheduled', 'A320', 180, 180),
('a1000000-0000-0000-0000-000000000010', 'SA-502', 'Source Asia', 'BOM', 'BLR', NOW() + INTERVAL '4 days' + INTERVAL '15 hours', NOW() + INTERVAL '4 days' + INTERVAL '16 hours 30 minutes', 3200, 'scheduled', 'A320', 180, 180),

-- Hyderabad routes
('a1000000-0000-0000-0000-000000000011', 'SA-601', 'Source Asia', 'DEL', 'HYD', NOW() + INTERVAL '2 days' + INTERVAL '7 hours', NOW() + INTERVAL '2 days' + INTERVAL '9 hours 15 minutes', 5100, 'scheduled', 'A320', 180, 180),
('a1000000-0000-0000-0000-000000000012', 'SA-602', 'Source Asia', 'HYD', 'DEL', NOW() + INTERVAL '3 days' + INTERVAL '16 hours', NOW() + INTERVAL '3 days' + INTERVAL '18 hours 15 minutes', 5400, 'scheduled', 'A320', 180, 180),

-- Chennai routes
('a1000000-0000-0000-0000-000000000013', 'SA-701', 'Source Asia', 'BOM', 'MAA', NOW() + INTERVAL '1 day' + INTERVAL '13 hours', NOW() + INTERVAL '1 day' + INTERVAL '14 hours 45 minutes', 4100, 'scheduled', 'A320', 180, 180),
('a1000000-0000-0000-0000-000000000014', 'SA-702', 'Source Asia', 'MAA', 'BOM', NOW() + INTERVAL '3 days' + INTERVAL '8 hours', NOW() + INTERVAL '3 days' + INTERVAL '9 hours 45 minutes', 4300, 'scheduled', 'A320', 180, 180),

-- Kolkata routes
('a1000000-0000-0000-0000-000000000015', 'SA-801', 'Source Asia', 'DEL', 'CCU', NOW() + INTERVAL '2 days' + INTERVAL '6 hours', NOW() + INTERVAL '2 days' + INTERVAL '8 hours 30 minutes', 5800, 'scheduled', 'B737', 180, 180);

-- ============================================================
-- SEAT GENERATION FUNCTION
-- ============================================================
-- WHY function: Generates realistic A320 seat map programmatically.
-- Layout: Rows 1-3 (First, 4 seats/row), Rows 4-10 (Business, 6 seats/row),
-- Rows 11-30 (Economy, 6 seats/row)

CREATE OR REPLACE FUNCTION seed_seats_for_flight(p_flight_id UUID)
RETURNS void AS $$
DECLARE
    v_row INTEGER;
    v_col TEXT;
    v_cols_first TEXT[] := ARRAY['A', 'C', 'D', 'F'];
    v_cols_standard TEXT[] := ARRAY['A', 'B', 'C', 'D', 'E', 'F'];
    v_seat_class seat_class;
    v_price_mod INTEGER;
BEGIN
    -- First Class: Rows 1-3, columns A/C/D/F (aisle between C and D)
    FOR v_row IN 1..3 LOOP
        FOREACH v_col IN ARRAY v_cols_first LOOP
            INSERT INTO seats (flight_id, seat_number, seat_class, status, price_modifier)
            VALUES (p_flight_id, v_row || v_col, 'first', 'available', 3000);
        END LOOP;
    END LOOP;

    -- Business Class: Rows 4-10, all 6 columns
    FOR v_row IN 4..10 LOOP
        FOREACH v_col IN ARRAY v_cols_standard LOOP
            INSERT INTO seats (flight_id, seat_number, seat_class, status, price_modifier)
            VALUES (p_flight_id, v_row || v_col, 'business', 'available', 1500);
        END LOOP;
    END LOOP;

    -- Economy Class: Rows 11-30, all 6 columns
    FOR v_row IN 11..30 LOOP
        FOREACH v_col IN ARRAY v_cols_standard LOOP
            v_price_mod := 0;
            -- Window and exit row seats cost more
            IF v_col IN ('A', 'F') THEN
                v_price_mod := 300;
            END IF;
            IF v_row IN (11, 12) THEN  -- Exit rows
                v_price_mod := v_price_mod + 500;
            END IF;

            INSERT INTO seats (flight_id, seat_number, seat_class, status, price_modifier)
            VALUES (p_flight_id, v_row || v_col, 'economy', 'available', v_price_mod);
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate seats for all flights
SELECT seed_seats_for_flight(id) FROM flights;

-- Clean up the seed function (not needed in production)
DROP FUNCTION IF EXISTS seed_seats_for_flight;
