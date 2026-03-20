import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { PLAN_CONFIG } from "./core/plans.js";
import {
  createLead,
  getAllLeads,
  getLeadStats,
  getTeamOverview,
  updateLeadWorkflow,
} from "./storage.js";

const app = express();
const clientDistPath = path.resolve(process.cwd(), "dist/client");
const clientIndexPath = path.join(clientDistPath, "index.html");
const hasClientBuild = fs.existsSync(clientIndexPath);
const hasAiProvider =
  Boolean(process.env.OPENAI_API_KEY) ||
  Boolean(
    process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL &&
      process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY
  );
const hasDatabaseConfig =
  Boolean(process.env.DATABASE_URL) ||
  Boolean(
    process.env.PGHOST &&
      process.env.PGPORT &&
      process.env.PGUSER &&
      process.env.PGDATABASE
  );

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: "imolead-ai-pro",
    aiMode: hasAiProvider ? "hybrid" : "heuristic",
    databaseConfigured: hasDatabaseConfig,
  });
});

app.get(["/leads", "/api/leads"], async (_req: Request, res: Response) => {
  const leads = await getAllLeads();
  res.json(leads);
});

app.get("/api/stats", async (_req: Request, res: Response) => {
  const stats = await getLeadStats();
  res.json(stats);
});

app.get("/api/teams", async (_req: Request, res: Response) => {
  const teams = await getTeamOverview();
  res.json(teams);
});

app.get("/api/plans", (_req: Request, res: Response) => {
  res.json(Object.values(PLAN_CONFIG));
});

app.post(["/lead", "/api/leads"], async (req: Request, res: Response) => {
  const {
    name,
    property,
    location,
    price,
    area,
    source,
    status,
    contact,
    notes,
    countryCode,
    preferredLanguage,
  } = req.body || {};

  if (!name || !location || price === undefined || price === null) {
    return res.status(400).json({
      error: "Campos obrigatorios: name, location e price",
    });
  }

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({ error: "price deve ser um numero valido" });
  }

  const lead = await createLead({
    name,
    property,
    location,
    price: numericPrice,
    area: area !== undefined && area !== null ? Number(area) : null,
    source,
    status,
    contact,
    notes,
    countryCode,
    preferredLanguage,
  });

  res.status(201).json(lead);
});

app.patch("/api/leads/:id/workflow", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { pipelineStage, assignedOwner, nextStep, followUpAt, lastContactAt } = req.body || {};

  const lead = await updateLeadWorkflow(id, {
    pipelineStage,
    assignedOwner,
    nextStep,
    followUpAt,
    lastContactAt,
  });

  if (!lead) {
    return res.status(404).json({ error: "Lead nao encontrado" });
  }

  res.json(lead);
});

if (hasClientBuild) {
  app.use(express.static(clientDistPath));

  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(clientIndexPath);
  });
} else {
  app.get("/", (_req: Request, res: Response) => {
    res.send("ImoLead AI Pro online");
  });
}

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
