const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const SESSION_TOKEN_KEY = "imolead-session-token";

export type PlanType = "basic" | "pro" | "custom";
export type LeadStatus = "quente" | "morno" | "frio";
export type RoutingBucket = "flagship" | "growth" | "nurture";
export type WorkspaceRole = "admin" | "manager" | "consultant";
export type PipelineStage =
  | "novo"
  | "qualificacao"
  | "contactado"
  | "visita"
  | "proposta"
  | "nurture";

export type Office = {
  id: string;
  name: string;
  city: string;
  countryCode: string;
  timezone: string;
  languages: string[];
  coverageMarkets: string[];
  focus: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  teamName: string;
  officeName: string;
  languages: string[];
  marketFocus: string[];
};

export type TeamOverview = {
  offices: Office[];
  members: TeamMember[];
  markets: string[];
  languages: string[];
};

export type PlanCatalogEntry = {
  id: string;
  basePlanId: PlanType;
  slug: string;
  publicName: string;
  recommendedFor: string;
  includedCountryCodes: string[];
  leadLimit: number;
  includedUsers: number;
  allowsExtraUsers: boolean;
  extraUserMonthlyPrice: number;
  extraUserYearlyPrice: number;
  advancedAI: boolean;
  autoContact: boolean;
  multiLocation: boolean;
  multiLanguage: boolean;
  maxMessagesPerMonth: number;
  monthlyPrice: number;
  yearlyPrice: number;
  annualDiscountPercent: number;
  reportsLabel: string;
  marketReports: string[];
  includedMarkets: string[];
  supportLabel: string;
  agentLabel: string;
  agentCapabilities: string[];
  features: string[];
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
};

export type CommercialPlanInput = {
  id?: string;
  basePlanId: PlanType;
  slug?: string;
  publicName: string;
  recommendedFor: string;
  includedCountryCodes: string[];
  leadLimit: number;
  includedUsers: number;
  allowsExtraUsers: boolean;
  extraUserMonthlyPrice: number;
  extraUserYearlyPrice: number;
  advancedAI: boolean;
  autoContact: boolean;
  multiLocation: boolean;
  multiLanguage: boolean;
  maxMessagesPerMonth: number;
  monthlyPrice: number;
  yearlyPrice: number;
  annualDiscountPercent: number;
  reportsLabel: string;
  marketReports: string[];
  includedMarkets: string[];
  supportLabel: string;
  agentLabel: string;
  agentCapabilities: string[];
  features: string[];
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
};

export type TrialRequestInput = {
  name: string;
  email: string;
  phone: string;
  requestedPlanId?: PlanType;
  source?: string;
  privacyAccepted: boolean;
  termsAccepted: boolean;
  aiDisclosureAccepted: boolean;
  policyVersion: string;
};

export type PaymentCheckoutInput = {
  planId: PlanType;
  billingInterval: "month" | "year";
  customerName: string;
  customerEmail: string;
};

export type PaymentCheckoutSession = {
  ok: boolean;
  provider: "stripe";
  checkoutUrl: string;
  sessionId: string;
  paymentMethods: string[];
};

export type PaymentPortalSession = {
  ok: boolean;
  provider: "stripe";
  portalUrl: string;
  customerId: string;
};

export type WorkspaceUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  role: WorkspaceRole;
  officeName: string;
  teamName: string;
  preferredLanguage: string;
  planId: PlanType;
  planName: string;
  isActive: boolean;
};

export type CreateAdminUserInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: WorkspaceRole;
  officeName: string;
  teamName: string;
  preferredLanguage?: string;
  planId: PlanType;
  isActive?: boolean;
};

export type UpdateAdminUserInput = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: WorkspaceRole;
  officeName?: string;
  teamName?: string;
  preferredLanguage?: string;
  planId?: PlanType;
  isActive?: boolean;
};

export type AuthSession = {
  token: string;
  user: WorkspaceUser;
};

export type ComplianceSummary = {
  policyVersion: string;
  privacyContactEmail: string;
  dataUseSummary: string;
  aiUseSummary: string;
  retentionSummary: string;
  trialRequirements: {
    uniqueEmail: boolean;
    uniquePhone: boolean;
    explicitConsentRequired: boolean;
    policyVersion: string;
  };
};

export type AdminSystemStatus = {
  ai: boolean;
  stripe: boolean;
  googleCalendar: boolean;
  whatsapp: boolean;
  email: boolean;
  database: boolean;
};

export type CalendarConnectionStatus = {
  ok: boolean;
  configured: boolean;
  connected: boolean;
};

export type CalendarConnectResponse = {
  ok: boolean;
  connectUrl: string;
};

export type StrategistOpportunity = {
  location: string;
  market: string;
  propertyType: string;
  averagePrice: number;
  totalLeads: number;
  opportunityScore: number;
  demandLevel: "high" | "medium" | "low";
  recommendation: string;
  topSources: string[];
  hotLeadCount: number;
  officeCount: number;
};

export type MarketStrategistRadar = {
  generatedAt: string;
  mode: "hybrid" | "heuristic";
  headline: string;
  summary: string;
  strategicActions: string[];
  opportunities: StrategistOpportunity[];
};

export type Lead = {
  id: string;
  name: string;
  property: string;
  location: string;
  price: number;
  area?: number | null;
  source: string;
  status: LeadStatus;
  aiScore: number;
  reasoning: string;
  recommendedAction: string;
  routingBucket: RoutingBucket;
  slaHours: number;
  assignedTeam: string;
  assignedOwner: string;
  officeName: string;
  pipelineStage: PipelineStage;
  nextStep: string;
  followUpAt?: string | null;
  lastContactAt?: string | null;
  strategyGoal: string;
  outreachChannel: string;
  outreachMessage: string;
  market: string;
  countryCode: string;
  preferredLanguage: string;
  currencyCode: string;
  contact?: string;
  notes?: string;
  planId: PlanType;
  planName: string;
  agentLabel: string;
  createdAt: string;
};

export type LeadStats = {
  total: number;
  quente: number;
  morno: number;
  frio: number;
  average_ai_score: number;
  flagship_queue: number;
  growth_queue: number;
  nurture_queue: number;
  urgent_actions: number;
  active_teams: number;
  active_offices: number;
  overdue_followups: number;
  contacted_today: number;
  european_markets: number;
};

export type CreateLeadInput = {
  name: string;
  property?: string;
  location: string;
  price: string;
  area?: string;
  source?: string;
  contact?: string;
  notes?: string;
  countryCode?: string;
  preferredLanguage?: string;
  planId?: PlanType;
};

export type UpdateLeadWorkflowInput = {
  pipelineStage?: PipelineStage;
  assignedOwner?: string;
  nextStep?: string;
  followUpAt?: string | null;
  lastContactAt?: string | null;
};

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Pedido falhou";

    try {
      const errorBody = (await response.json()) as { error?: string };
      if (errorBody.error) {
        message = errorBody.error;
      }
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

function getHeaders(headers?: HeadersInit) {
  const token = getSessionToken();

  if (!token) {
    return headers;
  }

  return {
    ...(headers || {}),
    Authorization: `Bearer ${token}`,
  };
}

async function apiFetch(path: string, init?: RequestInit) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: getHeaders(init?.headers),
    });

    return response;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Falha de rede inesperada";
    throw new Error(
      reason.includes("Failed to fetch")
        ? "Não foi possível ligar ao servidor. Verifique a ligação e tente novamente."
        : reason
    );
  }
}

export function getSessionToken() {
  if (typeof window === "undefined") {
    return "";
  }

  const sessionValue = window.sessionStorage.getItem(SESSION_TOKEN_KEY);

  if (sessionValue) {
    return sessionValue;
  }

  const legacyValue = window.localStorage.getItem(SESSION_TOKEN_KEY) || "";

  if (legacyValue) {
    window.sessionStorage.setItem(SESSION_TOKEN_KEY, legacyValue);
    window.localStorage.removeItem(SESSION_TOKEN_KEY);
  }

  return legacyValue;
}

export function setSessionToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  window.localStorage.removeItem(SESSION_TOKEN_KEY);
}

export function clearSessionToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
  window.localStorage.removeItem(SESSION_TOKEN_KEY);
}

export async function getHealth() {
  const response = await apiFetch("/health");
  return readJson<{
    ok: boolean;
    service: string;
    aiMode?: "hybrid" | "heuristic";
    databaseConfigured?: boolean;
    defaultPlanId?: PlanType;
    defaultPlanName?: string;
  }>(response);
}

export async function getCompliance() {
  const response = await apiFetch("/api/compliance");
  return readJson<ComplianceSummary>(response);
}

export async function getLeads() {
  const response = await apiFetch("/api/leads");
  const payload = await readJson<unknown>(response);

  if (Array.isArray(payload)) {
    return payload as Lead[];
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const { data } = payload as { data?: unknown };

    if (Array.isArray(data)) {
      return data as Lead[];
    }
  }

  return [] as Lead[];
}

export async function getStats() {
  const response = await apiFetch("/api/stats");
  return readJson<LeadStats>(response);
}

export async function getPublicStats() {
  const response = await apiFetch("/api/stats/public");
  return readJson<LeadStats>(response);
}

export async function getTeams() {
  const response = await apiFetch("/api/teams");
  return readJson<TeamOverview>(response);
}

export async function getMarketStrategistRadar() {
  const response = await apiFetch("/api/market-radar/strategist");
  return readJson<MarketStrategistRadar>(response);
}

export async function getPlans() {
  const response = await apiFetch("/api/plans");
  return readJson<PlanCatalogEntry[]>(response);
}

export async function createTrialRequest(data: TrialRequestInput) {
  const response = await apiFetch("/api/trial-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return readJson<{
    ok: boolean;
    trialRequestId: string;
    message: string;
  }>(response);
}

export async function createPaymentCheckoutSession(data: PaymentCheckoutInput) {
  const response = await apiFetch("/api/payments/checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return readJson<PaymentCheckoutSession>(response);
}

export async function createCustomerPortalSession() {
  const response = await apiFetch("/api/payments/customer-portal-session", {
    method: "POST",
  });

  return readJson<PaymentPortalSession>(response);
}

export async function getAdminPlans() {
  const response = await apiFetch("/api/admin/plans");
  return readJson<PlanCatalogEntry[]>(response);
}

export async function getAdminUsers() {
  const response = await apiFetch("/api/admin/users");
  return readJson<WorkspaceUser[]>(response);
}

export async function getAdminSystemStatus() {
  const response = await apiFetch("/api/admin/system-status");
  return readJson<AdminSystemStatus>(response);
}

export async function getCalendarConnectionStatus() {
  const response = await apiFetch("/api/calendar/google/status");
  return readJson<CalendarConnectionStatus>(response);
}

export async function getCalendarConnectUrl() {
  const response = await apiFetch("/api/calendar/google/connect");
  return readJson<CalendarConnectResponse>(response);
}

export async function createAdminPlan(data: CommercialPlanInput) {
  const response = await apiFetch("/api/admin/plans", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return readJson<PlanCatalogEntry>(response);
}

export async function updateAdminPlan(id: string, data: CommercialPlanInput) {
  const response = await apiFetch(`/api/admin/plans/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return readJson<PlanCatalogEntry>(response);
}

export async function deleteAdminPlan(id: string) {
  const response = await apiFetch(`/api/admin/plans/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    await readJson(response);
  }
}

export async function createAdminUser(data: CreateAdminUserInput) {
  const response = await apiFetch("/api/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return readJson<WorkspaceUser>(response);
}

export async function updateAdminUser(id: string, data: UpdateAdminUserInput) {
  const response = await apiFetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return readJson<WorkspaceUser>(response);
}

export async function deleteAdminUser(id: string) {
  const response = await apiFetch(`/api/admin/users/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    await readJson(response);
  }
}

export async function login(identifier: string, password: string) {
  const response = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: identifier, identifier, password }),
  });

  const session = await readJson<AuthSession>(response);
  setSessionToken(session.token);
  return session;
}

export async function requestEmailVerification(identifier: string) {
  const response = await apiFetch("/api/auth/request-email-verification", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: identifier, identifier }),
  });

  return readJson<{ ok: boolean; sent?: boolean; message: string }>(response);
}

export async function requestPasswordReset(identifier: string) {
  const response = await apiFetch("/api/auth/request-password-reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: identifier, identifier }),
  });

  return readJson<{ ok: boolean; sent?: boolean; message: string }>(response);
}

export async function resetPassword(token: string, password: string) {
  const response = await apiFetch("/api/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password }),
  });

  return readJson<{ ok: boolean; message: string }>(response);
}

export async function getCurrentSession() {
  const token = getSessionToken();

  if (!token) {
    return null;
  }

  const response = await apiFetch("/api/auth/me");
  const payload = await readJson<{ user: WorkspaceUser }>(response);
  return {
    token,
    user: payload.user,
  } satisfies AuthSession;
}

export function logout() {
  clearSessionToken();
}

export async function createLead(data: CreateLeadInput) {
  const response = await apiFetch("/api/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...data,
      price: Number(data.price),
      area: data.area ? Number(data.area) : null,
    }),
  });

  return readJson<Lead>(response);
}

export async function updateLeadWorkflow(id: string, data: UpdateLeadWorkflowInput) {
  const response = await apiFetch(`/api/leads/${id}/workflow`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return readJson<Lead>(response);
}
