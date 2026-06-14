import express from "express";
import cors from 'cors'

import router from "./routes/auth.routes.js";
import dotenv from "dotenv";
import bookingRouter from "./routes/bookings.routes.js";
import showRouter from "./routes/show.routes.js";
import moviesRouter from "./routes/movies.routes.js";
import screensRouter from "./routes/screens.routes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/auth", router);
app.use("/bookings", bookingRouter);
app.use("/shows", showRouter);
app.use("/movies", moviesRouter);
app.use("/screens", screensRouter);

// TODO: For development purpose uncomment and comment export
// app.listen(5000, () => {
//     console.log("app is listenging");
// })

export default app;