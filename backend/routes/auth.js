// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  const { username, password, fullname } = req.body;

  const existing = await User.findOne({ where: { username } });
  if (existing) return res.status(400).json({ message: "Username already exists" });

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ username, password: hashed, fullname });

  res.json({ message: "Register success" });
});

// LOGIN
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ where: { username } });
  if (!user) return res.status(404).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ message: "Login success", token });
});

// PROTECTED
router.get("/protected", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ message: "Access granted" });
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
});

export default router;
