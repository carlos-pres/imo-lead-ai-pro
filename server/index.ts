import "dotenv/config";
import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";
import { router } from "./routes";

const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(express.json());

// API routes first
app.use("/", router);
app.use("/api", router);

// Serve built frontend when available (Railway prod)
const clientBuildPath = path.join(__dirname, "../client");
const hasClientBuild = fs.existsSync(path.join(clientBuildPath, "index.html"));

if (hasClientBuild) {
  app.use(express.static(clientBuildPath));
  // SPA fallback
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
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
