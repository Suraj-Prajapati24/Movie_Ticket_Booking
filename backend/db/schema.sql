-- ============================================================================
--  MovieJunction — PostgreSQL schema
--  A private theatre with 5 physical screens.
--
--  Run with:   psql -U <user> -d <database> -f backend/db/schema.sql
--
--  Design notes (see bottom of file for the full rationale):
--   * Seats are PHYSICAL and belong to a SCREEN, not to a show. A seat counts
--     as "booked" for a show only when a booking_seats row links them. This
--     removes the per-show seat duplication and lets the DB itself prevent
--     double-booking via UNIQUE (show_id, seat_id).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Clean slate (DESTRUCTIVE — drops existing data). Comment out in prod.
--    Dropped in reverse dependency order; CASCADE handles FKs/constraints.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS payments      CASCADE;
DROP TABLE IF EXISTS booking_seats CASCADE;
DROP TABLE IF EXISTS bookings      CASCADE;
DROP TABLE IF EXISTS seats         CASCADE;
DROP TABLE IF EXISTS shows         CASCADE;
DROP TABLE IF EXISTS screens       CASCADE;
DROP TABLE IF EXISTS movies        CASCADE;
DROP TABLE IF EXISTS users         CASCADE;

-- ---------------------------------------------------------------------------
-- 1. users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    user_id       SERIAL PRIMARY KEY,
    username      TEXT        NOT NULL,
    email         TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    role          TEXT        NOT NULL DEFAULT 'client'
                              CHECK (role IN ('client', 'manager')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. movies
-- ---------------------------------------------------------------------------
CREATE TABLE movies (
    movie_id         SERIAL PRIMARY KEY,
    title            TEXT        NOT NULL,
    description      TEXT,
    duration_minutes INTEGER     NOT NULL CHECK (duration_minutes > 0),
    language         TEXT,
    poster_url       TEXT,                       -- used by the <Poster> component
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. screens  (the 5 physical auditoriums)
-- ---------------------------------------------------------------------------
CREATE TABLE screens (
    screen_id     SERIAL PRIMARY KEY,
    screen_number INTEGER NOT NULL UNIQUE,       -- 1..5, what the UI displays
    name          TEXT    NOT NULL,
    total_rows    INTEGER NOT NULL CHECK (total_rows    > 0),
    seats_per_row INTEGER NOT NULL CHECK (seats_per_row > 0),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 4. seats  (physical seats; one fixed set per screen)
-- ---------------------------------------------------------------------------
CREATE TABLE seats (
    seat_id     SERIAL PRIMARY KEY,
    screen_id   INTEGER NOT NULL REFERENCES screens(screen_id) ON DELETE CASCADE,
    seat_number TEXT    NOT NULL,                -- e.g. 'A1'
    row_label   TEXT    NOT NULL,                -- e.g. 'A'
    seat_col    INTEGER NOT NULL,                -- e.g. 1
    UNIQUE (screen_id, seat_number)
);

-- ---------------------------------------------------------------------------
-- 5. shows  (a movie scheduled on a screen for a time window)
-- ---------------------------------------------------------------------------
CREATE TABLE shows (
    show_id    SERIAL PRIMARY KEY,
    movie_id   INTEGER   NOT NULL REFERENCES movies(movie_id)  ON DELETE CASCADE,
    screen_id  INTEGER   NOT NULL REFERENCES screens(screen_id) ON DELETE RESTRICT,
    start_time TIMESTAMP NOT NULL,               -- tz-naive: matches the app's local datetimes
    end_time   TIMESTAMP NOT NULL,
    price      NUMERIC(8,2) NOT NULL DEFAULT 200.00 CHECK (price >= 0),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CHECK (end_time > start_time)
);

-- ---------------------------------------------------------------------------
-- 6. bookings  (one row per checkout, owned by a user, for one show)
-- ---------------------------------------------------------------------------
CREATE TABLE bookings (
    booking_id   SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(user_id)  ON DELETE RESTRICT,
    show_id      INTEGER NOT NULL REFERENCES shows(show_id)  ON DELETE CASCADE,
    status       TEXT    NOT NULL DEFAULT 'confirmed'
                         CHECK (status IN ('confirmed', 'cancelled')),
    total_amount NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 7. booking_seats  (which physical seats a booking holds for a show)
--    UNIQUE (show_id, seat_id) is the heart of the design: the database
--    physically cannot let two bookings hold the same seat for the same show,
--    even under concurrent requests. This replaces the seats.is_booked flag.
-- ---------------------------------------------------------------------------
CREATE TABLE booking_seats (
    booking_seat_id SERIAL PRIMARY KEY,
    booking_id      INTEGER NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    show_id         INTEGER NOT NULL REFERENCES shows(show_id)       ON DELETE CASCADE,
    seat_id         INTEGER NOT NULL REFERENCES seats(seat_id)       ON DELETE RESTRICT,
    UNIQUE (show_id, seat_id)
);

-- ---------------------------------------------------------------------------
-- 8. payments  (one settled payment per booking; you have a PaymentModal)
-- ---------------------------------------------------------------------------
CREATE TABLE payments (
    payment_id      SERIAL PRIMARY KEY,
    booking_id      INTEGER NOT NULL UNIQUE REFERENCES bookings(booking_id) ON DELETE CASCADE,
    amount          NUMERIC(8,2) NOT NULL CHECK (amount >= 0),
    status          TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    method          TEXT,                        -- 'card', 'upi', ...
    transaction_ref TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 9. Indexes for the app's hot paths (FKs aren't auto-indexed in Postgres)
-- ---------------------------------------------------------------------------
CREATE INDEX idx_seats_screen          ON seats(screen_id);
CREATE INDEX idx_shows_movie           ON shows(movie_id);
CREATE INDEX idx_shows_screen          ON shows(screen_id);
CREATE INDEX idx_shows_start_time      ON shows(start_time);
CREATE INDEX idx_bookings_user         ON bookings(user_id);
CREATE INDEX idx_bookings_show         ON bookings(show_id);
CREATE INDEX idx_booking_seats_booking ON booking_seats(booking_id);
CREATE INDEX idx_booking_seats_seat    ON booking_seats(seat_id);

-- ============================================================================
--  SEED DATA — the 5 physical screens and their fixed seat layouts
-- ============================================================================
INSERT INTO screens (screen_number, name, total_rows, seats_per_row) VALUES
    (1, 'Screen 1 — Main Hall', 5, 8),   -- 40 seats
    (2, 'Screen 2 — Premium',   5, 8),   -- 40 seats
    (3, 'Screen 3 — Balcony',   4, 6),   -- 24 seats
    (4, 'Screen 4 — Lounge',    4, 6),   -- 24 seats
    (5, 'Screen 5 — Mini',      3, 6)    -- 18 seats (matches the original layout)
ON CONFLICT (screen_number) DO NOTHING;

-- Generate physical seats for every screen from its rows × cols.
-- Row 1 -> 'A', row 2 -> 'B', ...  Seat numbers look like 'A1', 'B7', etc.
DO $$
DECLARE
    s          RECORD;
    r          INTEGER;
    c          INTEGER;
    row_letter TEXT;
BEGIN
    FOR s IN SELECT screen_id, total_rows, seats_per_row FROM screens LOOP
        FOR r IN 1..s.total_rows LOOP
            row_letter := chr(64 + r);           -- 64 + 1 = 65 = 'A'
            FOR c IN 1..s.seats_per_row LOOP
                INSERT INTO seats (screen_id, seat_number, row_label, seat_col)
                VALUES (s.screen_id, row_letter || c, row_letter, c)
                ON CONFLICT (screen_id, seat_number) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
--  OPTIONAL — DB-enforced "no two shows overlap on the same screen".
--  Your createShow() currently checks this in JS with a SELECT; an EXCLUSION
--  constraint makes overlaps impossible even under concurrency. Requires the
--  btree_gist extension. Uncomment to enable.
-- ============================================================================
-- CREATE EXTENSION IF NOT EXISTS btree_gist;
-- ALTER TABLE shows ADD CONSTRAINT no_overlap_per_screen
--     EXCLUDE USING gist (
--         screen_id WITH =,
--         tsrange(start_time, end_time) WITH &&
--     );
