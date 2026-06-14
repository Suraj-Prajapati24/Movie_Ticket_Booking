import client, { withTransaction } from "../dbConnection.js";

export const createBooking = async (req, res) => {
  const { show_id, seat_ids } = req.body;
  const user_id = req.userDetails.user_id;

  if (!show_id || !Array.isArray(seat_ids) || seat_ids.length === 0) {
    return res
      .status(400)
      .json({ message: "show_id and seat_ids are required" });
  }

  const uniqueSeatIds = [...new Set(seat_ids)];

  try {
    const result = await withTransaction(async (tx) => {
      const showRes = await tx.query(
        `SELECT show_id, price, screen_id, start_time FROM shows WHERE show_id = $1`,
        [show_id],
      );
      if (showRes.rowCount === 0) {
        const err = new Error("Show not found");
        err.status = 404;
        throw err;
      }
      const show = showRes.rows[0];

      if (new Date(show.start_time) < new Date()) {
        const err = new Error("This show has already started");
        err.status = 400;
        throw err;
      }

      const seatCheck = await tx.query(
        `SELECT seat_id FROM seats WHERE seat_id = ANY($1) AND screen_id = $2`,
        [uniqueSeatIds, show.screen_id],
      );
      if (seatCheck.rowCount !== uniqueSeatIds.length) {
        const err = new Error("One or more seats do not belong to this show");
        err.status = 400;
        throw err;
      }

      const taken = await tx.query(
        `SELECT seat_id FROM booking_seats WHERE show_id = $1 AND seat_id = ANY($2)`,
        [show_id, uniqueSeatIds],
      );
      if (taken.rowCount > 0) {
        const err = new Error("One or more seats are already booked");
        err.status = 409;
        throw err;
      }

      const totalAmount = Number(show.price) * uniqueSeatIds.length;

      const bookingRes = await tx.query(
        `INSERT INTO bookings (user_id, show_id, status, total_amount)
         VALUES ($1, $2, 'confirmed', $3)
         RETURNING booking_id`,
        [user_id, show_id, totalAmount],
      );
      const booking_id = bookingRes.rows[0].booking_id;

      await tx.query(
        `INSERT INTO booking_seats (booking_id, show_id, seat_id)
         SELECT $1, $2, UNNEST($3::int[])`,
        [booking_id, show_id, uniqueSeatIds],
      );

      await tx.query(
        `INSERT INTO payments (booking_id, amount, status, method)
         VALUES ($1, $2, 'success', 'demo')`,
        [booking_id, totalAmount],
      );

      return { booking_id, total_amount: totalAmount };
    });

    return res.status(201).json({
      message: "Booking successful",
      booking_id: result.booking_id,
      total_amount: result.total_amount,
      seats: uniqueSeatIds,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "One or more seats are already booked" });
    }
    console.error(error);
    return res.status(500).json({ message: "system failure" });
  }
};

export const getMyBookings = async (req, res) => {
  const user_id = req.userDetails.user_id;
  try {
    const result = await client.query(
      `SELECT
         b.booking_id,
         b.status,
         b.total_amount,
         b.created_at,
         m.title AS movie_title,
         m.poster_url,
         sc.screen_number,
         sh.start_time,
         sh.end_time,
         COALESCE(
           json_agg(se.seat_number ORDER BY se.row_label, se.seat_col)
             FILTER (WHERE se.seat_id IS NOT NULL),
           '[]'
         ) AS seats
       FROM bookings b
       JOIN shows sh   ON sh.show_id   = b.show_id
       JOIN movies m   ON m.movie_id   = sh.movie_id
       JOIN screens sc ON sc.screen_id = sh.screen_id
       LEFT JOIN booking_seats bs ON bs.booking_id = b.booking_id
       LEFT JOIN seats se         ON se.seat_id    = bs.seat_id
       WHERE b.user_id = $1
       GROUP BY b.booking_id, m.title, m.poster_url, sc.screen_number,
                sh.start_time, sh.end_time
       ORDER BY b.created_at DESC`,
      [user_id],
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
};
