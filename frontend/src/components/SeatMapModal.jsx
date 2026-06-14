import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../config";

function parseShowDate(str) {
  if (!str) return new Date(NaN);
  return new Date(str.includes("T") ? str : str.replace(" ", "T"));
}

function formatDateTime(str) {
  const d = parseShowDate(str);
  if (isNaN(d)) return str || "—";
  return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function dummySeats() {
  const rows = ["A", "B", "C"];
  const bookedSet = new Set(["A2", "A3", "B5", "C1", "C2", "C6"]);
  const seats = [];
  rows.forEach((row) => {
    for (let i = 1; i <= 6; i++) {
      const seat_number = `${row}${i}`;
      seats.push({
        seat_id: seat_number,
        seat_number,
        row_label: row,
        seat_col: i,
        is_booked: bookedSet.has(seat_number),
      });
    }
  });
  return seats;
}

export default function SeatMapModal({ show, onClose }) {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingDummy, setUsingDummy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API_BASE}/shows/${show.show_id}/seats`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        if (list.length === 0) {
          setSeats(dummySeats());
          setUsingDummy(true);
        } else {
          setSeats(list);
          setUsingDummy(false);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setSeats(dummySeats());
        setUsingDummy(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [show.show_id]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const columns = useMemo(() => {
    const max = seats.reduce((m, s) => Math.max(m, Number(s.seat_col) || 0), 0);
    return max || 6;
  }, [seats]);

  const booked = seats.filter((s) => !!s.is_booked).length;
  const total = seats.length;
  const available = total - booked;
  const pct = total ? Math.round((booked / total) * 100) : 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card seat-map-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <h3 className="modal-title">{show.movie_title || "Show"} — Seat Map</h3>
        <p className="seat-map-sub">
          Screen {show.screen_number} · {formatDateTime(show.start_time)}
        </p>

        {usingDummy && (
          <div className="msg msg-error" style={{ marginBottom: 14, fontSize: "0.78rem" }}>
            Showing sample seat layout (live seat data unavailable).
          </div>
        )}

        {loading ? (
          <div className="spinner-wrap" style={{ padding: "40px 0" }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div className="screen-bar">◀ SCREEN ▶</div>
            <div
              className="seat-grid seat-grid-readonly"
              style={{ gridTemplateColumns: `repeat(${columns}, 44px)` }}
            >
              {seats.map((seat) => (
                <div
                  key={seat.seat_id}
                  className={`seat-chip ${seat.is_booked ? "seat-chip-booked" : "seat-chip-free"}`}
                  title={`${seat.seat_number} — ${seat.is_booked ? "Booked" : "Vacant"}`}
                >
                  {seat.seat_number}
                </div>
              ))}
            </div>

            <div className="seat-legend" style={{ marginTop: 16 }}>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: "#10b981" }} />
                Vacant ({available})
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: "#374151" }} />
                Booked ({booked})
              </div>
            </div>

            <div className="seat-map-occupancy">
              <div className="occupancy-bar">
                <div className="occupancy-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="occupancy-text">{booked}/{total} seats filled ({pct}%)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
