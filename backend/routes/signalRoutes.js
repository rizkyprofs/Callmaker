// routes/signalRoutes.js - COMPLETE FIX
import express from "express";
import Signal from "../models/Signal.js";
import User from "../models/User.js";
import authenticateToken from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";

const router = express.Router();

// GET signals dengan filter berdasarkan role
router.get("/signals", authenticateToken, async (req, res) => {
  try {
    let whereCondition = {};
    
    // Filter berdasarkan role
    if (req.user.role === "user") {
      whereCondition.status = "approved";
    } else if (req.user.role === "callmaker") {
      whereCondition.created_by = req.user.id;
    }

    const signals = await Signal.findAll({
      where: whereCondition,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'fullname']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json(signals);
  } catch (error) {
    console.error("Get signals error:", error);
    res.status(500).json({ message: "Error fetching signals" });
  }
});

// CREATE signal (hanya callmaker & admin)
router.post("/signals", authenticateToken, authorizeRoles(["callmaker", "admin"]), async (req, res) => {
  try {
    const { coin_name, entry_price, target_price, stop_loss, note, chart_image } = req.body;
    
    if (!coin_name || !entry_price || !target_price || !stop_loss) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const signal = await Signal.create({
      coin_name,
      entry_price: parseFloat(entry_price),
      target_price: parseFloat(target_price),
      stop_loss: parseFloat(stop_loss),
      note,
      chart_image,
      created_by: req.user.id,
      status: req.user.role === "admin" ? "approved" : "pending"
    });

    const signalWithCreator = await Signal.findByPk(signal.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'fullname']
      }]
    });

    res.status(201).json({ 
      message: req.user.role === "admin" ? "Signal published" : "Signal submitted for approval",
      signal: signalWithCreator 
    });
  } catch (error) {
    console.error("Create signal error:", error);
    res.status(500).json({ message: "Error creating signal" });
  }
});

// UPDATE signal status (hanya admin)
router.patch("/signals/:id/status", authenticateToken, authorizeRoles(["admin"]), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const signal = await Signal.findByPk(req.params.id);
    if (!signal) {
      return res.status(404).json({ message: "Signal not found" });
    }

    await signal.update({ status });
    
    res.json({ 
      message: `Signal ${status}`,
      signal 
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating signal" });
  }
});

// DELETE signal (hanya admin & creator)
router.delete("/signals/:id", authenticateToken, async (req, res) => {
  try {
    const signal = await Signal.findByPk(req.params.id);
    
    if (!signal) {
      return res.status(404).json({ message: "Signal not found" });
    }

    if (signal.created_by !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await signal.destroy();
    res.json({ message: "Signal deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting signal" });
  }
});

// GET pending signals count (untuk admin notification)
router.get("/signals/pending/count", authenticateToken, authorizeRoles(["admin"]), async (req, res) => {
  try {
    const count = await Signal.count({
      where: { status: "pending" }
    });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Error fetching pending count" });
  }
});

export default router;