import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import semua router dari folder routes
import authRoutes from "./routes/authRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import userRoutes from "./routes/userRoutes.js"; // 1. Tambahkan Import userRoutes di sini

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Utama (Konfigurasi CORS Spesifik)
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

// Body Parser dengan Limit Gambar
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Main Routes
app.use("/api/auth", authRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes); // 2. Tambahkan Route User di sini

// Test Route (Pengecekan apakah server jalan)
app.get("/", (req, res) => {
  res.send("Backend FlowTrack API Berjalan!");
});

// Jalankan Server
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server Express aktif di http://localhost:${PORT}`);
});