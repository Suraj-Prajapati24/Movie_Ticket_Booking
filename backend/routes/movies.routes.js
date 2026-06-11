import express from "express";
import {
  getAllMovies,
  createMovie,
  deleteMovie
} from "../controllers/movies.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { requireManager } from "../middleware/manager.middleware.js";

const router = express.Router();

router.get("/", getAllMovies);
router.post("/", authenticateToken, requireManager, createMovie);
router.delete("/:movie_id", authenticateToken, requireManager, deleteMovie);

export default router;