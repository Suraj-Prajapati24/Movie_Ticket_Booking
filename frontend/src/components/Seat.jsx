export default function Seat( {seat, onSelect }){ 
    retrun (
        <button
            disabled={seat.is_booked}
            onClick={() => onSelect(seat.seat_id)}
            style={{
                margin: "5px",
                padding: "10px",
                backgroundColor: seat.is_booked ? "gray" : "green",
                cursor: seat.is_booked ? "not-allowed" : "pointer",
            }}
        >
        </button>
    )
}