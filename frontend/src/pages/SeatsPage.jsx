import { useEffect, useState } from "react";
import Seat from "../components/Seat";
import PaymentModal from "../components/PaymentModal";
import { API_BASE } from "../config";

const PRICE_PER_SEAT = 200; // ₹ — dummy pricing until the backend stores it

export default function SeatsPage({ showId, onBack }) {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [message, setMessage] = useState(null); // { type: "success"|"error", text }
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  const loadSeats = () => {
    setLoading(true);
    fetch(`${API_BASE}/shows/${showId}/seats`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return res.json();
      })
      .then((data) => setSeats(Array.isArray(data) ? data : []))
      .catch((err) => setMessage({ type: "error", text: err.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSeats();
  }, [showId]);

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
            <div className="seat-grid">
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
                : <><strong>{selectedSeats.length}</strong> seat{selectedSeats.length > 1 ? "s" : ""} · ₹{selectedSeats.length * PRICE_PER_SEAT}</>}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => { setMessage(null); setShowPayment(true); }}
              disabled={selectedSeats.length === 0}
            >
              {selectedSeats.length > 0 ? `Pay ₹${selectedSeats.length * PRICE_PER_SEAT}` : "Confirm Booking"}
            </button>
          </div>
        </div>
      )}

      {showPayment && (
        <PaymentModal
          seatLabels={selectedLabels}
          pricePerSeat={PRICE_PER_SEAT}
          onPay={submitBooking}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
