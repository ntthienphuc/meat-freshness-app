/**
 * Meat Freshness App – Improved Express Backend
 * - Serves frontend from /public
 * - /api/health and /api/analyze (mock) endpoints
 * - Hardening: helmet, CORS (configurable), compression, rate limiting, logging, env support
 * - Robust error handling and 404s
 */
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---- Configs ----
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const TRUST_PROXY = process.env.TRUST_PROXY === "true"; // for rate-limit behind proxy

if (TRUST_PROXY) {
  app.set("trust proxy", 1);
}

// ---- Middlewares ----
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "script-src": ["'self'", "'unsafe-inline'"],
    }
  }
}));
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "10mb" }));
app.use(compression());
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

// Basic rate limiter for API routes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 120,          // max 120 requests per minute per IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

// ---- Health check ----
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "meat-freshness-backend", version: "1.1.0" });
});

// ---- Mock analyze ----
app.post("/api/analyze", (req, res, next) => {
  try {
    const { imageBase64 = "", meatType = "pork" } = req.body || {};
    const allowed = new Set(["pork", "beef", "chicken"]);
    const normalizedType = String(meatType || "").toLowerCase();
    if (!allowed.has(normalizedType)) {
      return res.status(400).json({ ok: false, error: "meatType must be 'pork' | 'beef' | 'chicken'" });
    }
    const str = `${normalizedType}:${(imageBase64||"").slice(0,128)}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    const level = (hash % 5) + 1; // 1..5
    const score = 20 * level;     // 20..100
    const levelLabels = {
      1: "Không an toàn",
      2: "Gần hỏng",
      3: "Cần lưu ý",
      4: "Tươi dùng ngay",
      5: "Tươi mới",
    };
    const suggestions = {
      pork: "Giữ ở 0–4°C, dùng trong 2–3 ngày. Tránh để ở nhiệt độ phòng quá 2 giờ.",
      beef: "Bảo quản riêng, 0–4°C, dùng 3–5 ngày. Rửa dao thớt sau khi chế biến.",
      chicken: "Luôn nấu chín kỹ. 0–4°C, dùng 1–2 ngày; đông lạnh 9–12 tháng.",
    };
    return res.json({
      ok: true,
      meatType: normalizedType,
      score,
      level,
      levelLabel: levelLabels[level],
      advice: suggestions[normalizedType] || suggestions.pork,
    });
  } catch (err) {
    return next(err);
  }
});

// ---- Static serving with cache headers ----
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir, {
  etag: true,
  lastModified: true,
  maxAge: NODE_ENV === "production" ? "7d" : 0,
  setHeaders: (res, filePath) => {
    if (/\.(html)$/.test(filePath)) {
      res.setHeader("Cache-Control", "no-cache");
    }
  }
}));

// ---- 404 for /api/* ----
app.use("/api", (_req, res) => {
  res.status(404).json({ ok: false, error: "API route not found" });
});

// ---- SPA fallback ----
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ---- Error handler ----
app.use((err, _req, res, _next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ ok: false, error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT} (${NODE_ENV})`);
});
