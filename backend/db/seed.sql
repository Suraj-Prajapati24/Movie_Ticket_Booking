-- ============================================================================
--  MovieJunction — sample seed data
--
--  Run AFTER schema.sql (which creates tables + the 5 screens and their seats):
--      psql -U <user> -d <database> -f backend/db/seed.sql
--
--  Re-runnable: it truncates the transactional tables first (screens/seats,
--  being physical, are left untouched).
--
--  Demo logins it creates:
--      manager →  admin@moviejunction.com   / admin123
--      client →  client@moviejunction.com  / client123
--
--  Poster images are hotlinked from TMDB's public CDN and are illustrative
--  only. If any fail to load, the UI falls back to a generated tile.
-- ============================================================================

BEGIN;

-- Wipe transactional data so this script is idempotent. CASCADE from movies
-- clears shows → bookings → booking_seats → payments. Physical screens/seats
-- are NOT touched.
TRUNCATE payments, booking_seats, bookings, shows, movies RESTART IDENTITY CASCADE;
TRUNCATE users RESTART IDENTITY CASCADE;

-- ─── Users ──────────────────────────────────────────────────────────────────
-- Password hashes are bcrypt (cost 10). admin123 / client123 in plain text.
INSERT INTO users (username, email, password_hash, role) VALUES
  ('Theatre Admin', 'admin@moviejunction.com',
   '$2b$10$AYYheHurI1nODpTJsqOC2.4A4haPQ/oc9n03edZhPVVfk5wsrpL.u', 'manager'),
  ('Demo Client', 'client@moviejunction.com',
   '$2b$10$HdKzjJSiINB8n9eeGKttp.pWwsRrc4/zLPKr0CUGQgPC5W9YJoXBi', 'client');

-- ─── Movies ─────────────────────────────────────────────────────────────────
INSERT INTO movies (title, description, duration_minutes, language, poster_url) VALUES
  ('Inception',
   'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.',
   148, 'English', 'https://image.tmdb.org/t/p/w500/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg'),
  ('The Dark Knight',
   'Batman faces the Joker, a criminal mastermind who plunges Gotham City into anarchy.',
   152, 'English', 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg'),
  ('Interstellar',
   'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.',
   169, 'English', 'https://image.tmdb.org/t/p/w500/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg'),
  ('Oppenheimer',
   'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.',
   181, 'English', 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg'),
  ('Spider-Man: Into the Spider-Verse',
   'Teen Miles Morales becomes Spider-Man and joins other Spider-People from parallel dimensions.',
   117, 'English', 'https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg'),
  ('The Matrix',
   'A hacker learns that his reality is a simulation and joins a rebellion against its machine controllers.',
   136, 'English', 'https://image.tmdb.org/t/p/w500/aOIuZAjPaRIE6CMzbazvcHuHXDc.jpg');

-- ─── Shows ──────────────────────────────────────────────────────────────────
-- Scheduled relative to "tomorrow" so they're always in the future (booking and
-- createShow both reject past shows). end_time is derived from each movie's
-- runtime; slots per screen are kept non-overlapping.
INSERT INTO shows (movie_id, screen_id, start_time, end_time, price)
SELECT
  m.movie_id,
  sc.screen_id,
  s.start_time,
  s.start_time + make_interval(mins => m.duration_minutes),
  s.price
FROM (
  VALUES
    -- (movie title, screen number, start time, price)
    ('Inception',                         1, date_trunc('day', LOCALTIMESTAMP) + interval '1 day' + interval '10 hours', 250),
    ('Oppenheimer',                       1, date_trunc('day', LOCALTIMESTAMP) + interval '1 day' + interval '14 hours', 300),
    ('Interstellar',                      1, date_trunc('day', LOCALTIMESTAMP) + interval '1 day' + interval '19 hours', 280),
    ('The Dark Knight',                   2, date_trunc('day', LOCALTIMESTAMP) + interval '1 day' + interval '11 hours', 220),
    ('Spider-Man: Into the Spider-Verse', 2, date_trunc('day', LOCALTIMESTAMP) + interval '1 day' + interval '15 hours', 200),
    ('The Matrix',                        2, date_trunc('day', LOCALTIMESTAMP) + interval '1 day' + interval '18 hours', 220),
    ('Interstellar',                      3, date_trunc('day', LOCALTIMESTAMP) + interval '1 day' + interval '12 hours', 350),
    ('Inception',                         4, date_trunc('day', LOCALTIMESTAMP) + interval '2 day' + interval '13 hours', 240),
    ('Oppenheimer',                       4, date_trunc('day', LOCALTIMESTAMP) + interval '2 day' + interval '18 hours', 320),
    ('The Dark Knight',                   5, date_trunc('day', LOCALTIMESTAMP) + interval '2 day' + interval '20 hours', 180)
) AS s(title, screen_number, start_time, price)
JOIN movies  m  ON m.title         = s.title
JOIN screens sc ON sc.screen_number = s.screen_number;

-- ─── A sample booking (so My Bookings + the admin seat map show real data) ───
-- The demo client books seats A1, A2, A3 on the earliest Inception show.
WITH the_show AS (
  SELECT sh.show_id, sh.screen_id, sh.price
  FROM shows sh
  JOIN movies m ON m.movie_id = sh.movie_id
  WHERE m.title = 'Inception'
  ORDER BY sh.start_time
  LIMIT 1
),
the_user AS (
  SELECT user_id FROM users WHERE email = 'client@moviejunction.com'
),
chosen_seats AS (
  SELECT se.seat_id
  FROM seats se
  JOIN the_show s ON s.screen_id = se.screen_id
  WHERE se.seat_number IN ('A1', 'A2', 'A3')
),
new_booking AS (
  INSERT INTO bookings (user_id, show_id, status, total_amount)
  SELECT u.user_id, s.show_id, 'confirmed', s.price * 3
  FROM the_user u, the_show s
  RETURNING booking_id, show_id, total_amount
),
seat_inserts AS (
  INSERT INTO booking_seats (booking_id, show_id, seat_id)
  SELECT b.booking_id, b.show_id, cs.seat_id
  FROM new_booking b, chosen_seats cs
  RETURNING 1
)
INSERT INTO payments (booking_id, amount, status, method)
SELECT b.booking_id, b.total_amount, 'success', 'demo'
FROM new_booking b;

COMMIT;
