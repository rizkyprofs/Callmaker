// routes/signalRoutes.js - UPDATE IMPORT
import express from "express";
import Signal from "../models/Signal.js"; // ⚠️ IMPORT LANGSUNG
import authenticateToken from "../middleware/auth.js";

const router = express.Router();

// Routes untuk signals...
router.get("/signals", authenticateToken, async (req, res) => {
  try {
    const signals = await Signal.findAll();
    res.json(signals);
  } catch (error) {
    res.status(500).json({ message: "Error fetching signals" });
  }
});

// ... tambahkan routes lainnya

export default router;