import client from "../dbConnection.js";

export const createBooking = async (req, res) => {
    const {show_id, seat_ids} = req.body;
    const user_id = req.userDetails.user_id;
    
    if(!show_id || !seat_ids || seat_ids.length === 0){
        return res.status(400).json({
            message : "show_id and seat_ids are required"
        });
    }
    try{
        await client.query("BEGIN");
        const seatsCheck = await client.query(
            `SELECT seat_id FROM seats 
            WHERE seat_id = ANY($1) 
            AND show_id = $2
            AND is_booked = false`,
            [seat_ids, show_id]
        );
        if(seatsCheck.rowCount !== seat_ids.length){
            await client.query("ROLLBACK");
            return res.status(409).json({
                message : "one or more seats are already booked"
            });
        }

        const bookRes = await client.query(
            `INSERT INTO bookings (user_id, show_id)
            VALUES ($1, $2)
            RETURNING booking_id`,
            [user_id, show_id]
        );
        const booking_id = bookRes.rows[0].booking_id;
        for(const seat_id of seat_ids){
            await client.query(`INSERT INTO booking_seats (booking_id, seat_id)     VALUES ($1, $2)`, [booking_id, seat_id]);
        }
        await client.query(`UPDATE seats SET is_booked = true WHERE seat_id = ANY($1) and show_id = ($2)`, [seat_ids, show_id]);

        await client.query("COMMIT");

        return res.status(201).json({
            message: "booking successfull",
            booking_id,
            seats: seat_ids
        });
    }catch(error){
        await client.query("ROLLBACK");
        console.error(error);
        return res.status(500).json({
            message: "system failure"
        });
    }
};