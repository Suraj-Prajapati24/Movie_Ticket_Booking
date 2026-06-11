import { useEffect, useState } from "react";
import { API_BASE } from "../config";

function parseShowDate(str) {
  if (!str) return new Date(NaN);
  return new Date(str.includes("T") ? str : str.replace(" ", "T"));
}

function formatDateTime(str) {
  const d = parseShowDate(str);
  if (isNaN(d)) return str || "—";
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ManageShows() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/shows`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return res.json();
      })
      .then((data) => setShows(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const totalBookings = shows.reduce((sum, s) => sum + (s.bookings_count || 0), 0);
  const totalBooked = shows.reduce((sum, s) => sum + (s.booked_seats || 0), 0);
  const totalSeats = shows.reduce((sum, s) => sum + (s.total_seats || 0), 0);

  return (
    <div className="form-card" style={{ maxWidth: 760 }}>
      <div className="back-row" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>All Shows</h3>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {!loading && !error && shows.length > 0 && (
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-value">{shows.length}</div>
            <div className="stat-label">Shows</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalBookings}</div>
            <div className="stat-label">Bookings</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalBooked}/{totalSeats}</div>
            <div className="stat-label">Seats filled</div>
          </div>
        </div>
      )}

      {loading && <div className="spinner-wrap"><div className="spinner" /></div>}

      {error && <div className="msg msg-error">Failed to load shows: {error}</div>}

      {!loading && !error && shows.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🎭</div>
          <p>No shows scheduled yet. Add one from the “Add Show” tab.</p>
        </div>
      )}

      {!loading && !error && shows.length > 0 && (
        <table className="shows-table">
          <thead>
            <tr>
              <th>Movie</th>
              <th>Screen</th>
              <th>Start</th>
              <th>Occupancy</th>
              <th>Bookings</th>
            </tr>
          </thead>
          <tbody>
            {shows.map((s) => {
              const pct = s.total_seats ? Math.round((s.booked_seats / s.total_seats) * 100) : 0;
              return (
                <tr key={s.show_id}>
                  <td data-label="Movie">{s.movie_title}</td>
                  <td data-label="Screen">{s.screen_number}</td>
                  <td data-label="Start">{formatDateTime(s.start_time)}</td>
                  <td data-label="Occupancy">
                    <div className="occupancy">
                      <div className="occupancy-bar">
                        <div className="occupancy-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="occupancy-text">{s.booked_seats}/{s.total_seats}</span>
                    </div>
                  </td>
                  <td data-label="Bookings">{s.bookings_count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
