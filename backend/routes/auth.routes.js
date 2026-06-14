import express from "express";
import { loginUser, registerUser } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/profile", authenticateToken, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.userDetails,
  });
});

export default router;
