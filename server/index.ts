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
