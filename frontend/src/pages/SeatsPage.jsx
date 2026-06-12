import { useEffect, useMemo, useState } from "react";
import Seat from "../components/Seat";
import PaymentModal from "../components/PaymentModal";
import { API_BASE } from "../config";

function parseShowDate(str) {
  if (!str) return new Date(NaN);
  return new Date(str.includes("T") ? str : str.replace(" ", "T"));
}

function formatDateTime(str) {
  const d = parseShowDate(str);
  if (isNaN(d)) return str || "";
  return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SeatsPage({ showId, onBack }) {
  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [message, setMessage] = useState(null); // { type: "success"|"error", text }
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  // Price comes from the show now (admin sets it per show), not a hardcoded const.
  const pricePerSeat = Number(show?.price) || 0;

  const loadSeats = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/shows/${showId}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_BASE}/shows/${showId}/seats`).then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json();
      }),
    ])
      .then(([showData, seatData]) => {
        if (showData) setShow(showData);
        setSeats(Array.isArray(seatData) ? seatData : []);
      })
      .catch((err) => setMessage({ type: "error", text: err.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSeats();
  }, [showId]);

  // Lay the grid out to match the screen's real row width (e.g. 6 or 8 wide).
  const columns = useMemo(() => {
    const max = seats.reduce((m, s) => Math.max(m, Number(s.seat_col) || 0), 0);
    return max || 6;
  }, [seats]);

  const toggleSeat = (seatId) => {
    setMessage(null);
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]
    );
  };

  // Called by the payment modal once the (fake) payment clears.
  const submitBooking = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ show_id: showId, seat_ids: selectedSeats }),
      });
      const data = await res.json();
      if (res.status === 201) {
        return { ok: true, bookingId: data.booking_id };
      }
      return { ok: false, message: data.message || "Booking failed" };
    } catch {
      return { ok: false, message: "Could not reach the server." };
    }
  };

  const handlePaymentSuccess = (bookingId) => {
    setShowPayment(false);
    setMessage({
      type: "success",
      text: `Booking confirmed! ID #${bookingId} — ${selectedSeats.length} seat(s) reserved.`,
    });
    setSelectedSeats([]);
    loadSeats();
  };

  const available = seats.filter((s) => !s.is_booked).length;
  const booked = seats.filter((s) => s.is_booked).length;

  const selectedLabels = seats
    .filter((s) => selectedSeats.includes(s.seat_id))
    .map((s) => s.seat_number);

  return (
    <div>
      <div className="back-row">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <h2>Select Seats</h2>
      </div>

      {show && (
        <p className="seat-map-sub" style={{ marginTop: -8 }}>
          {show.movie_title} · Screen {show.screen_number} · {formatDateTime(show.start_time)} · ₹{pricePerSeat}/seat
        </p>
      )}

      {message && (
        <div className={`msg ${message.type === "success" ? "msg-success" : "msg-error"}`} style={{ marginBottom: 16 }}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : (
        <div className="seat-section">
          <div>
            <div className="screen-bar">◀ SCREEN ▶</div>
            <div
              className="seat-grid"
              style={{ gridTemplateColumns: `repeat(${columns}, 44px)` }}
            >
              {seats.map((seat) => (
                <Seat
                  key={seat.seat_id}
                  seat={seat}
                  isSelected={selectedSeats.includes(seat.seat_id)}
                  onSelect={toggleSeat}
                />
              ))}
            </div>
          </div>

          <div className="seat-legend">
            <div className="legend-item">
              <div className="legend-dot" style={{ background: "#10b981" }} />
              Available ({available})
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: "#6366f1" }} />
              Selected ({selectedSeats.length})
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: "#374151" }} />
              Booked ({booked})
            </div>
          </div>

          <div className="booking-bar">
            <div className="booking-summary">
              {selectedSeats.length === 0
                ? "Click seats above to select them"
                : <><strong>{selectedSeats.length}</strong> seat{selectedSeats.length > 1 ? "s" : ""} · ₹{selectedSeats.length * pricePerSeat}</>}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => { setMessage(null); setShowPayment(true); }}
              disabled={selectedSeats.length === 0}
            >
              {selectedSeats.length > 0 ? `Pay ₹${selectedSeats.length * pricePerSeat}` : "Confirm Booking"}
            </button>
          </div>
        </div>
      )}

      {showPayment && (
        <PaymentModal
          seatLabels={selectedLabels}
          pricePerSeat={pricePerSeat}
          onPay={submitBooking}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
