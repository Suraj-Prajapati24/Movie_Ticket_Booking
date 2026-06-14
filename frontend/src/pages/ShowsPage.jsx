import { useEffect, useState } from "react";
import { API_BASE } from "../config";

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
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function ShowsPage({
  movieId,
  movieTitle,
  onSelectShow,
  onBack,
}) {
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
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← Back
        </button>
        <h2>{movieTitle}</h2>
      </div>

      <h3 className="page-title">Available Shows</h3>

      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
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
          {shows.map((show) => {
            const total = Number(show.total_seats) || 0;
            const booked = Number(show.booked_seats) || 0;
            const left = Math.max(total - booked, 0);
            const soldOut = total > 0 && left === 0;
            return (
              <div
                key={show.show_id}
                className={`card show-card ${soldOut ? "" : "clickable"}`}
                onClick={() => !soldOut && onSelectShow(show.show_id)}
                style={
                  soldOut ? { opacity: 0.6, cursor: "not-allowed" } : undefined
                }
              >
                <div>
                  <div className="show-time">
                    {formatTime(show.start_time)} – {formatTime(show.end_time)}
                  </div>
                  <div className="show-date">
                    {formatDate(show.start_time)}
                    {show.price != null && <> · ₹{Number(show.price)}/seat</>}
                  </div>
                  <div className="show-seats-left">
                    {soldOut
                      ? "Sold out"
                      : `${left} seat${left === 1 ? "" : "s"} left`}
                  </div>
                </div>
                <span className="screen-badge">
                  Screen {show.screen_number}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
