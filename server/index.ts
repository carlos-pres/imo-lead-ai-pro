import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { generateToken, verifyToken } from "./auth.js";
import { PLAN_CONFIG, getDefaultPlanId, getPlanConfig } from "./core/plans.js";
import {
  authenticateWorkspaceUser,
  createLead,
  getAllLeads,
  getLeadStats,
  getTeamOverview,
  getWorkspaceUserById,
  listWorkspaceUsers,
  prepareStorage,
  updateLeadWorkflow,
  type WorkspaceScope,
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
const hasAuthConfig = Boolean(process.env.JWT_SECRET || process.env.SESSION_SECRET);
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

function getAuthorizationToken(req: Request) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

async function getRequestScope(req: Request, required = true) {
  const token = getAuthorizationToken(req);

  if (!token) {
    if (!required) {
      return null;
    }

    throw new Error("AUTH_REQUIRED");
  }

  try {
    const payload = verifyToken(token);
    const user = await getWorkspaceUserById(payload.userId);

    if (!user) {
      throw new Error("AUTH_INVALID");
    }

    return {
      userId: user.id,
      userName: user.name,
      role: user.role,
      officeName: user.officeName,
      teamName: user.teamName,
      preferredLanguage: user.preferredLanguage,
      planId: user.planId,
    } satisfies WorkspaceScope;
  } catch {
    throw new Error("AUTH_INVALID");
  }
}

function sendRouteError(res: Response, error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage;

  if (message === "AUTH_REQUIRED") {
    return res.status(401).json({ error: "Sessao obrigatoria." });
  }

  if (message === "AUTH_INVALID") {
    return res.status(401).json({ error: "Sessao invalida ou expirada." });
  }

  if (/permissao/i.test(message)) {
    return res.status(403).json({ error: message });
  }

  return res.status(400).json({ error: message || fallbackMessage });
}

app.get("/health", (_req: Request, res: Response) => {
  const defaultPlanId = getDefaultPlanId();
  res.json({
    ok: true,
    service: "imolead-ai-pro",
    aiMode: hasAiProvider ? "hybrid" : "heuristic",
    authConfigured: hasAuthConfig,
    databaseConfigured: hasDatabaseConfig,
    defaultPlanId,
    defaultPlanName: getPlanConfig(defaultPlanId).publicName,
  });
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email e password sao obrigatorios." });
  }

  const user = await authenticateWorkspaceUser(String(email), String(password));

  if (!user) {
    return res.status(401).json({ error: "Credenciais invalidas." });
  }

  res.json({
    token: generateToken(user.id),
    user,
  });
});

app.get("/api/auth/me", async (req: Request, res: Response) => {
  try {
    const scope = await getRequestScope(req);
    const user = await getWorkspaceUserById(scope.userId);

    if (!user) {
      return res.status(401).json({ error: "Sessao invalida ou expirada." });
    }

    res.json({ user });
  } catch (error) {
    sendRouteError(res, error, "Nao foi possivel validar a sessao.");
  }
});

app.get("/api/auth/users", async (req: Request, res: Response) => {
  try {
    const scope = await getRequestScope(req);
    const users = await listWorkspaceUsers(scope);
    res.json(users);
  } catch (error) {
    sendRouteError(res, error, "Nao foi possivel carregar os utilizadores.");
  }
});

app.get(["/leads", "/api/leads"], async (req: Request, res: Response) => {
  try {
    const scope = await getRequestScope(req);
    const leads = await getAllLeads(scope);
    res.json(leads);
  } catch (error) {
    sendRouteError(res, error, "Nao foi possivel carregar os leads.");
  }
});

app.get("/api/stats", async (req: Request, res: Response) => {
  try {
    const scope = await getRequestScope(req);
    const stats = await getLeadStats(scope);
    res.json(stats);
  } catch (error) {
    sendRouteError(res, error, "Nao foi possivel carregar as metricas.");
  }
});

app.get("/api/teams", async (req: Request, res: Response) => {
  try {
    const scope = await getRequestScope(req);
    const teams = await getTeamOverview(scope);
    res.json(teams);
  } catch (error) {
    sendRouteError(res, error, "Nao foi possivel carregar as equipas.");
  }
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
    planId,
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

  try {
    const scope = await getRequestScope(req);
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
      planId,
    }, scope);

    res.status(201).json(lead);
  } catch (error) {
    sendRouteError(res, error, "Nao foi possivel criar o lead.");
  }
});

app.patch("/api/leads/:id/workflow", async (req: Request, res: Response) => {
  try {
    const scope = await getRequestScope(req);
    const { id } = req.params;
    const { pipelineStage, assignedOwner, nextStep, followUpAt, lastContactAt } = req.body || {};

    const lead = await updateLeadWorkflow(
      id,
      {
        pipelineStage,
        assignedOwner,
        nextStep,
        followUpAt,
        lastContactAt,
      },
      scope
    );

    if (!lead) {
      return res.status(404).json({ error: "Lead nao encontrado" });
    }

    res.json(lead);
  } catch (error) {
    sendRouteError(res, error, "Nao foi possivel atualizar o workflow.");
  }
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

async function startServer() {
  const storageState = await prepareStorage();

  if (storageState.mode === "database") {
    console.log("Storage ready: PostgreSQL connected and migrations applied.");
  } else if (hasDatabaseConfig) {
    console.warn("Storage fallback active: database configured but unavailable, using memory.");
  } else {
    console.log("Storage ready: in-memory mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Server bootstrap failed:", error);
  process.exit(1);
});
