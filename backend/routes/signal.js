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

export default router;
