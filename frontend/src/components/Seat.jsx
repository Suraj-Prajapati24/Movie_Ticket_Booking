export default function Seat({ seat, onSelect, isSelected }) {
  const booked = !!seat.is_booked;

  let bg     = "#10b981"; // available — green
  let border = "transparent";
  if (booked)      { bg = "#1f2937"; border = "#374151"; }
  else if (isSelected) { bg = "#6366f1"; border = "#818cf8"; }

  return (
    <button
      disabled={booked}
      onClick={() => onSelect(seat.seat_id)}
      title={booked ? `${seat.seat_number} — Booked` : `${seat.seat_number} — ${isSelected ? "Click to deselect" : "Click to select"}`}
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "6px",
        border: `2px solid ${border}`,
        background: bg,
        color: booked ? "#6b7280" : "#fff",
        fontSize: "0.72rem",
        fontWeight: "700",
        cursor: booked ? "not-allowed" : "pointer",
        transition: "background 0.15s, transform 0.12s, border-color 0.15s",
        transform: isSelected && !booked ? "scale(1.1)" : "scale(1)",
      }}
    >
      {seat.seat_number}
    </button>
  );
}
