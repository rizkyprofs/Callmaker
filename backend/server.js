// server.js - SIMPLIFIED FIXED VERSION
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import signalRoutes from "./routes/signalRoutes.js";
import sequelize from "./config/db.js";
import User from "./models/User.js";
import Signal from "./models/Signal.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", signalRoutes);

// ✅ ✅ ✅ FIXED ROUTES UNTUK DASHBOARD ✅ ✅ ✅

// Get current user data
app.get("/api/user", async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Dynamic import untuk jwt
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's signals
app.get("/api/signals/user", async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const signals = await Signal.findAll({
      where: { userId: decoded.userId },
      order: [['createdAt', 'DESC']]
    });

    res.json(signals || []);
  } catch (error) {
    console.error('Error fetching signals:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    res.json([]);
  }
});

// Get pending signals count
app.get("/api/signals/pending/count", async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const count = await Signal.count({
      where: { 
        userId: decoded.userId,
        status: 'pending'
      }
    });

    res.json({ count: count || 0 });
  } catch (error) {
    console.error('Error counting pending signals:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    res.json({ count: 0 });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    database: "Connected",
    timestamp: new Date().toISOString()
  });
});

// Setup associations
User.associate({ Signal });
Signal.associate({ User });

// Sync database
sequelize.sync({ force: false })
  .then(() => {
    console.log('✅ Database synced successfully');
  })
  .catch((error) => {
    console.error('❌ Database sync error:', error);
  });

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
  console.log("📊 Dashboard routes available:");
  console.log("   GET /api/user");
  console.log("   GET /api/signals/user"); 
  console.log("   GET /api/signals/pending/count");
});