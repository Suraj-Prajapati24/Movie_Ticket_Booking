import client from "../dbConnection.js";

export const getAllMovies = async (req, res) => {
    try{
        const movies = await client.query(
            `SELECT movie_id, title, language, duration_minutes
            FROM movies ORDER BY created_at DESC`
        );
        return(res.status(200).json(movies.rows));
    } catch (error){
        console.error(error);
        return res.status(500).json({
        message: "Failed to fetch movies",
        });
    }
};

export const createMovie = async (req, res) => {
  try {
    const {
      title,
      description,
      duration_minutes,
      language,
    } = req.body;

    const result = await client.query(
      `
      INSERT INTO movies
      (title, description, duration_minutes, language)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [title, description, duration_minutes, language]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to create movie",
    });
  }
};

export const deleteMovie = async (req, res) => {
  const { movie_id } = req.params;

  try {
    const result = await client.query(
      `
      DELETE FROM movies
      WHERE movie_id = $1
      RETURNING *
      `,
      [movie_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Movie not found",
      });
    }

    return res.status(200).json({
      message: "Movie deleted successfully",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to delete movie",
    });
  }
};