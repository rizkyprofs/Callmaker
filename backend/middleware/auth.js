import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export default function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token tidak ditemukan" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    console.error("Auth Error:", err.message);
    return res.status(401).json({ message: "Token tidak valid atau sudah kedaluwarsa" });
  }
}