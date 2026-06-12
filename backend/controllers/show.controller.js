import client, { withTransaction } from "../dbConnection.js";

// Add `minutes` to a "YYYY-MM-DDTHH:MM[:SS]" local datetime and return a
// "YYYY-MM-DD HH:MM:SS" string, with NO timezone shift. The DB columns are
// TIMESTAMP (tz-naive) and the frontend speaks local time, so we keep it naive.
function addMinutesNaive(startStr, minutes) {
  const d = new Date(startStr);
  if (isNaN(d)) return null;
  d.setMinutes(d.getMinutes() + Number(minutes));
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

// ─── Seat map for one show ──────────────────────────────────────────────────
// Seats are physical and belong to the show's SCREEN. A seat is "booked" for
// THIS show only if a booking_seats row links them — computed with EXISTS.
export const getShowSeats = async (req, res) => {
  const show_id = req.params.show_id;
  try {
    const seats = await client.query(
      `SELECT
         se.seat_id,
         se.seat_number,
         se.row_label,
         se.seat_col,
         EXISTS (
           SELECT 1 FROM booking_seats bs
           WHERE bs.seat_id = se.seat_id AND bs.show_id = $1
         ) AS is_booked
       FROM seats se
       JOIN shows sh ON sh.show_id = $1
       WHERE se.screen_id = sh.screen_id
       ORDER BY se.row_label, se.seat_col`,
      [show_id]
    );
    return res.status(200).json(seats.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch seats",
      error: error.message,
    });
  }
};

// ─── Shows for one movie (client browse view) ───────────────────────────────
export const getShowsByMovie = async (req, res) => {
  const { movie_id } = req.params;
  try {
    const result = await client.query(
      `SELECT
         sh.show_id,
         sc.screen_id,
         sc.screen_number,
         sh.start_time,
         sh.end_time,
         sh.price,
         (sc.total_rows * sc.seats_per_row) AS total_seats,
         (SELECT COUNT(*) FROM booking_seats bs WHERE bs.show_id = sh.show_id) AS booked_seats
       FROM shows sh
       JOIN screens sc ON sc.screen_id = sh.screen_id
       WHERE sh.movie_id = $1
       ORDER BY sh.start_time`,
      [movie_id]
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch shows" });
  }
};

// ─── Single show detail (used by the seat-booking page for price/header) ─────
export const getShowById = async (req, res) => {
  const { show_id } = req.params;
  try {
    const result = await client.query(
      `SELECT
         sh.show_id,
         sh.movie_id,
         m.title AS movie_title,
         m.duration_minutes,
         sc.screen_id,
         sc.screen_number,
         sc.name AS screen_name,
         sh.start_time,
         sh.end_time,
         sh.price,
         (sc.total_rows * sc.seats_per_row) AS total_seats,
         (SELECT COUNT(*) FROM booking_seats bs WHERE bs.show_id = sh.show_id) AS booked_seats
       FROM shows sh
       JOIN movies m ON m.movie_id = sh.movie_id
       JOIN screens sc ON sc.screen_id = sh.screen_id
       WHERE sh.show_id = $1`,
      [show_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Show not found" });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch show" });
  }
};

// ─── Create a show ──────────────────────────────────────────────────────────
// end_time is derived from the movie's runtime (never trusted from the client).
// The overlap check + insert run in one transaction so two admins can't slot
// overlapping shows onto the same screen at the same instant.
export const createShow = async (req, res) => {
  const { movie_id, screen_id, start_time, price } = req.body;

  if (!movie_id || !screen_id || !start_time) {
    return res.status(400).json({
      message: "movie_id, screen_id and start_time are required",
    });
  }

  try {
    const movie = await client.query(
      `SELECT duration_minutes FROM movies WHERE movie_id = $1`,
      [movie_id]
    );
    if (movie.rowCount === 0) {
      return res.status(404).json({ message: "Movie not found" });
    }
    const duration = movie.rows[0].duration_minutes;
    if (!duration || duration <= 0) {
      return res.status(400).json({
        message: "Selected movie has no valid duration, can't compute end time",
      });
    }

    const screen = await client.query(
      `SELECT 1 FROM screens WHERE screen_id = $1`,
      [screen_id]
    );
    if (screen.rowCount === 0) {
      return res.status(404).json({ message: "Screen not found" });
    }

    const end_time = addMinutesNaive(start_time, duration);
    if (!end_time) {
      return res.status(400).json({ message: "Invalid start_time" });
    }

    // Reject shows that start in the past.
    if (new Date(start_time) < new Date()) {
      return res.status(400).json({ message: "Start time is in the past" });
    }

    const priceValue =
      price !== undefined && price !== null && price !== ""
        ? Number(price)
        : 200;
    if (isNaN(priceValue) || priceValue < 0) {
      return res.status(400).json({ message: "Invalid price" });
    }

    const show_id = await withTransaction(async (tx) => {
      // Two shows overlap on a screen when one starts before the other ends
      // AND ends after the other starts.
      const overlap = await tx.query(
        `SELECT 1 FROM shows
         WHERE screen_id = $1
           AND start_time < $2
           AND end_time   > $3`,
        [screen_id, end_time, start_time]
      );
      if (overlap.rowCount > 0) {
        const err = new Error("Screen already occupied during this time");
        err.status = 400;
        throw err;
      }

      const inserted = await tx.query(
        `INSERT INTO shows (movie_id, screen_id, start_time, end_time, price)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING show_id`,
        [movie_id, screen_id, start_time, end_time, priceValue]
      );
      return inserted.rows[0].show_id;
    });

    return res.status(201).json({ message: "Show created successfully", show_id });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Failed to create show" });
  }
};

// ─── All shows (admin dashboard) ────────────────────────────────────────────
// Counts come from independent subqueries — joining seats AND bookings in one
// grouped query would multiply the rows (cartesian product) and inflate counts.
export const getAllShows = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT
         sh.show_id,
         m.title AS movie_title,
         sc.screen_id,
         sc.screen_number,
         sh.start_time,
         sh.end_time,
         sh.price,
         (sc.total_rows * sc.seats_per_row) AS total_seats,
         (SELECT COUNT(*) FROM booking_seats bs WHERE bs.show_id = sh.show_id) AS booked_seats,
         (SELECT COUNT(*) FROM bookings b
            WHERE b.show_id = sh.show_id AND b.status = 'confirmed') AS bookings_count
       FROM shows sh
       JOIN movies m  ON m.movie_id  = sh.movie_id
       JOIN screens sc ON sc.screen_id = sh.screen_id
       ORDER BY sh.start_time`
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch shows" });
  }
};

// ─── Delete a show ──────────────────────────────────────────────────────────
// bookings, booking_seats and payments all cascade via FK ON DELETE CASCADE.
// Physical seats belong to the screen and are intentionally NOT deleted.
export const deleteShow = async (req, res) => {
  const { show_id } = req.params;
  try {
    const result = await client.query(
      `DELETE FROM shows WHERE show_id = $1 RETURNING show_id`,
      [show_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Show not found" });
    }
    return res.status(200).json({ message: "Show deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete show" });
  }
};
