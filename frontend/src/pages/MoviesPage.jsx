import { useEffect, useState } from "react";
import { API_BASE } from "../config";
import Poster from "../components/Poster";

export default function MoviesPage({ onSelectMovie }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/movies`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setMovies(Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="spinner-wrap">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="msg msg-error" style={{ marginTop: 20 }}>
        Failed to load movies: {error}
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🎥</div>
        <p>No movies available yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="page-title">Now Showing</h2>
      <div className="movies-grid">
        {movies.map((movie) => (
          <div
            key={movie.movie_id}
            className="card clickable movie-card"
            onClick={() => onSelectMovie(movie.movie_id, movie.title)}
          >
            <div className="poster-wrap">
              <Poster url={movie.poster_url} title={movie.title} />
              {movie.duration_minutes != null && (
                <span className="poster-duration">
                  {movie.duration_minutes} min
                </span>
              )}
            </div>
            <div className="movie-card-body">
              <h3>{movie.title}</h3>
              <div className="meta" style={{ marginBottom: 10 }}>
                <span className="badge badge-gold">{movie.language}</span>
              </div>
              {movie.description && (
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {movie.description.length > 90
                    ? movie.description.slice(0, 90) + "…"
                    : movie.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
