import express from "express";
import { getShowSeats } from "../controllers/show.controller.js";

const showRouter = express.Router();

showRouter.get("/:show_id/seats", getShowSeats);

export default showRouter;