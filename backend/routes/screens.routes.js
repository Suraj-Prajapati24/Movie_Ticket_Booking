import express from "express";
import { getAllScreens } from "../controllers/screens.controller.js";

const router = express.Router();

router.get("/", getAllScreens);

export default router;
