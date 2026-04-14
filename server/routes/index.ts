import { Router } from "express";
import jwt from "jsonwebtoken";
import { healthRouter } from "./health";
import { leadsRouter } from "./leads";
import { getComplianceSummary, getPrivacyContactEmail, LEGAL_POLICY_VERSION } from "../compliance";
import * as storage from "../storage";
import { generateToken, verifyToken } from "../auth";
import { sendPasswordResetEmail, sendVerificationEmail } from "../lib/email";
import {
  getAuthUrl as getGoogleCalendarAuthUrl,
  handleCallback as handleGoogleCalendarCallback,
  isGoogleOAuthConfigured,
  validateSignedState as validateGoogleCalendarState,
} from "../lib/googleCalendarOAuth";
import { stripeService } from "../lib/stripeService";
import { authRateLimiter } from "../middleware/rateLimit";
import { validateContact, validateLogin, validateTrialRequest } from "../middleware/validation";

const router = Router();

router.use("/health", healthRouter);
router.use("/leads", leadsRouter);

// Attach to both / and /api in server/index.ts for compatibility

type BillingInterval = "month" | "year";

function getBearerToken(header?: string | null) {
  if (!header) return "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7) : "";
}

function getAccountTokenSecret() {
  return process.env.JWT_SECRET || process.env.SESSION_SECRET || "dev-secret";
}

function signAccountToken(payload: object, expiresIn: string) {
  return jwt.sign(payload, getAccountTokenSecret(), { expiresIn });
}

function verifyAccountToken<T extends object>(token: string): T {
  return jwt.verify(token, getAccountTokenSecret()) as T;
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
    const createdUser = await storage.getWorkspaceUserByIdentifier(created.email);

    if (createdUser) {
      const token = signAccountToken(
        { userId: createdUser.id, purpose: "email-verify" },
        "7d"
      );
      await sendVerificationEmail(createdUser.email, createdUser.name, token);
    }

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

router.post("/trial-requests", authRateLimiter, validateTrialRequest, async (req, res) => {
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

router.post("/auth/login", authRateLimiter, validateLogin, async (req, res) => {
  const { email, identifier, password } = req.body as { email?: string; identifier?: string; password?: string };
  const loginIdentifier = email || identifier;

  if (!loginIdentifier || !password) {
    res.status(400).json({ error: "Email, telefone e palavra-passe sao obrigatorios" });
    return;
  }

  const user = await storage.authenticateWorkspaceUser(loginIdentifier, password);
  if (!user) {
    res.status(401).json({ error: "Credenciais invalidas" });
    return;
  }

  const token = generateToken(user.id);
  res.json({ token, user });
});

router.post("/auth/logout", (_req, res) => {
  res.json({ ok: true });
});

router.post("/auth/request-email-verification", authRateLimiter, async (req, res) => {
  const { email, identifier } = req.body as { email?: string; identifier?: string };
  const loginIdentifier = email || identifier;

  if (!loginIdentifier) {
    res.status(400).json({ ok: false, message: "Email ou telefone sao obrigatorios" });
    return;
  }

  const user = await storage.getWorkspaceUserByIdentifier(loginIdentifier);
  if (!user) {
    res.json({ ok: true, message: "Se existir uma conta, o email de verificacao foi enviado." });
    return;
  }

  const token = signAccountToken({ userId: user.id, purpose: "email-verify" }, "7d");
  const sent = await sendVerificationEmail(user.email, user.name, token);

  res.json({
    ok: true,
    sent,
    message: sent
      ? "Email de verificacao enviado."
      : "Conta encontrada, mas nao foi possivel enviar o email neste momento.",
  });
});

router.get("/auth/verify-email", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";

  if (!token) {
    res.status(400).json({ ok: false, message: "Token em falta" });
    return;
  }

  try {
    const payload = verifyAccountToken<{ userId: string; purpose: string }>(token);
    if (payload.purpose !== "email-verify") {
      throw new Error("Token invalido");
    }

    const updated = await storage.markWorkspaceUserEmailVerified(payload.userId);
    if (!updated) {
      throw new Error("Utilizador nao encontrado");
    }

    const baseUrl = process.env.APP_BASE_URL || req.get("origin") || "http://localhost:3000";
    res.redirect(`${baseUrl}/entrar?verified=1`);
  } catch (error) {
    const baseUrl = process.env.APP_BASE_URL || req.get("origin") || "http://localhost:3000";
    const message = error instanceof Error ? error.message : "Nao foi possivel verificar o email";
    res.redirect(`${baseUrl}/entrar?verified=0&error=${encodeURIComponent(message)}`);
  }
});

router.post("/auth/request-password-reset", authRateLimiter, async (req, res) => {
  const { email, identifier } = req.body as { email?: string; identifier?: string };
  const loginIdentifier = email || identifier;

  if (!loginIdentifier) {
    res.status(400).json({ ok: false, message: "Email ou telefone sao obrigatorios" });
    return;
  }

  const user = await storage.getWorkspaceUserByIdentifier(loginIdentifier);
  if (!user) {
    res.json({ ok: true, message: "Se existir uma conta, recebera instrucoes por email." });
    return;
  }

  const token = signAccountToken({ userId: user.id, purpose: "password-reset" }, "2h");
  const sent = await sendPasswordResetEmail(user.email, user.name, token);

  res.json({
    ok: true,
    sent,
    message: sent
      ? "Email de recuperacao enviado."
      : "Conta encontrada, mas nao foi possivel enviar o email neste momento.",
  });
});

router.post("/auth/register", authRateLimiter, validateTrialRequest, async (req, res) => {
  try {
    const result = await storage.createTrialRequest({
      ...req.body,
      source: req.body?.source || "register",
    });

    res.status(201).json({
      ok: true,
      trialRequestId: result.id,
      message: "Conta de teste registada com sucesso.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao registar conta de teste";
    res.status(400).json({ ok: false, message });
  }
});

router.post("/auth/reset-password", authRateLimiter, async (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string };

  if (!token || !password) {
    res.status(400).json({ ok: false, message: "Token e nova password sao obrigatorios" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ ok: false, message: "A password deve ter pelo menos 8 caracteres" });
    return;
  }

  try {
    const payload = verifyAccountToken<{ userId: string; purpose: string }>(token);
    if (payload.purpose !== "password-reset") {
      throw new Error("Token invalido");
    }

    const updated = await storage.updateWorkspaceUserPassword(payload.userId, password);
    if (!updated) {
      throw new Error("Utilizador nao encontrado");
    }

    res.json({
      ok: true,
      message: "Password atualizada com sucesso.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel atualizar a password";
    res.status(400).json({ ok: false, message });
  }
});

router.get("/auth/me", async (req, res) => {
  const user = await resolveUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Sessao invalida" });
    return;
  }
  res.json({ user });
});

router.get("/calendar/google/status", requireAuth(async (_req, res, user) => {
  res.json({
    ok: true,
    configured: isGoogleOAuthConfigured(),
    connected: Boolean(await storage.getWorkspaceUserGoogleAccessToken(user.id)),
  });
}));

router.get("/calendar/google/connect", requireAuth(async (_req, res, user) => {
  if (!isGoogleOAuthConfigured()) {
    res.status(503).json({ ok: false, message: "Google Calendar nao configurado" });
    return;
  }

  res.json({
    ok: true,
    connectUrl: getGoogleCalendarAuthUrl(user.id),
  });
}));

router.get("/calendar/google/callback", async (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const baseUrl = process.env.APP_BASE_URL || req.get("origin") || "http://localhost:3000";

  if (!code || !state) {
    res.redirect(`${baseUrl}/app/automation?calendar=0&error=missing`);
    return;
  }

  try {
    const payload = validateGoogleCalendarState(state);
    if (!payload.valid) {
      throw new Error("Token invalido");
    }

    const success = await handleGoogleCalendarCallback(code, payload.userId);
    res.redirect(`${baseUrl}/app/automation?calendar=${success ? "1" : "0"}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel ligar o calendario";
    res.redirect(`${baseUrl}/app/automation?calendar=0&error=${encodeURIComponent(message)}`);
  }
});

export { router };
