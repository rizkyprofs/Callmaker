// middleware/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export default function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // 1️⃣ Cek header Authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token tidak ditemukan" });
    }

    // 2️⃣ Ambil token
    const token = authHeader.split(" ")[1];

    // 3️⃣ Verifikasi token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contoh isi: { id, username, role }

    // 4️⃣ Lanjut ke route berikutnya
    next();
  } catch (err) {
    console.error("Auth Error:", err.message);
    return res.status(401).json({ message: "Token tidak valid atau sudah kedaluwarsa" });
  }
}
