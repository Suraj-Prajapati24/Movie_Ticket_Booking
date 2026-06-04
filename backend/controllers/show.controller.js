import client from "../dbConnection.js";

export const getShowSeats = async (req, res) => {
    const show_id = req.params.show_id;
    try{
        const seats = await client.query(`
            SELECT seat_id, seat_number, is_booked 
            FROM seats WHERE show_id = $1
            ORDER BY seat_number`,
            [show_id]
        );
        return res.status(200).json(seats.rows);
    }catch(error){
        console.log(error);
        return res.status(500).json({
            message : "Failed to fetch seats",
            error: error.message
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
      [movie_id]
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
  const {
    movie_id,
    screen_number,
    start_time,
    end_time,
  } = req.body;

  try {
    await client.query("BEGIN");

    // 1️⃣ create show
    const showResult = await client.query(
      `
      INSERT INTO shows
      (movie_id, screen_number, start_time, end_time)
      VALUES ($1, $2, $3, $4)
      RETURNING show_id
      `,
      [movie_id, screen_number, start_time, end_time]
    );

    const show_id = showResult.rows[0].show_id;

    // 2️⃣ auto-create seats
    const rows = ["A", "B", "C"];

    for (const row of rows) {
      for (let i = 1; i <= 6; i++) {
        await client.query(
          `
          INSERT INTO seats (show_id, seat_number)
          VALUES ($1, $2)
          `,
          [show_id, `${row}${i}`]
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