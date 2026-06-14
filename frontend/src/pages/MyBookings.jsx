import { useEffect, useState } from "react";
import { API_BASE } from "../config";

function parseShowDate(str) {
  if (!str) return new Date(NaN);
  return new Date(str.includes("T") ? str : str.replace(" ", "T"));
}

function formatDateTime(str) {
  const d = parseShowDate(str);
  if (isNaN(d)) return str || "—";
  return d.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/bookings/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return res.json();
      })
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="page-title">My Bookings</h2>

      {loading && (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      )}

      {error && (
        <div className="msg msg-error">Failed to load bookings: {error}</div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🎟️</div>
          <p>No bookings yet. Pick a movie and grab some seats!</p>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="bookings-list">
          {bookings.map((b) => {
            const seats = Array.isArray(b.seats) ? b.seats : [];
            return (
              <div key={b.booking_id} className="card booking-card">
                <div className="booking-card-main">
                  <div className="booking-card-title">{b.movie_title}</div>
                  <div className="booking-card-meta">
                    Screen {b.screen_number} · {formatDateTime(b.start_time)}
                  </div>
                  <div className="booking-card-seats">
                    {seats.length > 0 ? seats.join(", ") : "—"}
                    <span className="booking-seat-count">
                      {seats.length} seat{seats.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="booking-card-side">
                  <span className={`booking-status booking-status-${b.status}`}>
                    {b.status}
                  </span>
                  <div className="booking-amount">
                    ₹{Number(b.total_amount)}
                  </div>
                  <div className="booking-id">#{b.booking_id}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
