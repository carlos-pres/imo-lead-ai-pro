const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export type PlanType = "basic" | "pro" | "custom";
export type LeadStatus = "quente" | "morno" | "frio";
export type RoutingBucket = "flagship" | "growth" | "nurture";
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
  id: PlanType;
  publicName: string;
  recommendedFor: string;
  includedCountryCodes: string[];
  leadLimit: number;
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

export async function getHealth() {
  const response = await fetch(`${API_URL}/health`);
  return readJson<{
    ok: boolean;
    service: string;
    aiMode: "hybrid" | "heuristic";
    databaseConfigured: boolean;
    defaultPlanId: PlanType;
    defaultPlanName: string;
  }>(response);
}

export async function getLeads() {
  const response = await fetch(`${API_URL}/api/leads`);
  return readJson<Lead[]>(response);
}

export async function getStats() {
  const response = await fetch(`${API_URL}/api/stats`);
  return readJson<LeadStats>(response);
}

export async function getTeams() {
  const response = await fetch(`${API_URL}/api/teams`);
  return readJson<TeamOverview>(response);
}

export async function getPlans() {
  const response = await fetch(`${API_URL}/api/plans`);
  return readJson<PlanCatalogEntry[]>(response);
}

export async function createLead(data: CreateLeadInput) {
  const response = await fetch(`${API_URL}/api/leads`, {
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
  const response = await fetch(`${API_URL}/api/leads/${id}/workflow`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return readJson<Lead>(response);
}
