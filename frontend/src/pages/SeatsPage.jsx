import { useEffect, useState } from "react";
import Seat from "../components/Seat";

export default function SeatsPage({showId}){
    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);

    useEffect(() => {
        fetch(`http://localhost:5000/shows/${showId}/seats`)
        .then(res => res.json()).then(data=>setSeats(data));
    }, [showId]);

};
const toggleSeat = (seatId) => {
    setSelectedSeats(prev => {
        prev.includes(seatId) ? 
        prev.filter(id => id != seatId) :
        [...prev, seatId];
    });
};

const bookSeats = async () => {
    const token = localStorage.getItem("token");
    await fetch("https://localhost:5000/bookings", {
        method : "POST",
        headers : {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            show_id : showId,
            seat_ids : selectedSeats
        }),
    })
    alert("Booking...");   
};

return(
    <div>
        <h2>Select Seats</h2>
        {seats.map(seat => (
            <Seat key = {seat.seat_id} seat = {seat} onSelect={toggleSeat} />
        ))}

        <br/>
        <button onClick={bookSeats} disabled={selectedSeats.length === 0}>Book Selected Seats</button>
    </div>
)