import client from "../dbConnection.js";

// The 5 physical screens. Used by the admin "Add Show" form to pick a screen,
// and to show each screen's seating capacity.
export const getAllScreens = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT
         screen_id,
         screen_number,
         name,
         total_rows,
         seats_per_row,
         (total_rows * seats_per_row) AS capacity
       FROM screens
       ORDER BY screen_number`
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch screens" });
  }
};
