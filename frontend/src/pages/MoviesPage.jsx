import { useEffect, useState } from "react";

export default function MoviesPage({ onSelectMovie }) {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/movies")
      .then((res) => res.json())
      .then((data) => setMovies(data));
  }, []);

  return (
    <div>
      <h2>Movies</h2>
      {movies.map((movie) => (
        <div
          className="card"
          key={movie.movie_id}
          onClick={() => onSelectMovie(movie.movie_id)}
        >
          <h3>{movie.title}</h3>
          <p>
            {movie.language} • {movie.duration_minutes} mins
          </p>
        </div>
      ))}
    </div>
  );
}
