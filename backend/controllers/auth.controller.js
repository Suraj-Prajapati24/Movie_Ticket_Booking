import client from "../dbConnection.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Falls back to a dev secret so the app runs locally without a .env entry.
// In production JWT_SECRET MUST be set to a strong random value.
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "requires all fields" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Parameterized query — values are sent separately from the SQL text, so a
    // crafted email like "' OR '1'='1" is treated as data, never as SQL.
    const alreadyExisting = await client.query(
      `SELECT 1 FROM users WHERE email = $1`,
      [normalizedEmail]
    );
    if (alreadyExisting.rowCount) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPass = await bcrypt.hash(password, 10);
    const createUser = await client.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'client')
       RETURNING user_id, username, email, role`,
      [String(username).trim(), normalizedEmail, hashedPass]
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: createUser.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "requires all fields" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const userDetails = await client.query(
      `SELECT user_id, username, email, password_hash, role
       FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    // Same generic message whether the email is unknown or the password is
    // wrong — avoids leaking which emails are registered.
    if (userDetails.rowCount === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = userDetails.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "User logged in successfully",
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "SERVER ERROR" });
  }
};
