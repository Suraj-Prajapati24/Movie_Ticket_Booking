import client from "../dbConnection.js";

export const getAllMovies = async (req, res) => {
  try {
    const movies = await client.query(
      `SELECT movie_id, title, description, duration_minutes, language, poster_url
       FROM movies
       ORDER BY created_at DESC`,
    );
    return res.status(200).json(movies.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch movies" });
  }
};

export const createMovie = async (req, res) => {
  try {
    const { title, description, duration_minutes, language, poster_url } =
      req.body;

    if (!title || !duration_minutes) {
      return res.status(400).json({
        message: "title and duration_minutes are required",
      });
    }
    if (Number(duration_minutes) <= 0) {
      return res
        .status(400)
        .json({ message: "duration_minutes must be positive" });
    }

    const result = await client.query(
      `INSERT INTO movies (title, description, duration_minutes, language, poster_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING movie_id, title, description, duration_minutes, language, poster_url`,
      [
        String(title).trim(),
        description ? String(description).trim() : null,
        Number(duration_minutes),
        language ? String(language).trim() : null,
        poster_url ? String(poster_url).trim() : null,
      ],
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create movie" });
  }
};

export const deleteMovie = async (req, res) => {
  const { movie_id } = req.params;

  try {
    const result = await client.query(
      `DELETE FROM movies WHERE movie_id = $1 RETURNING movie_id`,
      [movie_id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Movie not found" });
    }

    return res.status(200).json({ message: "Movie deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete movie" });
  }
};
