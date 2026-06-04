import express from "express";
import {
  getShowSeats,
  getShowsByMovie,
} from "../controllers/show.controller.js";

const router = express.Router();

router.get("/:show_id/seats", getShowSeats);
router.get("/movie/:movie_id", getShowsByMovie);

export default router;