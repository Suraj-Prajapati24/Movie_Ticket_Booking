import client from "../dbConnection.js";

export const getShowSeats = async (req, res) => {
    const show_id = req.params.show_id;
    try{
        const seats = await client.query(`
            SELECT seat_id, seat_number, is_booked 
            FROM seats WHERE show_id = $1
            ORDER BY seat_number`,
            [show_id]
        );
        return res.status(200).json(seats.rows);
    }catch(error){
        console.log(error);
        return res.status(500).json({
            message : "Failed to fetch seats",
            error: error.message
        });
    }
};