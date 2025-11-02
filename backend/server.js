// server.js - ALTERNATIVE
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import sequelize from "./config/db.js";
import signalRoutes from "./routes/signalRoutes.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api/signals", signalRoutes);
app.use("/api/admin", adminRoutes);

// Test connection saja, tanpa sync
sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connected");
    app.listen(5000, () => console.log("🚀 Server running on port 5000"));
  })
  .catch(error => {
    console.error("❌ Database connection failed:", error);
  });