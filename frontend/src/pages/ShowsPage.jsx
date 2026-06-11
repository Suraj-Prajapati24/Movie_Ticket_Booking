import { useEffect, useState } from "react";
import { API_BASE } from "../config";

// SQLite stores datetimes as "YYYY-MM-DD HH:MM:SS" (space separator).
// new Date() on that string is Invalid Date in Safari/Firefox.
// Replace the space with T to get proper ISO 8601.
function parseShowDate(str) {
  if (!str) return new Date(NaN);
  return new Date(str.includes("T") ? str : str.replace(" ", "T"));
}

function formatTime(dateStr) {
  const d = parseShowDate(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr) {
  const d = parseShowDate(dateStr);
  if (isNaN(d)) return "";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export default function ShowsPage({ movieId, movieTitle, onSelectShow, onBack }) {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/shows/movie/${movieId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return res.json();
      })
      .then((data) => setShows(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [movieId]);

  return (
    <div>
      <div className="back-row">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <h2>{movieTitle}</h2>
      </div>

      <h3 className="page-title">Available Shows</h3>

      {loading && (
        <div className="spinner-wrap"><div className="spinner" /></div>
      )}

      {error && (
        <div className="msg msg-error">Failed to load shows: {error}</div>
      )}

      {!loading && !error && shows.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>No shows scheduled for this movie yet.</p>
        </div>
      )}

      {!loading && !error && (
        <div className="shows-list">
          {shows.map((show) => (
            <div
              key={show.show_id}
              className="card clickable show-card"
              onClick={() => onSelectShow(show.show_id)}
            >
              <div>
                <div className="show-time">
                  {formatTime(show.start_time)} – {formatTime(show.end_time)}
                </div>
                <div className="show-date">{formatDate(show.start_time)}</div>
              </div>
              <span className="screen-badge">Screen {show.screen_number}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
