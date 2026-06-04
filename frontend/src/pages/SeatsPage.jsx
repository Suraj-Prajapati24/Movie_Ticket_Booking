import { useEffect, useState } from "react";
import Seat from "../components/Seat";

export default function SeatsPage({ showId }) {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/shows/${showId}/seats`)
      .then((res) => res.json())
      .then((data) => setSeats(data));
  }, [showId]);

  const toggleSeat = (seatId) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId],
    );
  };

  const bookSeats = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          show_id: showId,
          seat_ids: selectedSeats,
        }),
      });

      const data = await res.json();

      if (res.status === 201) {
        setMessage("✅ Booking successful");

        const updatedSeats = await fetch(
          `http://localhost:5000/shows/${showId}/seats`,
        ).then((r) => r.json());

        setSeats(updatedSeats);
        setSelectedSeats([]);
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  return (
    <div>
      <h2>Select Seats</h2>

      <div className="seat-grid">
        {seats.map((seat, index) => (
          <div key={seat.seat_id} className="seat-wrapper">
            <Seat
              seat={seat}
              isSelected={selectedSeats.includes(seat.seat_id)}
              onSelect={toggleSeat}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          textAlign: "center",
          marginBottom: "10px",
          fontWeight: "bold",
        }}
      >
        🎬 SCREEN THIS WAY
      </div>
      <br />
      <button
        className="button"
        onClick={bookSeats}
        disabled={selectedSeats.length === 0}
      >
        Book Selected Seats
      </button>
    </div>
  );
}
