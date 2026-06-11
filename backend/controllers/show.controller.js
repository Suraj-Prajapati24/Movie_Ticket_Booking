import client from "../dbConnection.js";

export const getShowSeats = async (req, res) => {
  const show_id = req.params.show_id;
  try {
    const seats = await client.query(
      `
            SELECT seat_id, seat_number, is_booked 
            FROM seats WHERE show_id = $1
            ORDER BY seat_number`,
      [show_id],
    );
    return res.status(200).json(seats.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to fetch seats",
      error: error.message,
    });
  }
};

export const getShowsByMovie = async (req, res) => {
  const { movie_id } = req.params;

  try {
    const result = await client.query(
      `
      SELECT show_id, screen_number, start_time, end_time
      FROM shows
      WHERE movie_id = $1
      ORDER BY start_time
      `,
      [movie_id],
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch shows",
    });
  }
};

export const createShow = async (req, res) => {
  const { movie_id, screen_number, start_time, end_time } = req.body;

  try {
    await client.query("BEGIN");
    const overlap = await client.query(
      `
    SELECT *
    FROM shows
    WHERE screen_number = $1
      AND start_time < $2
      AND end_time > $3
    `,
      [screen_number, end_time, start_time],
    );

    if (overlap.rowCount > 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Screen already occupied during this time",
      });
    }
    const showResult = await client.query(
      `
      INSERT INTO shows
      (movie_id, screen_number, start_time, end_time)
      VALUES ($1, $2, $3, $4)
      RETURNING show_id
      `,
      [movie_id, screen_number, start_time, end_time],
    );

    const show_id = showResult.rows[0].show_id;

    const rows = ["A", "B", "C"];

    for (const row of rows) {
      for (let i = 1; i <= 6; i++) {
        await client.query(
          `
          INSERT INTO seats (show_id, seat_number)
          VALUES ($1, $2)
          `,
          [show_id, `${row}${i}`],
        );
      }
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Show created successfully",
      show_id,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    return res.status(500).json({
      message: "Failed to create show",
    });
  }
};

export const getAllShows = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT
        s.show_id,
        m.title AS movie_title,
        s.screen_number,
        s.start_time,

        COUNT(se.seat_id) AS total_seats,

        COUNT(
          CASE
            WHEN se.is_booked = true
            THEN 1
          END
        ) AS booked_seats,

        COUNT(DISTINCT b.booking_id) AS bookings_count

      FROM shows s

      JOIN movies m
        ON m.movie_id = s.movie_id

      LEFT JOIN seats se
        ON se.show_id = s.show_id

      LEFT JOIN bookings b
        ON b.show_id = s.show_id

      GROUP BY
        s.show_id,
        m.title,
        s.screen_number,
        s.start_time

      ORDER BY s.start_time;
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch shows",
    });
  }
};

export const deleteShow = async (req, res) => {
  const { show_id } = req.params;

  try {
    await client.query("BEGIN");

    await client.query(
      `
      DELETE FROM booking_seats
      WHERE seat_id IN (
        SELECT seat_id
        FROM seats
        WHERE show_id = $1
      )
      `,
      [show_id]
    );

    await client.query(
      `
      DELETE FROM bookings
      WHERE show_id = $1
      `,
      [show_id]
    );

    await client.query(
      `
      DELETE FROM seats
      WHERE show_id = $1
      `,
      [show_id]
    );

    const result = await client.query(
      `
      DELETE FROM shows
      WHERE show_id = $1
      RETURNING *
      `,
      [show_id]
    );

    await client.query("COMMIT");

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Show not found",
      });
    }

    return res.status(200).json({
      message: "Show deleted successfully",
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    return res.status(500).json({
      message: "Failed to delete show",
    });
  }
};