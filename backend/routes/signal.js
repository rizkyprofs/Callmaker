import express from "express";
import authenticate from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/role.js";
import Signal from "../models/Signal.js";

const express = require('express');
const router = express.Router();
const Signal = require('../models/Signal');
const auth = require('../middleware/auth');

// 🔹 Semua user bisa lihat sinyal yang sudah di-ACC
router.get("/", authenticate, async (req, res) => {
  try {
    const signals = await Signal.findAll({ where: { status: "approved" } });
    res.json(signals);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data sinyal" });
  }
});

// 🔹 Callmaker boleh menambahkan sinyal baru
router.post("/", authenticate, authorizeRoles("callmaker", "admin"), async (req, res) => {
  try {
    const { title, pair, entry, takeProfit, stopLoss } = req.body;
    const newSignal = await Signal.create({
      title,
      pair,
      entry,
      takeProfit,
      stopLoss,
      status: "pending",
      created_by: req.user.id,
    });
    res.json({ message: "Sinyal berhasil ditambahkan", signal: newSignal });
  } catch (err) {
    res.status(500).json({ message: "Gagal menambahkan sinyal" });
  }
});

// UPDATE signal status (approve/reject)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validasi status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const signal = await Signal.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }

    res.json(signal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ - UPDATE signal (edit)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { coin_name, entry_price, target_price, stop_loss, note } = req.body;
    
    const signal = await Signal.findByIdAndUpdate(
      id,
      { coin_name, entry_price, target_price, stop_loss, note },
      { new: true }
    );

    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }

    // Cek ownership (hanya creator yang bisa edit)
    if (signal.created_by.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this signal' });
    }

    res.json(signal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ - DELETE signal
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const signal = await Signal.findById(id);
    
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }

    // Cek ownership (hanya creator atau admin yang bisa delete)
    if (signal.created_by.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this signal' });
    }

    await Signal.findByIdAndDelete(id);
    res.json({ message: 'Signal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
