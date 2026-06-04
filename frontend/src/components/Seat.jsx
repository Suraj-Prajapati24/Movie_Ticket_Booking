export default function Seat({ seat, onSelect, isSelected }) {
  let bgColor = "#28a745"; // available

  if (seat.is_booked) bgColor = "gray";
  else if (isSelected) bgColor = "#007bff";

  return (
    <button
      disabled={seat.is_booked}
      onClick={() => onSelect(seat.seat_id)}
      style={{
        padding: "10px",
        borderRadius: "5px",
        border: "none",
        backgroundColor: bgColor,
        color: "white",
        cursor: seat.is_booked ? "not-allowed" : "pointer"
      }}
    >
      {seat.seat_number}
    </button>
  );
}