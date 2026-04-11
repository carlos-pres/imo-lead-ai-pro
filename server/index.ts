import "dotenv/config";
import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";
import { router } from "./routes";
import { sanitizeInputs } from "./middleware/sanitize";
import { apiRateLimiter } from "./middleware/rateLimit";
import { healthRouter } from "./routes/health";

const app = express();

app.disable("x-powered-by");

// Railway/Reverse-proxy environments send X-Forwarded-For.
// Express must trust the proxy hop so rate-limit can resolve client IP correctly.
const trustProxyEnv = process.env.TRUST_PROXY?.trim().toLowerCase();
if (trustProxyEnv) {
  if (trustProxyEnv === "true") {
    app.set("trust proxy", 1);
  } else if (trustProxyEnv === "false") {
    app.set("trust proxy", false);
  } else {
    const parsedHops = Number(trustProxyEnv);
    app.set("trust proxy", Number.isFinite(parsedHops) ? parsedHops : trustProxyEnv);
  }
} else {
  const runningOnRailway = Boolean(
    process.env.RAILWAY_PROJECT_ID || process.env.RAILWAY_SERVICE_ID || process.env.RAILWAY_ENVIRONMENT
  );
  if (runningOnRailway) {
    app.set("trust proxy", 1);
  }
}

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  })
);
app.use((_req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use(sanitizeInputs);
app.use(apiRateLimiter);

// API routes first
app.use("/api", router);
app.use("/health", healthRouter);

// Serve built frontend when available (Railway prod)
const clientBuildCandidates = [
  path.join(__dirname, "../client"),
  path.join(process.cwd(), "dist/client"),
  path.join(process.cwd(), "client/dist"),
];

const clientBuildPath = clientBuildCandidates.find((candidate) =>
  candidate && candidate.length > 0 && fs.existsSync(path.join(candidate, "index.html"))
);

if (clientBuildPath) {
  app.use(express.static(clientBuildPath));

  const spaRoutes = [
    "/",
    "/funcionalidades",
    "/precos",
    "/contacto",
    "/entrar",
    "/criar-conta",
    "/register",
    "/app",
    "/app/*",
  ];

  spaRoutes.forEach((route) => {
    app.get(route, (_req, res) => {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    });
  });
} else {
  console.warn("client build not found; skipping static file serving");
}

app.get("/", (_req, res) => {
  res.json({
    name: "ImoLead AI Pro API",
    status: "ok",
    version: "v1",
  });
});

const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`ImoLead AI Pro API listening on http://${HOST}:${PORT}`);
});
