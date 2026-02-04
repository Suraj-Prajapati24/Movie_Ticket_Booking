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