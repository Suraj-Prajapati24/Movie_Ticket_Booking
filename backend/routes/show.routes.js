import express from "express";
import {
  getShowSeats,
  getShowsByMovie,
  createShow,
  getAllShows,
  deleteShow
} from "../controllers/show.controller.js";import { authenticateToken } from "../middleware/auth.middleware.js";
import { requireManager } from "../middleware/manager.middleware.js";

const router = express.Router();

router.get("/", getAllShows);
router.post("/", authenticateToken, requireManager, createShow);
router.delete("/:show_id", authenticateToken, requireManager, deleteShow);
router.get("/movie/:movie_id", getShowsByMovie);
router.get("/:show_id/seats", getShowSeats);

export default router;