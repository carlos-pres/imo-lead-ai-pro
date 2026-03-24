import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { generateToken, isAuthSecretConfigured, verifyToken } from "./auth.js";
import { getComplianceSummary, LEGAL_POLICY_VERSION } from "./compliance.js";
import { apiRateLimiter, authRateLimiter } from "./middleware/rateLimit.js";
import { sanitizeInputs } from "./middleware/sanitize.js";
import { PLAN_CONFIG, getDefaultPlanId, getPlanConfig } from "./core/plans.js";
import { stripeService } from "./lib/stripeService.js";
import {
  authenticateWorkspaceUser,
  createCommercialPlan,
  createLead,
  createTrialRequest,
  deleteCommercialPlan,
  getAllLeads,
  getLeadStats,
  getTeamOverview,
  getWorkspaceUserById,
  listCommercialPlans,
  listWorkspaceUsers,
  prepareStorage,
  updateCommercialPlan,
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
const hasAuthConfig = isAuthSecretConfigured();
const hasDatabaseConfig =
  Boolean(process.env.DATABASE_URL) ||
  Boolean(
    process.env.PGHOST &&
      process.env.PGPORT &&
      process.env.PGUSER &&
      process.env.PGDATABASE
  );
const hasStripeConfig = Boolean(process.env.STRIPE_SECRET_KEY);

const STRIPE_PRICE_ENV_MAP: Record<"basic" | "pro" | "custom", Record<"month" | "year", string>> = {
  basic: {
    month: "STRIPE_PRICE_STARTER_MONTHLY",
    year: "STRIPE_PRICE_STARTER_YEARLY",
  },
  pro: {
    month: "STRIPE_PRICE_PRO_MONTHLY",
    year: "STRIPE_PRICE_PRO_YEARLY",
  },
  custom: {
    month: "STRIPE_PRICE_ENTERPRISE_MONTHLY",
    year: "STRIPE_PRICE_ENTERPRISE_YEARLY",
  },
};

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function buildAllowedOrigins() {
  const configuredOrigins = [
    process.env.APP_BASE_URL,
    process.env.CORS_ORIGIN,
    process.env.CLIENT_BASE_URL,
  ]
    .map((value) => normalizeOrigin(String(value || "")))
    .filter(Boolean);

  const defaults =
    process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:5173", "http://127.0.0.1:5173"];

  return [...new Set([...configuredOrigins, ...defaults])];
}

function isAllowedRailwayOrigin(origin: string) {
  try {
    const hostname = new URL(origin).hostname;
    return hostname.endsWith(".up.railway.app");
  } catch {
    return false;
  }
}

const allowedOrigins = buildAllowedOrigins();

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = normalizeOrigin(origin);

      if (
        allowedOrigins.includes(normalizedOrigin) ||
        isAllowedRailwayOrigin(normalizedOrigin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin nao autorizada."));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use((req: Request, res: Response, next) => {
  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "font-src 'self' data:",
    "img-src 'self' data: https:",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://api.openai.com https://openrouter.ai https://*.up.railway.app",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join("; ");

  res.setHeader("Content-Security-Policy", contentSecurityPolicy);
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  next();
});
app.use(express.json({ limit: "1mb" }));
app.use(sanitizeInputs);
app.use("/api", apiRateLimiter);
app.use("/api/auth/login", authRateLimiter);

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

function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhoneNumber(value: string) {
  return /^[0-9+\s()-]{9,20}$/.test(value.trim());
}

function getRequestBaseUrl(req: Request) {
  if (process.env.APP_BASE_URL) {
    return String(process.env.APP_BASE_URL).replace(/\/$/, "");
  }

  const protocol = req.headers["x-forwarded-proto"]?.toString().split(",")[0] || req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}`;
}

function getStripePriceId(planId: "basic" | "pro" | "custom", billingInterval: "month" | "year") {
  const envKey = STRIPE_PRICE_ENV_MAP[planId][billingInterval];
  return process.env[envKey] || "";
}

async function getAdminScope(req: Request) {
  const scope = await getRequestScope(req);

  if (scope.role !== "admin") {
    throw new Error("Sem permissao para gerir o painel de administracao.");
  }

  return scope;
}

app.get("/health", (_req: Request, res: Response) => {
  if (process.env.NODE_ENV === "production") {
    res.json({
      ok: true,
      service: "imolead-ai-pro",
    });
    return;
  }

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

app.get("/api/compliance", (_req: Request, res: Response) => {
  const summary = getComplianceSummary();

  res.json({
    ...summary,
    trialRequirements: {
      uniqueEmail: true,
      uniquePhone: true,
      explicitConsentRequired: true,
      policyVersion: LEGAL_POLICY_VERSION,
    },
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

app.get("/api/plans", async (_req: Request, res: Response) => {
  try {
    const plans = await listCommercialPlans();
    res.json(plans);
  } catch (error) {
    sendRouteError(res, error, "Nao foi possivel carregar os planos.");
  }
});

app.post("/api/payments/checkout-session", async (req: Request, res: Response) => {
  const { planId, billingInterval, customerName, customerEmail } = req.body || {};

  if (!hasStripeConfig) {
    return res.status(400).json({
      error: "Pagamentos Stripe ainda nao configurados. Falta STRIPE_SECRET_KEY.",
    });
  }

  if (!planId || !["basic", "pro", "custom"].includes(String(planId))) {
    return res.status(400).json({ error: "Plano invalido para checkout." });
  }

  if (!billingInterval || !["month", "year"].includes(String(billingInterval))) {
    return res.status(400).json({ error: "Periodicidade invalida para checkout." });
  }

  if (!customerName || String(customerName).trim().length < 2) {
    return res.status(400).json({ error: "Nome invalido para ativar o pagamento." });
  }

  if (!customerEmail || !isValidEmailAddress(String(customerEmail))) {
    return res.status(400).json({ error: "Email invalido para ativar o pagamento." });
  }

  const normalizedPlanId = String(planId) as "basic" | "pro" | "custom";
  const normalizedBillingInterval = String(billingInterval) as "month" | "year";
  const stripePriceId = getStripePriceId(normalizedPlanId, normalizedBillingInterval);

  if (!stripePriceId) {
    return res.status(400).json({
      error:
        "Preco Stripe nao configurado para este plano. Define o STRIPE_PRICE correspondente no ambiente.",
    });
  }

  try {
    const plan = getPlanConfig(normalizedPlanId);
    const customer = await stripeService.createCustomer(
      String(customerEmail).trim(),
      String(customerName).trim(),
      {
        planId: normalizedPlanId,
        billingInterval: normalizedBillingInterval,
      }
    );

    const baseUrl = getRequestBaseUrl(req);
    const successUrl = `${baseUrl}/precos?checkout=success&plan=${normalizedPlanId}&billing=${normalizedBillingInterval}`;
    const cancelUrl = `${baseUrl}/precos?checkout=cancel&plan=${normalizedPlanId}&billing=${normalizedBillingInterval}`;

    const session = await stripeService.createCheckoutSession(
      customer.id,
      stripePriceId,
      successUrl,
      cancelUrl,
      "subscription",
      plan.trialDays > 0 ? plan.trialDays : undefined
    );

    if (!session.url) {
      throw new Error("Stripe nao devolveu URL de checkout para esta sessao.");
    }

    res.status(201).json({
      ok: true,
      provider: "stripe",
      checkoutUrl: session.url,
      sessionId: session.id,
      paymentMethods: ["card"],
    });
  } catch (error) {
    console.error("Erro ao criar checkout Stripe", error);
    sendRouteError(res, error, "Nao foi possivel criar a sessao de checkout.");
  }
});

app.post("/api/payments/customer-portal-session", async (req: Request, res: Response) => {
  if (!hasStripeConfig) {
    return res.status(400).json({
      error: "Pagamentos Stripe ainda nao configurados. Falta STRIPE_SECRET_KEY.",
    });
  }

  try {
    const scope = await getRequestScope(req);
    const user = await getWorkspaceUserById(scope.userId);

    if (!user) {
      return res.status(401).json({ error: "Sessao invalida ou expirada." });
    }

    if (!user.email) {
      return res.status(400).json({
        error: "Este utilizador nao tem email valido para abrir o portal de subscricao.",
      });
    }

    const customer = await stripeService.findCustomerByEmail(user.email);

    if (!customer) {
      return res.status(404).json({
        error:
          "Ainda nao encontrámos uma subscricao Stripe para este email. Ativa um plano primeiro ou fala com a equipa.",
      });
    }

    const baseUrl = getRequestBaseUrl(req);
    const returnUrl = `${baseUrl}/precos?portal=return`;
    const portalSession = await stripeService.createCustomerPortalSession(customer.id, returnUrl);

    res.status(201).json({
      ok: true,
      provider: "stripe",
      portalUrl: portalSession.url,
      customerId: customer.id,
    });
  } catch (error) {
    console.error("Erro ao criar portal Stripe", error);
    sendRouteError(res, error, "Nao foi possivel abrir o portal da subscricao.");
  }
});

app.post("/api/trial-requests", async (req: Request, res: Response) => {
  const {
    name,
    email,
    phone,
    requestedPlanId,
    source,
    privacyAccepted,
    termsAccepted,
    aiDisclosureAccepted,
    policyVersion,
  } = req.body || {};

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ error: "Nome invalido para ativar o trial." });
  }

  if (!email || !isValidEmailAddress(String(email))) {
    return res.status(400).json({ error: "Email invalido para ativar o trial." });
  }

  if (!phone || !isValidPhoneNumber(String(phone))) {
    return res.status(400).json({ error: "Telefone invalido para ativar o trial." });
  }

  if (!privacyAccepted || !termsAccepted || !aiDisclosureAccepted) {
    return res.status(400).json({
      error:
        "Para ativar o trial tens de aceitar a Politica de Privacidade, os Termos de Utilizacao e a nota de uso de IA.",
    });
  }

  try {
    const trialRequest = await createTrialRequest({
      name: String(name),
      email: String(email),
      phone: String(phone),
      requestedPlanId: requestedPlanId ? String(requestedPlanId) as "basic" | "pro" | "custom" : "basic",
      source: source ? String(source) : "landing",
      privacyAccepted: Boolean(privacyAccepted),
      termsAccepted: Boolean(termsAccepted),
      aiDisclosureAccepted: Boolean(aiDisclosureAccepted),
      policyVersion: policyVersion ? String(policyVersion) : LEGAL_POLICY_VERSION,
    });

    res.status(201).json({
      ok: true,
      trialRequestId: trialRequest.id,
      message:
        "Trial reservado com sucesso. Email e telefone ficaram validados para impedir reutilizacao do periodo de 15 dias.",
    });
  } catch (error) {
    sendRouteError(res, error, "Nao foi possivel reservar o trial.");
  }
});

app.get("/api/admin/plans", async (req: Request, res: Response) => {
  try {
    const scope = await getAdminScope(req);
    const plans = await listCommercialPlans(scope, {
      includeInactive: true,
      includePrivate: true,
    });
    res.json(plans);
  } catch (error) {
    sendRouteError(res, error, "Nao foi possivel carregar o catalogo admin.");
  }
});

app.post("/api/admin/plans", async (req: Request, res: Response) => {
  try {
    const scope = await getAdminScope(req);
    const createdPlan = await createCommercialPlan(req.body, scope);
    res.status(201).json(createdPlan);
  } catch (error) {
    sendRouteError(res, error, "Nao foi possivel criar o plano.");
  }
});

app.patch("/api/admin/plans/:id", async (req: Request, res: Response) => {
  try {
    const scope = await getAdminScope(req);
    const updatedPlan = await updateCommercialPlan(req.params.id, req.body, scope);

    if (!updatedPlan) {
      return res.status(404).json({ error: "Plano nao encontrado." });
    }

    res.json(updatedPlan);
  } catch (error) {
    sendRouteError(res, error, "Nao foi possivel atualizar o plano.");
  }
});

app.delete("/api/admin/plans/:id", async (req: Request, res: Response) => {
  try {
    const scope = await getAdminScope(req);
    const removed = await deleteCommercialPlan(req.params.id, scope);

    if (!removed) {
      return res.status(404).json({ error: "Plano nao encontrado." });
    }

    res.status(204).send();
  } catch (error) {
    sendRouteError(res, error, "Nao foi possivel remover o plano.");
  }
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
  if (process.env.NODE_ENV === "production" && !hasAuthConfig) {
    throw new Error("JWT_SECRET ou SESSION_SECRET sao obrigatorios para arrancar em producao.");
  }

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
