// routes/signal.js
import express from "express";
import Signal from "../models/Signal.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Semua sinyal yang sudah di-approve
router.get("/approved", async (req, res) => {
  try {
    const signals = await Signal.findAll({
      where: { status: "approved" },
      order: [["created_at", "DESC"]],
    });
    res.json(signals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Sinyal milik user tertentu (kalau nanti mau dashboard pribadi)
router.get("/my", verifyToken, async (req, res) => {
  try {
    const signals = await Signal.findAll({
      where: { created_by: req.user.id },
      order: [["created_at", "DESC"]],
    });
    res.json(signals);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
