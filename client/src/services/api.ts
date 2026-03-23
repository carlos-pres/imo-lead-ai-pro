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

export type WorkspaceUser = {
  id: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  officeName: string;
  teamName: string;
  preferredLanguage: string;
  planId: PlanType;
  planName: string;
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
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: getHeaders(init?.headers),
  });
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
  return readJson<Lead[]>(response);
}

export async function getStats() {
  const response = await apiFetch("/api/stats");
  return readJson<LeadStats>(response);
}

export async function getTeams() {
  const response = await apiFetch("/api/teams");
  return readJson<TeamOverview>(response);
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

export async function getAdminPlans() {
  const response = await apiFetch("/api/admin/plans");
  return readJson<PlanCatalogEntry[]>(response);
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

export async function login(email: string, password: string) {
  const response = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const session = await readJson<AuthSession>(response);
  setSessionToken(session.token);
  return session;
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
