import { Router } from "express";
import { healthRouter } from "./health";
import { leadsRouter } from "./leads";
import { getComplianceSummary, getPrivacyContactEmail, LEGAL_POLICY_VERSION } from "../compliance";
import * as storage from "../storage";
import { generateToken, verifyToken } from "../auth";
import { stripeService } from "../lib/stripeService";

const router = Router();

router.use("/health", healthRouter);
router.use("/leads", leadsRouter);

// Attach to both / and /api in server/index.ts for compatibility

type BillingInterval = "month" | "year";

function getBearerToken(header?: string | null) {
  if (!header) return "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7) : "";
}

async function resolveUserFromRequest(req: any) {
  const token = getBearerToken(req.headers?.authorization);
  if (!token) return null;
  try {
    const payload = verifyToken(token) as { userId: string };
    const user = await storage.getWorkspaceUserById(payload.userId);
    return user || null;
  } catch {
    return null;
  }
}

function requireAuth(handler: (req: any, res: any, user: storage.WorkspaceUser) => Promise<void>) {
  return async (req: any, res: any) => {
    const user = await resolveUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: "Sessao invalida ou expirada" });
      return;
    }
    await handler(req, res, user);
  };
}

function toWorkspaceScope(user: storage.WorkspaceUser): storage.WorkspaceScope {
  return {
    userId: user.id,
    userName: user.name,
    role: user.role,
    officeName: user.officeName,
    teamName: user.teamName,
    preferredLanguage: user.preferredLanguage,
    planId: user.planId,
  };
}

function requireAdmin(
  handler: (
    req: any,
    res: any,
    user: storage.WorkspaceUser,
    scope: storage.WorkspaceScope
  ) => Promise<void>
) {
  return requireAuth(async (req, res, user) => {
    if (user.role !== "admin") {
      res.status(403).json({ error: "Sem permissao para o painel de administracao" });
      return;
    }

    await handler(req, res, user, toWorkspaceScope(user));
  });
}

router.get("/plans", async (_req, res) => {
  const plans = await storage.listCommercialPlans(null, { includeInactive: false, includePrivate: false });
  res.json(plans);
});

router.get("/compliance", (_req, res) => {
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

router.get("/teams", requireAuth(async (_req, res, user) => {
  const overview = await storage.getTeamOverview(toWorkspaceScope(user));
  res.json(overview);
}));

router.get("/stats", requireAuth(async (_req, res, user) => {
  const stats = await storage.getLeadStats(toWorkspaceScope(user));
  res.json(stats);
}));

// Public stats (fallback) for marketing pages
router.get("/stats/public", async (_req, res) => {
  const stats = await storage.getLeadStats(null);
  res.json(stats);
});

router.get("/market-radar/strategist", requireAuth(async (_req, res, user) => {
  // Placeholder: reuse stats to keep UI active
  const stats = await storage.getLeadStats(toWorkspaceScope(user));
  res.json({
    headline: "Radar ativo",
    summary: "Radar estrategico simplificado com base nas estatisticas atuais.",
    strategicActions: [
      `Priorizar ${stats.flagship_queue} leads flagship com SLA curto.`,
      `Rever ${stats.overdue_followups} follow-ups atrasados hoje.`,
      `Alocar recursos para ${stats.growth_queue} leads growth em fila.`,
    ],
  });
}));

router.get("/admin/system-status", requireAdmin(async (_req, res) => {
  const storageStatus = await storage.prepareStorage();

  res.json({
    ai: Boolean(process.env.OPENAI_API_KEY),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    googleCalendar: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    whatsapp: Boolean(process.env.WHATSAPP_API_KEY && process.env.WHATSAPP_PHONE_NUMBER_ID),
    email: Boolean(
      process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
    ),
    database: storageStatus.databaseReady,
  });
}));

router.get("/admin/plans", requireAdmin(async (_req, res, _user, scope) => {
  const plans = await storage.listCommercialPlans(scope, {
    includeInactive: true,
    includePrivate: true,
  });
  res.json(plans);
}));

router.post("/admin/plans", requireAdmin(async (req, res, _user, scope) => {
  try {
    const plan = await storage.createCommercialPlan(req.body || {}, scope);
    res.status(201).json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao criar plano";
    res.status(400).json({ error: message });
  }
}));

router.patch("/admin/plans/:id", requireAdmin(async (req, res, _user, scope) => {
  try {
    const updated = await storage.updateCommercialPlan(String(req.params.id), req.body || {}, scope);

    if (!updated) {
      res.status(404).json({ error: "Plano nao encontrado" });
      return;
    }

    res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao guardar plano";
    res.status(400).json({ error: message });
  }
}));

router.delete("/admin/plans/:id", requireAdmin(async (req, res, _user, scope) => {
  const deleted = await storage.deleteCommercialPlan(String(req.params.id), scope);

  if (!deleted) {
    res.status(404).json({ error: "Plano nao encontrado" });
    return;
  }

  res.status(204).send();
}));

router.get("/admin/users", requireAdmin(async (_req, res, _user, scope) => {
  const users = await storage.listWorkspaceUsers(scope);
  res.json(users);
}));

router.post("/admin/users", requireAdmin(async (req, res, _user, scope) => {
  try {
    const created = await storage.createWorkspaceUser(req.body || {}, scope);
    res.status(201).json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao criar utilizador";
    res.status(400).json({ error: message });
  }
}));

router.patch("/admin/users/:id", requireAdmin(async (req, res, user, scope) => {
  try {
    const targetId = String(req.params.id);
    if (targetId === user.id && req.body && req.body.isActive === false) {
      res.status(400).json({ error: "Nao e possivel desativar o proprio utilizador admin" });
      return;
    }

    const updated = await storage.updateWorkspaceUser(targetId, req.body || {}, scope);
    if (!updated) {
      res.status(404).json({ error: "Utilizador nao encontrado" });
      return;
    }

    res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao guardar utilizador";
    res.status(400).json({ error: message });
  }
}));

router.delete("/admin/users/:id", requireAdmin(async (req, res, user, scope) => {
  const targetId = String(req.params.id);
  if (targetId === user.id) {
    res.status(400).json({ error: "Nao e possivel remover o proprio utilizador admin" });
    return;
  }

  const deleted = await storage.deleteWorkspaceUser(targetId, scope);
  if (!deleted) {
    res.status(404).json({ error: "Utilizador nao encontrado" });
    return;
  }

  res.status(204).send();
}));

router.post("/trial-requests", async (req, res) => {
  try {
    const result = await storage.createTrialRequest({
      ...req.body,
      source: req.body?.source || "landing",
    });
    res.status(201).json({
      ok: true,
      trialRequestId: result.id,
      message: "Pedido de trial registado. Vamos responder em breve.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao criar pedido de trial";
    res.status(400).json({ ok: false, message });
  }
});

function resolvePriceId(planId: string, interval: BillingInterval) {
  const priceMap: Record<string, string | undefined> = {
    "basic:month": process.env.STRIPE_PRICE_STARTER_MONTHLY,
    "basic:year": process.env.STRIPE_PRICE_STARTER_YEARLY,
    "pro:month": process.env.STRIPE_PRICE_PRO_MONTHLY,
    "pro:year": process.env.STRIPE_PRICE_PRO_YEARLY,
    "custom:month": process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
    "custom:year": process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
  };
  return priceMap[`${planId}:${interval}`];
}

router.post("/payments/checkout-session", async (req, res) => {
  const { planId, billingInterval, customerName, customerEmail } = req.body as {
    planId?: string;
    billingInterval?: BillingInterval;
    customerName?: string;
    customerEmail?: string;
  };

  const normalizedPlan = planId === "basic" || planId === "pro" || planId === "custom" ? planId : "pro";
  const interval: BillingInterval = billingInterval === "year" ? "year" : "month";
  const priceId = resolvePriceId(normalizedPlan, interval);
  const baseUrl = process.env.APP_BASE_URL || req.get("origin") || "http://localhost:3000";

  if (!customerName || !customerEmail) {
    res.status(400).json({ ok: false, message: "Nome e email sao obrigatorios", provider: "stripe" });
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY || !priceId) {
    // Fallback: simulate checkout so CTA nao quebra
    res.json({
      ok: true,
      provider: "stripe",
      sessionId: `simulated_${Date.now()}`,
      paymentMethods: ["card"],
      checkoutUrl: `${baseUrl}/checkout/simulado?plan=${normalizedPlan}&billing=${interval}`,
    });
    return;
  }

  try {
    const customer =
      (await stripeService.findCustomerByEmail(customerEmail)) ||
      (await stripeService.createCustomer(customerEmail, customerName, { planId: normalizedPlan }));

    const session = await stripeService.createCheckoutSession(
      customer.id,
      priceId,
      `${baseUrl}?checkout=success&plan=${normalizedPlan}&billing=${interval}`,
      `${baseUrl}?checkout=cancel&plan=${normalizedPlan}&billing=${interval}`,
      "subscription",
      interval === "year" ? 0 : undefined
    );

    res.json({
      ok: true,
      provider: "stripe",
      sessionId: session.id,
      paymentMethods: ["card"],
      checkoutUrl: session.url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao abrir checkout";
    res.status(500).json({ ok: false, provider: "stripe", message });
  }
});

router.post("/payments/customer-portal-session", requireAuth(async (req, res, user) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(503).json({ ok: false, provider: "stripe", message: "Stripe inativo" });
    return;
  }

  try {
    const customer =
      (await stripeService.findCustomerByEmail(user.email)) ||
      (await stripeService.createCustomer(user.email, user.name, { workspaceUserId: user.id }));
    const baseUrl = process.env.APP_BASE_URL || req.get("origin") || "http://localhost:3000";
    const portal = await stripeService.createCustomerPortalSession(customer.id, baseUrl);
    res.json({ ok: true, provider: "stripe", portalUrl: portal.url, customerId: customer.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao abrir o portal de faturacao";
    res.status(500).json({ ok: false, provider: "stripe", message });
  }
}));

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email e password sao obrigatorios" });
    return;
  }

  const user = await storage.authenticateWorkspaceUser(email, password);
  if (!user) {
    res.status(401).json({ error: "Credenciais invalidas" });
    return;
  }

  const token = generateToken(user.id);
  res.json({ token, user });
});

router.get("/auth/me", async (req, res) => {
  const user = await resolveUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Sessao invalida" });
    return;
  }
  res.json({ user });
});

export { router };
