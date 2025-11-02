// server.js - FIXED VERSION
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import signalRoutes from "./routes/signalRoutes.js";
import sequelize from "./config/db.js";
import "./models/User.js";
import "./models/Signal.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", signalRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    database: "Connected",
    timestamp: new Date().toISOString()
  });
});

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});