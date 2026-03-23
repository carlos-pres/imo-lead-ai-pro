import { startTransition, useDeferredValue, useEffect, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import homeFullImg from "../../home_full.png";
import "./App.css";
import {
  clearSessionToken,
  createAdminPlan,
  createPaymentCheckoutSession,
  createLead,
  createTrialRequest,
  deleteAdminPlan,
  getAdminPlans,
  getCompliance,
  getCurrentSession,
  getHealth,
  getLeads,
  getPlans,
  getStats,
  getTeams,
  login,
  logout,
  updateAdminPlan,
  updateLeadWorkflow,
  type AuthSession,
  type ComplianceSummary,
  type CommercialPlanInput,
  type CreateLeadInput,
  type Lead,
  type LeadStats,
  type PipelineStage,
  type PlanCatalogEntry,
  type PlanType,
  type RoutingBucket,
  type TeamOverview,
  type UpdateLeadWorkflowInput,
  type WorkspaceRole,
} from "./services/api";
import { LEGAL_POLICY_VERSION, LEGAL_SECTIONS, PRIVACY_CONTACT_EMAIL } from "./legal";

type ViewId = "dashboard" | "pipeline" | "teams" | "reports" | "pricing" | "admin";
type PublicPageId = "home" | "features" | "pricing" | "contact" | "login";
type BillingMode = "month" | "year";
type WorkflowDraftMap = Record<string, UpdateLeadWorkflowInput>;
type LoginForm = {
  email: string;
  password: string;
};
type LandingGuidance = {
  title: string;
  detail: string;
};
type TrialForm = {
  name: string;
  email: string;
  phone: string;
  privacyAccepted: boolean;
  termsAccepted: boolean;
  aiDisclosureAccepted: boolean;
};
type CheckoutForm = {
  name: string;
  email: string;
};
type AdminPlanDraftMap = Record<string, AdminPlanDraft>;

type AdminPlanDraft = {
  id?: string;
  basePlanId: PlanType;
  slug: string;
  publicName: string;
  recommendedFor: string;
  includedCountryCodes: string;
  leadLimit: string;
  includedUsers: string;
  allowsExtraUsers: boolean;
  extraUserMonthlyPrice: string;
  extraUserYearlyPrice: string;
  advancedAI: boolean;
  autoContact: boolean;
  multiLocation: boolean;
  multiLanguage: boolean;
  maxMessagesPerMonth: string;
  monthlyPrice: string;
  yearlyPrice: string;
  annualDiscountPercent: string;
  reportsLabel: string;
  marketReports: string;
  includedMarkets: string;
  supportLabel: string;
  agentLabel: string;
  agentCapabilities: string;
  features: string;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: string;
};

type MarketInsight = {
  market: string;
  totalLeads: number;
  hotLeads: number;
  averageAiScore: number;
  averagePrice: number;
  overdueFollowUps: number;
  officeCount: number;
  topSources: string[];
};

type NavItem = {
  id: ViewId;
  label: string;
  eyebrow: string;
  description: string;
};

type PublicNavItem = {
  id: PublicPageId;
  label: string;
  eyebrow: string;
  description: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    eyebrow: "Control tower",
    description: "Visao executiva da operacao e dos sinais do negocio.",
  },
  {
    id: "pipeline",
    label: "Pipeline",
    eyebrow: "Execucao",
    description: "Entrada, distribuicao e follow-up com board comercial.",
  },
  {
    id: "teams",
    label: "Equipas",
    eyebrow: "Cobertura",
    description: "Lojas, owners, linguas e desks para escalar Portugal e Europa.",
  },
  {
    id: "reports",
    label: "Mercado",
    eyebrow: "Insights",
    description: "Relatorios de mercado e pulso operacional por geografias.",
  },
  {
    id: "pricing",
    label: "Planos",
    eyebrow: "Escala",
    description: "Pricing, agente por plano e proposta comercial unificada.",
  },
  {
    id: "admin",
    label: "ADM",
    eyebrow: "Governance",
    description: "Controlo total do catalogo comercial e do pricing.",
  },
];

const PUBLIC_PAGE_PATHS: Record<PublicPageId, string> = {
  home: "/",
  features: "/funcionalidades",
  pricing: "/precos",
  contact: "/contacto",
  login: "/entrar",
};

const PUBLIC_NAV_ITEMS: PublicNavItem[] = [
  {
    id: "home",
    label: "Inicio",
    eyebrow: "Entrada",
    description: "Apresentacao comercial e prova visual da plataforma.",
  },
  {
    id: "features",
    label: "Funcionalidades",
    eyebrow: "Produto",
    description: "Blocos de valor, workflow e prova operacional.",
  },
  {
    id: "pricing",
    label: "Precos",
    eyebrow: "Oferta",
    description: "Planos, trial, utilizadores e progressao comercial.",
  },
  {
    id: "contact",
    label: "Contacto",
    eyebrow: "Fecho",
    description: "Contacto comercial, RGPD e proposta enterprise.",
  },
  {
    id: "login",
    label: "Entrar",
    eyebrow: "Acesso",
    description: "Login protegido, trial e demonstracao assistida.",
  },
];

const STAGE_ORDER: PipelineStage[] = [
  "novo",
  "qualificacao",
  "contactado",
  "visita",
  "proposta",
  "nurture",
];

const initialForm: CreateLeadInput = {
  name: "",
  property: "",
  location: "",
  price: "",
  area: "",
  source: "Manual",
  contact: "",
  notes: "",
  countryCode: "PT",
  preferredLanguage: "pt-PT",
};

const COUNTRY_OPTIONS: Array<{
  code: "PT" | "ES" | "FR" | "IT";
  label: string;
  language: string;
}> = [
  { code: "PT", label: "Portugal", language: "pt-PT" },
  { code: "ES", label: "Espanha", language: "es-ES" },
  { code: "FR", label: "Franca", language: "fr-FR" },
  { code: "IT", label: "Italia", language: "it-IT" },
];

function joinLines(values: string[]) {
  return values.join("\n");
}

function splitLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function createEmptyAdminPlanDraft(): AdminPlanDraft {
  return {
    basePlanId: "pro",
    slug: "",
    publicName: "",
    recommendedFor: "",
    includedCountryCodes: "PT\nES",
    leadLimit: "600",
    includedUsers: "7",
    allowsExtraUsers: true,
    extraUserMonthlyPrice: "17",
    extraUserYearlyPrice: "163.20",
    advancedAI: true,
    autoContact: true,
    multiLocation: true,
    multiLanguage: true,
    maxMessagesPerMonth: "1200",
    monthlyPrice: "97",
    yearlyPrice: "931.20",
    annualDiscountPercent: "20",
    reportsLabel: "",
    marketReports: "",
    includedMarkets: "Portugal\nEspanha",
    supportLabel: "",
    agentLabel: "",
    agentCapabilities: "",
    features: "",
    isActive: true,
    isPublic: true,
    sortOrder: "10",
  };
}

function buildAdminPlanDraft(plan: PlanCatalogEntry): AdminPlanDraft {
  return {
    id: plan.id,
    basePlanId: plan.basePlanId,
    slug: plan.slug,
    publicName: plan.publicName,
    recommendedFor: plan.recommendedFor,
    includedCountryCodes: joinLines(plan.includedCountryCodes),
    leadLimit: String(plan.leadLimit),
    includedUsers: String(plan.includedUsers),
    allowsExtraUsers: plan.allowsExtraUsers,
    extraUserMonthlyPrice: String(plan.extraUserMonthlyPrice),
    extraUserYearlyPrice: String(plan.extraUserYearlyPrice),
    advancedAI: plan.advancedAI,
    autoContact: plan.autoContact,
    multiLocation: plan.multiLocation,
    multiLanguage: plan.multiLanguage,
    maxMessagesPerMonth: String(plan.maxMessagesPerMonth),
    monthlyPrice: String(plan.monthlyPrice),
    yearlyPrice: String(plan.yearlyPrice),
    annualDiscountPercent: String(plan.annualDiscountPercent),
    reportsLabel: plan.reportsLabel,
    marketReports: joinLines(plan.marketReports),
    includedMarkets: joinLines(plan.includedMarkets),
    supportLabel: plan.supportLabel,
    agentLabel: plan.agentLabel,
    agentCapabilities: joinLines(plan.agentCapabilities),
    features: joinLines(plan.features),
    isActive: plan.isActive,
    isPublic: plan.isPublic,
    sortOrder: String(plan.sortOrder),
  };
}

function toCommercialPlanPayload(draft: AdminPlanDraft): CommercialPlanInput {
  return {
    id: draft.id,
    basePlanId: draft.basePlanId,
    slug: draft.slug,
    publicName: draft.publicName.trim(),
    recommendedFor: draft.recommendedFor.trim(),
    includedCountryCodes: splitLines(draft.includedCountryCodes),
    leadLimit: Number(draft.leadLimit || 0),
    includedUsers: Number(draft.includedUsers || 1),
    allowsExtraUsers: draft.allowsExtraUsers,
    extraUserMonthlyPrice: Number(draft.extraUserMonthlyPrice || 0),
    extraUserYearlyPrice: Number(draft.extraUserYearlyPrice || 0),
    advancedAI: draft.advancedAI,
    autoContact: draft.autoContact,
    multiLocation: draft.multiLocation,
    multiLanguage: draft.multiLanguage,
    maxMessagesPerMonth: Number(draft.maxMessagesPerMonth || 0),
    monthlyPrice: Number(draft.monthlyPrice || 0),
    yearlyPrice: Number(draft.yearlyPrice || 0),
    annualDiscountPercent: Number(draft.annualDiscountPercent || 0),
    reportsLabel: draft.reportsLabel.trim(),
    marketReports: splitLines(draft.marketReports),
    includedMarkets: splitLines(draft.includedMarkets),
    supportLabel: draft.supportLabel.trim(),
    agentLabel: draft.agentLabel.trim(),
    agentCapabilities: splitLines(draft.agentCapabilities),
    features: splitLines(draft.features),
    isActive: draft.isActive,
    isPublic: draft.isPublic,
    sortOrder: Number(draft.sortOrder || 0),
  };
}

const DEMO_ACCESS = [
  {
    role: "Admin",
    email: "carlospsantos19820@gmail.com",
    password: "Demo123!",
    description: "ADM geral com controlo total da rede e do catalogo comercial.",
  },
  {
    role: "Manager",
    email: "lucas@imolead.ai",
    password: "Demo123!",
    description: "Desk Europa com foco em Iberia e expansao.",
  },
  {
    role: "Consultor",
    email: "ana@imolead.ai",
    password: "Demo123!",
    description: "Operacao comercial limitada a equipa e carteira propria.",
  },
] as const;

const PUBLIC_DEMO_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_PUBLIC_DEMO === "true";

type DemoAccessEntry = (typeof DEMO_ACCESS)[number];

function getSuggestedDemoEntry(planId: PlanType): DemoAccessEntry {
  if (planId === "basic") {
    return DEMO_ACCESS[2];
  }

  if (planId === "custom") {
    return DEMO_ACCESS[0];
  }

  return DEMO_ACCESS[1];
}

function getPlanForDemoEntry(entry: DemoAccessEntry): PlanType {
  if (entry.role === "Consultor") {
    return "basic";
  }

  if (entry.role === "Admin") {
    return "custom";
  }

  return "pro";
}

function isViewId(value: string): value is ViewId {
  return NAV_ITEMS.some((item) => item.id === value);
}

function isPublicPageId(value: string): value is PublicPageId {
  return PUBLIC_NAV_ITEMS.some((item) => item.id === value);
}

function isPlanType(value: string | null | undefined): value is PlanType {
  return value === "basic" || value === "pro" || value === "custom";
}

function normalizePublicPath(pathname: string) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function getPublicPageFromPath(pathname: string): PublicPageId {
  const normalizedPath = normalizePublicPath(pathname);
  const matched = (Object.keys(PUBLIC_PAGE_PATHS) as PublicPageId[]).find(
    (pageId) => PUBLIC_PAGE_PATHS[pageId] === normalizedPath
  );

  return matched && isPublicPageId(matched) ? matched : "home";
}

function getViewFromHash(): ViewId {
  if (typeof window === "undefined") {
    return "dashboard";
  }

  const hash = window.location.hash.replace(/^#\/?/, "");
  return isViewId(hash) ? hash : "dashboard";
}

function formatCurrency(value: number, currencyCode = "EUR", withCents = false) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0,
  }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toInputDateTime(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 16);
}

function getBucketLabel(bucket: RoutingBucket) {
  if (bucket === "flagship") {
    return "Desk Flagship";
  }

  if (bucket === "growth") {
    return "Desk Growth";
  }

  return "Desk Nurture";
}

function getStageLabel(stage: PipelineStage) {
  if (stage === "novo") {
    return "Novo";
  }

  if (stage === "qualificacao") {
    return "Qualificacao";
  }

  if (stage === "contactado") {
    return "Contactado";
  }

  if (stage === "visita") {
    return "Visita";
  }

  if (stage === "proposta") {
    return "Proposta";
  }

  return "Nurture";
}

function formatLeadLimit(limit: number) {
  if (limit >= 999999) {
    return "Capacidade enterprise";
  }

  return `Capacidade ate ${limit} leads/mes`;
}

function formatIncludedUsers(count: number) {
  return `${count} utilizador${count === 1 ? "" : "es"} incluido${count === 1 ? "" : "s"}`;
}

function formatExtraUsers(plan: PlanCatalogEntry, billing: BillingMode) {
  if (!plan.allowsExtraUsers) {
    return "Sem utilizadores extra";
  }

  const value = billing === "year" ? plan.extraUserYearlyPrice : plan.extraUserMonthlyPrice;
  const suffix = billing === "year" ? "/ano" : "/mes";
  return `Utilizador extra ${formatCurrency(value, "EUR", value % 1 !== 0)}${suffix}`;
}

function getTrialDaysForPlan(planId: PlanType) {
  return planId === "basic" ? 15 : 0;
}

function getUpgradeTargetsForPlan(planId: PlanType, catalog: PlanCatalogEntry[]) {
  if (planId === "basic") {
    return catalog.filter((plan) => plan.basePlanId === "pro" || plan.basePlanId === "custom");
  }

  if (planId === "pro") {
    return catalog.filter((plan) => plan.basePlanId === "custom");
  }

  return [];
}

function getUpgradeHintForPlan(planId: PlanType, catalog: PlanCatalogEntry[]) {
  const trialDays = getTrialDaysForPlan(planId);
  const nextPlans = getUpgradeTargetsForPlan(planId, catalog).map((plan) => plan.publicName);

  if (planId === "basic") {
    return `${trialDays} dias de trial no Starter. Evolucao sugerida: ${nextPlans.join(" e ")}.`;
  }

  if (planId === "pro") {
    return nextPlans.length > 0
      ? `Plano seguinte recomendado: ${nextPlans.join(", ")}.`
      : "Plano preparado para equipas em crescimento.";
  }

  return "Camada final para operacoes de maior escala.";
}

function getRoleLabel(role: WorkspaceRole | undefined) {
  if (role === "admin") {
    return "Administrador";
  }

  if (role === "manager") {
    return "Manager";
  }

  if (role === "consultant") {
    return "Consultor";
  }

  return "Workspace";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function extractEmailFromContact(contact?: string) {
  if (!contact) {
    return "";
  }

  const match = contact.match(/[^\s@]+@[^\s@]+\.[^\s@]+/i);
  return match?.[0]?.toLowerCase() || "";
}

function extractPhoneFromContact(contact?: string) {
  if (!contact) {
    return "";
  }

  const digits = contact.replace(/\D/g, "");

  if (digits.length >= 11 && digits.startsWith("351")) {
    return digits;
  }

  if (digits.length === 9) {
    return `351${digits}`;
  }

  if (digits.length >= 11) {
    return digits;
  }

  return "";
}

function buildLeadEmailSubject(lead: Lead) {
  return `${lead.location} | ${lead.property || "Carteira em analise"} | ${lead.planName}`;
}

function buildLeadEmailBody(lead: Lead) {
  return [
    `Ola ${lead.name},`,
    "",
    lead.outreachMessage,
    "",
    `Proxima melhor acao: ${lead.recommendedAction}.`,
    `Desk sugerida: ${getBucketLabel(lead.routingBucket)}.`,
    `Mercado: ${lead.market}. Fonte: ${lead.source}.`,
    "",
    "Cumprimentos,",
    "Equipa ImoLead AI Pro",
  ].join("\n");
}

function buildLeadWhatsAppMessage(lead: Lead) {
  return [
    `Ola ${lead.name},`,
    "",
    lead.outreachMessage,
    "",
    `Proxima acao sugerida: ${lead.recommendedAction}.`,
  ].join("\n");
}

function deriveStats(leads: Lead[]): LeadStats {
  const teams = new Set(leads.map((lead) => lead.assignedTeam));
  const offices = new Set(leads.map((lead) => lead.officeName));
  const markets = new Set(leads.map((lead) => lead.market));
  const today = new Date().toISOString().slice(0, 10);

  return {
    total: leads.length,
    quente: leads.filter((lead) => lead.status === "quente").length,
    morno: leads.filter((lead) => lead.status === "morno").length,
    frio: leads.filter((lead) => lead.status === "frio").length,
    average_ai_score:
      leads.length > 0
        ? Math.round(leads.reduce((sum, lead) => sum + lead.aiScore, 0) / leads.length)
        : 0,
    flagship_queue: leads.filter((lead) => lead.routingBucket === "flagship").length,
    growth_queue: leads.filter((lead) => lead.routingBucket === "growth").length,
    nurture_queue: leads.filter((lead) => lead.routingBucket === "nurture").length,
    urgent_actions: leads.filter((lead) => lead.slaHours <= 8).length,
    active_teams: teams.size,
    active_offices: offices.size,
    overdue_followups: leads.filter((lead) =>
      lead.followUpAt ? new Date(lead.followUpAt).getTime() <= Date.now() : false
    ).length,
    contacted_today: leads.filter((lead) => lead.lastContactAt?.slice(0, 10) === today).length,
    european_markets: markets.size,
  };
}

function buildWorkflowDrafts(leads: Lead[]) {
  return leads.reduce<WorkflowDraftMap>((drafts, lead) => {
    drafts[lead.id] = {
      pipelineStage: lead.pipelineStage,
      assignedOwner: lead.assignedOwner,
      nextStep: lead.nextStep,
      followUpAt: toInputDateTime(lead.followUpAt),
      lastContactAt: toInputDateTime(lead.lastContactAt),
    };
    return drafts;
  }, {});
}

function buildMarketInsights(leads: Lead[]): MarketInsight[] {
  const accumulator = new Map<
    string,
    {
      market: string;
      totalLeads: number;
      hotLeads: number;
      aiScoreTotal: number;
      priceTotal: number;
      overdueFollowUps: number;
      officeNames: Set<string>;
      sourceCounter: Map<string, number>;
    }
  >();

  leads.forEach((lead) => {
    const current = accumulator.get(lead.market) || {
      market: lead.market,
      totalLeads: 0,
      hotLeads: 0,
      aiScoreTotal: 0,
      priceTotal: 0,
      overdueFollowUps: 0,
      officeNames: new Set<string>(),
      sourceCounter: new Map<string, number>(),
    };

    current.totalLeads += 1;
    current.hotLeads += lead.status === "quente" ? 1 : 0;
    current.aiScoreTotal += lead.aiScore;
    current.priceTotal += lead.price;
    current.overdueFollowUps +=
      lead.followUpAt && new Date(lead.followUpAt).getTime() <= Date.now() ? 1 : 0;
    current.officeNames.add(lead.officeName);
    current.sourceCounter.set(lead.source, (current.sourceCounter.get(lead.source) || 0) + 1);
    accumulator.set(lead.market, current);
  });

  return Array.from(accumulator.values())
    .map((entry) => ({
      market: entry.market,
      totalLeads: entry.totalLeads,
      hotLeads: entry.hotLeads,
      averageAiScore: Math.round(entry.aiScoreTotal / entry.totalLeads),
      averagePrice: Math.round(entry.priceTotal / entry.totalLeads),
      overdueFollowUps: entry.overdueFollowUps,
      officeCount: entry.officeNames.size,
      topSources: Array.from(entry.sourceCounter.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 2)
        .map(([source]) => source),
    }))
    .sort((left, right) => {
      if (right.totalLeads !== left.totalLeads) {
        return right.totalLeads - left.totalLeads;
      }

      return right.averageAiScore - left.averageAiScore;
    });
}

function buildSourceMix(leads: Lead[]) {
  const counter = new Map<string, number>();

  leads.forEach((lead) => {
    counter.set(lead.source, (counter.get(lead.source) || 0) + 1);
  });

  return Array.from(counter.entries()).sort((left, right) => right[1] - left[1]);
}

function App() {
  const [activeView, setActiveView] = useState<ViewId>(() => getViewFromHash());
  const [publicPage, setPublicPage] = useState<PublicPageId>(() =>
    typeof window === "undefined" ? "home" : getPublicPageFromPath(window.location.pathname)
  );
  const [billingMode, setBillingMode] = useState<BillingMode>("month");
  const [activePlanId, setActivePlanId] = useState<PlanType>("pro");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [compliance, setCompliance] = useState<ComplianceSummary | null>(null);
  const [authBooting, setAuthBooting] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: PUBLIC_DEMO_ENABLED ? DEMO_ACCESS[0].email : "",
    password: PUBLIC_DEMO_ENABLED ? DEMO_ACCESS[0].password : "",
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [teamOverview, setTeamOverview] = useState<TeamOverview | null>(null);
  const [plans, setPlans] = useState<PlanCatalogEntry[]>([]);
  const [adminPlans, setAdminPlans] = useState<PlanCatalogEntry[]>([]);
  const [adminDrafts, setAdminDrafts] = useState<AdminPlanDraftMap>({});
  const [newPlanDraft, setNewPlanDraft] = useState<AdminPlanDraft>(() => createEmptyAdminPlanDraft());
  const [workflowDrafts, setWorkflowDrafts] = useState<WorkflowDraftMap>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingLeadId, setSavingLeadId] = useState("");
  const [savingAdminPlanId, setSavingAdminPlanId] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const [error, setError] = useState("");
  const [apiState, setApiState] = useState("A preparar experiencia");
  const [aiMode, setAiMode] = useState<"hybrid" | "heuristic">("heuristic");
  const [databaseConfigured, setDatabaseConfigured] = useState(false);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<PipelineStage | "all">("all");
  const [officeFilter, setOfficeFilter] = useState("all");
  const [form, setForm] = useState<CreateLeadInput>(initialForm);
  const [landingGuidance, setLandingGuidance] = useState<LandingGuidance>({
    title: "Entra numa demo ja preparada para a tua realidade",
    detail:
      "Escolhe o plano, usamos o perfil demo certo e levamos-te diretamente ao ponto onde a plataforma te poupa tempo.",
  });
  const [trialForm, setTrialForm] = useState<TrialForm>({
    name: "",
    email: "",
    phone: "",
    privacyAccepted: false,
    termsAccepted: false,
    aiDisclosureAccepted: false,
  });
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    name: "",
    email: "",
  });
  const [trialSubmitting, setTrialSubmitting] = useState(false);
  const [trialFeedback, setTrialFeedback] = useState("");
  const [trialFeedbackTone, setTrialFeedbackTone] = useState<"success" | "error">("success");
  const [checkoutSubmittingPlanId, setCheckoutSubmittingPlanId] = useState<PlanType | "">("");
  const [checkoutFeedback, setCheckoutFeedback] = useState("");
  const [checkoutFeedbackTone, setCheckoutFeedbackTone] = useState<"success" | "error">("success");
  const [workspaceFeedback, setWorkspaceFeedback] = useState("");

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleHashChange = () => {
      setActiveView(getViewFromHash());
    };

    const handlePopState = () => {
      setPublicPage(getPublicPageFromPath(window.location.pathname));
      setActiveView(getViewFromHash());
    };

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !session) {
      return;
    }

    const nextHash = window.location.hash || "#dashboard";
    const nextUrl = `${PUBLIC_PAGE_PATHS.home}${window.location.search}${nextHash}`;

    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }

    setPublicPage("home");
  }, [session]);

  useEffect(() => {
    if (typeof window === "undefined" || authBooting || session) {
      return;
    }

    const hash = window.location.hash.replace(/^#\/?/, "");

    if (isViewId(hash)) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }, [authBooting, session]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const checkoutState = params.get("checkout");

    if (checkoutState === "success") {
      setCheckoutFeedback(
        "Checkout concluido com sucesso. Confirma no Stripe e volta ao workspace para continuar a ativacao."
      );
      setCheckoutFeedbackTone("success");
      startTransition(() => {
        setPublicPage("pricing");
      });
      return;
    }

    if (checkoutState === "cancel") {
      setCheckoutFeedback("Checkout cancelado. Podes rever o plano e voltar a tentar quando quiseres.");
      setCheckoutFeedbackTone("error");
      startTransition(() => {
        setPublicPage("pricing");
      });
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      setCheckoutForm((current) => ({
        name: current.name || session.user.name,
        email: current.email || session.user.email,
      }));
      return;
    }

    if (trialForm.email || trialForm.name) {
      setCheckoutForm((current) => ({
        name: current.name || trialForm.name,
        email: current.email || trialForm.email,
      }));
    }
  }, [session, trialForm.email, trialForm.name]);

  useEffect(() => {
    if (typeof window === "undefined" || session) {
      return;
    }

    const hash = window.location.hash.replace(/^#/, "");

    if (!hash || isViewId(hash)) {
      return;
    }

    const timer = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [publicPage, session]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (session) {
      return;
    }

    window.localStorage.setItem("imolead-active-plan", activePlanId);
  }, [activePlanId, session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    setActivePlanId(session.user.planId);
    setForm((current) => ({
      ...current,
      preferredLanguage: session.user.preferredLanguage || current.preferredLanguage,
    }));
  }, [session]);

  useEffect(() => {
    if (session?.user.role === "admin") {
      void loadAdminCatalog();
      return;
    }

    setAdminPlans([]);
    setAdminDrafts({});
    setNewPlanDraft(createEmptyAdminPlanDraft());
  }, [session]);

  async function bootstrap() {
    await Promise.all([loadHealth(), loadPlansCatalog(), loadCompliance()]);

    try {
      const currentSession = await getCurrentSession();

      if (currentSession) {
        startTransition(() => {
          setSession(currentSession);
          setActivePlanId(currentSession.user.planId);
        });
        await loadWorkspace();
      }
    } catch (sessionError) {
      clearSessionToken();
      setError(
        sessionError instanceof Error ? sessionError.message : "Nao foi possivel recuperar a sessao"
      );
    } finally {
      setAuthBooting(false);
      setLoading(false);
    }
  }

  async function loadHealth() {
    try {
      const health = await getHealth();
      const storedPlanId =
        typeof window !== "undefined"
          ? window.localStorage.getItem("imolead-active-plan")
          : null;

      const resolvedDefaultPlanId =
        health.defaultPlanId && isPlanType(health.defaultPlanId) ? health.defaultPlanId : "pro";

      setAiMode(health.aiMode || "heuristic");
      setDatabaseConfigured(Boolean(health.databaseConfigured));
      setApiState(health.ok ? "Plataforma online" : "Plataforma com alerta");
      if (!session) {
        setActivePlanId(isPlanType(storedPlanId) ? storedPlanId : resolvedDefaultPlanId);
      }
    } catch {
      setApiState("A verificar disponibilidade");
    }
  }

  async function loadCompliance() {
    try {
      const nextCompliance = await getCompliance();
      setCompliance(nextCompliance);
    } catch {
      setCompliance(null);
    }
  }

  async function loadPlansCatalog() {
    try {
      const planData = await getPlans();
      setPlans(planData);
    } catch (planError) {
      setError(planError instanceof Error ? planError.message : "Falha ao carregar planos");
    }
  }

  async function loadAdminCatalog() {
    try {
      const adminPlanData = await getAdminPlans();
      startTransition(() => {
        setAdminPlans(adminPlanData);
        setAdminDrafts(
          adminPlanData.reduce<AdminPlanDraftMap>((drafts, plan) => {
            drafts[plan.id] = buildAdminPlanDraft(plan);
            return drafts;
          }, {})
        );
      });
    } catch (adminError) {
      setError(
        adminError instanceof Error
          ? adminError.message
          : "Falha ao carregar o painel de administracao"
      );
    }
  }

  async function loadWorkspace() {
    try {
      setLoading(true);
      setError("");

      const [leadData, statsData, teamData] = await Promise.all([
        getLeads(),
        getStats(),
        getTeams(),
      ]);

      startTransition(() => {
        setLeads(leadData);
        setStats(statsData);
        setTeamOverview(teamData);
        setWorkflowDrafts(buildWorkflowDrafts(leadData));
      });
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Falha ao carregar workspace";

      if (/Sessao/i.test(message)) {
        clearSessionToken();
        setSession(null);
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthSubmitting(true);
    setError("");

    try {
      const nextSession = await login(loginForm.email, loginForm.password);

      startTransition(() => {
        setSession(nextSession);
        setActivePlanId(nextSession.user.planId);
      });

      await loadWorkspace();
      navigateTo("dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Falha ao iniciar sessao");
    } finally {
      setAuthSubmitting(false);
      setAuthBooting(false);
    }
  }

  async function handleTrialRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTrialSubmitting(true);
    setTrialFeedback("");

    try {
      const response = await createTrialRequest({
        name: trialForm.name,
        email: trialForm.email,
        phone: trialForm.phone,
        requestedPlanId: "basic",
        source: "landing",
        privacyAccepted: trialForm.privacyAccepted,
        termsAccepted: trialForm.termsAccepted,
        aiDisclosureAccepted: trialForm.aiDisclosureAccepted,
        policyVersion,
      });

      setTrialFeedbackTone("success");
      setTrialFeedback(response.message);
      setTrialForm({
        name: "",
        email: "",
        phone: "",
        privacyAccepted: false,
        termsAccepted: false,
        aiDisclosureAccepted: false,
      });
      updateLandingGuidance(
        "Trial reservado com protecao anti-reutilizacao",
        "O email e o telefone ficaram validados como identificadores unicos do trial. A progressao natural continua a apontar para Pro e Enterprise."
      );
    } catch (trialError) {
      setTrialFeedbackTone("error");
      setTrialFeedback(
        trialError instanceof Error ? trialError.message : "Nao foi possivel ativar o trial."
      );
    } finally {
      setTrialSubmitting(false);
    }
  }

  function handleLogout() {
    logout();

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", PUBLIC_PAGE_PATHS.home);
    }

    startTransition(() => {
      setPublicPage("home");
      setSession(null);
      setLeads([]);
      setStats(null);
      setTeamOverview(null);
      setWorkflowDrafts({});
      setLoading(false);
      setActiveView("dashboard");
    });
  }

  function navigateTo(view: ViewId) {
    setActiveView(view);

    if (typeof window !== "undefined") {
      if (window.location.pathname !== PUBLIC_PAGE_PATHS.home) {
        window.history.replaceState(null, "", `${PUBLIC_PAGE_PATHS.home}${window.location.search}`);
      }

      if (window.location.hash !== `#${view}`) {
        window.location.hash = view;
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const created = await createLead({
        ...form,
        planId: session?.user.planId || activePlanId,
      });
      const nextLeads = [created, ...leads];

      startTransition(() => {
        setLeads(nextLeads);
        setStats(deriveStats(nextLeads));
        setWorkflowDrafts((current) => ({
          ...current,
          [created.id]: {
            pipelineStage: created.pipelineStage,
            assignedOwner: created.assignedOwner,
            nextStep: created.nextStep,
            followUpAt: toInputDateTime(created.followUpAt),
            lastContactAt: toInputDateTime(created.lastContactAt),
          },
        }));
      });

      setForm(initialForm);
      setApiState("API online");
      navigateTo("pipeline");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Falha ao criar lead");
    } finally {
      setSubmitting(false);
    }
  }

  function handleWorkflowChange(leadId: string, patch: UpdateLeadWorkflowInput) {
    setWorkflowDrafts((current) => ({
      ...current,
      [leadId]: {
        ...current[leadId],
        ...patch,
      },
    }));
  }

  async function handleWorkflowSave(leadId: string) {
    const draft = workflowDrafts[leadId];

    if (!draft) {
      return;
    }

    setSavingLeadId(leadId);
    setError("");

    try {
      const updatedLead = await updateLeadWorkflow(leadId, {
        ...draft,
        followUpAt: draft.followUpAt || null,
        lastContactAt: draft.lastContactAt || null,
      });

      const nextLeads = leads.map((lead) => (lead.id === leadId ? updatedLead : lead));

      startTransition(() => {
        setLeads(nextLeads);
        setStats(deriveStats(nextLeads));
        setWorkflowDrafts((current) => ({
          ...current,
          [leadId]: {
            pipelineStage: updatedLead.pipelineStage,
            assignedOwner: updatedLead.assignedOwner,
            nextStep: updatedLead.nextStep,
            followUpAt: toInputDateTime(updatedLead.followUpAt),
            lastContactAt: toInputDateTime(updatedLead.lastContactAt),
          },
        }));
      });
    } catch (workflowError) {
      setError(
        workflowError instanceof Error
          ? workflowError.message
          : "Falha ao atualizar workflow"
      );
    } finally {
      setSavingLeadId("");
    }
  }

  function publishWorkspaceFeedback(message: string) {
    setWorkspaceFeedback(message);
    window.setTimeout(() => {
      setWorkspaceFeedback((current) => (current === message ? "" : current));
    }, 2800);
  }

  async function handleCopyText(value: string, successMessage: string) {
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        throw new Error("clipboard_unavailable");
      }

      await navigator.clipboard.writeText(value);
      publishWorkspaceFeedback(successMessage);
    } catch {
      publishWorkspaceFeedback("Nao foi possivel copiar agora.");
    }
  }

  function handleOpenExternal(url: string, fallbackMessage: string) {
    if (!url) {
      publishWorkspaceFeedback(fallbackMessage);
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleAdminDraftChange(
    planId: string,
    patch: Partial<AdminPlanDraft>
  ) {
    setAdminDrafts((current) => ({
      ...current,
      [planId]: {
        ...current[planId],
        ...patch,
      },
    }));
  }

  async function handleAdminPlanSave(planId: string) {
    const draft = adminDrafts[planId];

    if (!draft) {
      return;
    }

    setSavingAdminPlanId(planId);
    setError("");

    try {
      const updated = await updateAdminPlan(planId, toCommercialPlanPayload(draft));
      const nextPlans = adminPlans.map((plan) => (plan.id === planId ? updated : plan));

      startTransition(() => {
        setAdminPlans(nextPlans);
        setAdminDrafts((current) => ({
          ...current,
          [planId]: buildAdminPlanDraft(updated),
        }));
        setPlans(nextPlans.filter((plan) => plan.isActive && plan.isPublic));
      });
    } catch (adminError) {
      setError(adminError instanceof Error ? adminError.message : "Falha ao guardar o plano");
    } finally {
      setSavingAdminPlanId("");
    }
  }

  async function handleAdminPlanCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdminBusy(true);
    setError("");

    try {
      const created = await createAdminPlan(toCommercialPlanPayload(newPlanDraft));
      const nextPlans = [...adminPlans, created].sort((left, right) => left.sortOrder - right.sortOrder);

      startTransition(() => {
        setAdminPlans(nextPlans);
        setAdminDrafts((current) => ({
          ...current,
          [created.id]: buildAdminPlanDraft(created),
        }));
        setPlans(nextPlans.filter((plan) => plan.isActive && plan.isPublic));
        setNewPlanDraft(createEmptyAdminPlanDraft());
      });
    } catch (adminError) {
      setError(adminError instanceof Error ? adminError.message : "Falha ao criar o plano");
    } finally {
      setAdminBusy(false);
    }
  }

  async function handleAdminPlanDelete(planId: string) {
    setSavingAdminPlanId(planId);
    setError("");

    try {
      await deleteAdminPlan(planId);
      const nextPlans = adminPlans.filter((plan) => plan.id !== planId);

      startTransition(() => {
        setAdminPlans(nextPlans);
        setPlans(nextPlans.filter((plan) => plan.isActive && plan.isPublic));
        setAdminDrafts((current) => {
          const nextDrafts = { ...current };
          delete nextDrafts[planId];
          return nextDrafts;
        });
      });
    } catch (adminError) {
      setError(adminError instanceof Error ? adminError.message : "Falha ao remover o plano");
    } finally {
      setSavingAdminPlanId("");
    }
  }

  const dashboardStats = stats || deriveStats(leads);
  const activePlan =
    plans.find((plan) => plan.basePlanId === activePlanId) ||
    plans.find((plan) => plan.basePlanId === "pro") ||
    plans[0] ||
    null;
  const suggestedDemoEntry = getSuggestedDemoEntry(activePlanId);
  const activePlanTrialDays = getTrialDaysForPlan(activePlanId);
  const policyVersion = compliance?.policyVersion || LEGAL_POLICY_VERSION;
  const privacyContactEmail = compliance?.privacyContactEmail || PRIVACY_CONTACT_EMAIL;
  const availableCountries = activePlan?.includedCountryCodes || COUNTRY_OPTIONS.map((item) => item.code);
  const offices = teamOverview?.offices || [];
  const members = teamOverview?.members || [];
  const markets = teamOverview?.markets || [];
  const languages = teamOverview?.languages || [];
  const marketInsights = buildMarketInsights(leads);
  const sourceMix = buildSourceMix(leads);
  const topMarket = marketInsights[0];
  const canAccessAdmin = session?.user.role === "admin";
  const canReassignOwners = session?.user.role !== "consultant";
  const canSwitchPlan = !session;
  const dominantSource = sourceMix[0]?.[0] || "Manual";
  const coverageLabel = activePlan?.includedMarkets.join(" · ") || "Portugal · Espanha";
  const marketingAiLabel = aiMode === "hybrid" ? "Agente IA ativo" : "Motor inteligente ativo";
  const hotLeadRatio =
    dashboardStats.total > 0 ? Math.round((dashboardStats.quente / dashboardStats.total) * 100) : 0;
  const routingMix = [
    { label: "Flagship", value: dashboardStats.flagship_queue, tone: "flagship" },
    { label: "Growth", value: dashboardStats.growth_queue, tone: "growth" },
    { label: "Nurture", value: dashboardStats.nurture_queue, tone: "nurture" },
  ];
  const dominantDeskLabel =
    routingMix.slice().sort((left, right) => right.value - left.value)[0]?.label || "Growth";
  const commandSignals = [
    {
      label: "Mercado em foco",
      value: topMarket?.market || "Sem destaque",
      detail: topMarket
        ? `${topMarket.totalLeads} leads ativos com score medio ${topMarket.averageAiScore}`
        : "Carteira a aguardar novo sinal comercial",
    },
    {
      label: "Desk dominante",
      value: dominantDeskLabel,
      detail: `${dashboardStats.active_teams} desks operacionais e ${dashboardStats.active_offices} lojas ativas`,
    },
    {
      label: "Cobertura atual",
      value: coverageLabel,
      detail: `Fonte lider ${dominantSource} e ${dashboardStats.european_markets} mercados em carteira`,
    },
  ];
  const landingFeatureCards = [
    {
      eyebrow: "Prospeccao",
      title: "Captacao e triagem com sinal comercial imediato",
      description:
        "O sistema organiza leads, calcula prioridade e separa flagship, growth e nurture sem depender de folhas dispersas.",
    },
    {
      eyebrow: "Automacao",
      title: "WhatsApp, agenda e follow-up no mesmo fluxo",
      description:
        "A operacao sai do modo manual e passa a trabalhar com cadencia, SLA, contexto do lead e proxima melhor acao.",
    },
    {
      eyebrow: "Mercado",
      title: "Relatorios de mercado pensados para rede imobiliaria",
      description:
        "Portugal primeiro, Iberia a seguir e base pronta para equipas multi-loja com leitura por mercado, origem e owner.",
    },
    {
      eyebrow: "Governance",
      title: "Planos, equipas e agente AI controlados pelo workspace",
      description:
        "Cada plano define cobertura geografica, profundidade do agente, mensagens e capacidade comercial do workspace.",
    },
    {
      eyebrow: "Pipeline",
      title: "Distribuicao operacional por owner, loja e fase",
      description:
        "A equipa deixa de trabalhar no improviso e passa a responder a partir de boards, SLAs e responsabilidade clara.",
    },
    {
      eyebrow: "Escala",
      title: "Base pronta para Portugal hoje e Europa a seguir",
      description:
        "Mercados, idiomas, desks e planos ficam preparados para crescimento sem partir a estrutura do produto.",
    },
  ];
  const landingWorkflow = [
    {
      step: "01",
      title: "Entrada de leads",
      detail: `${dashboardStats.total || 0} leads em carteira com captura centralizada por fonte, escritorio e mercado.`,
    },
    {
      step: "02",
      title: "Classificacao do agente",
      detail: `Score medio ${dashboardStats.average_ai_score} com roteamento para ${dominantDeskLabel}.`,
    },
    {
      step: "03",
      title: "Resposta operacional",
      detail: `${dashboardStats.urgent_actions} acoes urgentes e ${dashboardStats.overdue_followups} follow-ups em atraso visiveis no cockpit.`,
    },
  ];
  const landingTestimonials = [
    {
      quote:
        "O valor aqui nao e so CRM. E a sensacao de finalmente termos uma operacao comercial organizada por prioridade real.",
      author: "Direcao Comercial",
      role: "Rede imobiliaria em piloto",
    },
    {
      quote:
        "A plataforma parece ferramenta de direcao e nao apenas software de registo. Isso muda a forma como a equipa usa o sistema.",
      author: "Gestao de Expansao",
      role: "Desk Iberia",
    },
    {
      quote:
        "Quando a frente comercial parece forte e a area interna entrega controlo real, a reuniao muda de tom e a venda fica muito mais facil.",
      author: "Founder / Operacao",
      role: "ImoLead AI Pro",
    },
  ];
  const landingMetricBar = [
    {
      label: "Leads vivas",
      value: String(dashboardStats.total || 0),
      detail: "pipeline monitorizada em tempo real",
    },
    {
      label: "Score medio",
      value: String(dashboardStats.average_ai_score || 0),
      detail: "classificacao com contexto comercial",
    },
    {
      label: "Mercados",
      value: String(dashboardStats.european_markets || 0),
      detail: "Portugal, Iberia e expansao",
    },
    {
      label: "Follow-ups",
      value: String(dashboardStats.overdue_followups || 0),
      detail: "rastreio de backlog e urgencia",
    },
  ];
  const landingBenefitBullets = [
    "Landing comercial que transmite confianca antes do primeiro clique.",
    "Cockpit interno com leads, pipeline, equipas, mercado e ADM no mesmo workspace.",
    "Planos com agente por nivel, relatorios e cobertura geografica coerente.",
    "Arquitetura pronta para apresentar Portugal hoje e Europa como proxima fase credivel.",
  ];
  const landingFaqs = [
    {
      question: "Isto e um CRM generico?",
      answer:
        "Nao. O posicionamento certo e plataforma operacional para imobiliario, com foco em triagem, routing, mercado e follow-up.",
    },
    {
      question: "Serve so para Portugal?",
      answer:
        "Portugal e o mercado de entrada, mas a estrutura ja suporta desks, idiomas e expansao Iberia/Europa.",
    },
    {
      question: "O agente AI muda por plano?",
      answer:
        "Sim. O plano condiciona cobertura geografica, profundidade do agente e a capacidade operacional exposta ao cliente.",
    },
  ];
  const visibleNavItems = canAccessAdmin
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => item.id !== "admin");

  function updateLandingGuidance(title: string, detail: string) {
    setLandingGuidance({
      title,
      detail,
    });
  }

  function navigatePublicPage(page: PublicPageId, anchorId?: string) {
    setPublicPage(page);

    if (typeof window === "undefined") {
      return;
    }

    const hash = anchorId ? `#${anchorId}` : "";
    const nextUrl = `${PUBLIC_PAGE_PATHS[page]}${hash}`;

    if (`${window.location.pathname}${window.location.hash}` !== nextUrl) {
      window.history.pushState(null, "", nextUrl);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    if (anchorId) {
      window.setTimeout(() => {
        document.getElementById(anchorId)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 120);
    }
  }

  function handlePublicNavigation(event: MouseEvent<HTMLAnchorElement>, page: PublicPageId) {
    event.preventDefault();
    navigatePublicPage(page);
  }

  function enrichGuidance(detail: string, planId: PlanType) {
    return `${detail} ${getUpgradeHintForPlan(planId, plans)}`.trim();
  }

  function openLandingPricing(
    planId: PlanType,
    title: string,
    detail: string
  ) {
    setActivePlanId(planId);
    updateLandingGuidance(title, enrichGuidance(detail, planId));
    navigatePublicPage("pricing");
  }

  function openLandingLogin(
    planId: PlanType,
    title: string,
    detail: string,
    entry: DemoAccessEntry = getSuggestedDemoEntry(planId)
  ) {
    setActivePlanId(planId);
    if (PUBLIC_DEMO_ENABLED) {
      setLoginForm({
        email: entry.email,
        password: entry.password,
      });
    } else {
      setLoginForm({
        email: "",
        password: "",
      });
    }
    updateLandingGuidance(title, enrichGuidance(detail, planId));
    navigatePublicPage("login");
  }

  function selectDemoProfile(entry: DemoAccessEntry) {
    if (!PUBLIC_DEMO_ENABLED) {
      openLandingLogin(
        getPlanForDemoEntry(entry),
        "Demo assistida recomendada",
        "A demo publica esta desativada em producao. Usa credenciais reais ou pede uma sessao assistida para percorrer o fluxo completo."
      );
      return;
    }

    const suggestedPlan = getPlanForDemoEntry(entry);
    openLandingLogin(
      suggestedPlan,
      `Demo ${entry.role.toLowerCase()} pronta para entrar`,
      `Este perfil mostra a vista mais util para ${entry.description.toLowerCase()}`,
      entry
    );
  }

  async function handleStartCheckout(plan: PlanCatalogEntry) {
    const normalizedName = checkoutForm.name.trim();
    const normalizedEmail = checkoutForm.email.trim();

    if (normalizedName.length < 2) {
      setCheckoutFeedback("Indica o nome da pessoa ou da equipa que vai ativar o plano.");
      setCheckoutFeedbackTone("error");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setCheckoutFeedback("Indica um email valido para abrir o checkout.");
      setCheckoutFeedbackTone("error");
      return;
    }

    setCheckoutSubmittingPlanId(plan.basePlanId);
    setCheckoutFeedback("");

    try {
      const result = await createPaymentCheckoutSession({
        planId: plan.basePlanId,
        billingInterval: billingMode,
        customerName: normalizedName,
        customerEmail: normalizedEmail,
      });

      setCheckoutFeedbackTone("success");
      setCheckoutFeedback("Checkout preparado. Estamos a redirecionar para o Stripe.");

      if (typeof window !== "undefined") {
        window.location.assign(result.checkoutUrl);
      }
    } catch (checkoutError) {
      setCheckoutFeedbackTone("error");
      setCheckoutFeedback(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Nao foi possivel abrir o checkout neste momento."
      );
    } finally {
      setCheckoutSubmittingPlanId("");
    }
  }

  const guidedUseCases = [
    {
      id: "starter",
      eyebrow: "Consultor independente",
      title: "Entrar no Starter com trial protegido e valor imediato",
      detail:
        "Ideal para mostrar triagem, foco comercial e validacao do trial sem expor uma demo solta na frente publica.",
      tags: ["15 dias trial", "1 utilizador", "Portugal"],
      primaryLabel: "Abrir jornada Starter",
      primaryAction: () =>
        openLandingLogin(
          "basic",
          "Starter pronto para trial protegido",
          "Mostramos a entrada mais leve do produto, com controlo de trial e caminho claro para evolucao comercial.",
          DEMO_ACCESS[2]
        ),
      secondaryLabel: "Comparar com Pro",
      secondaryAction: () =>
        openLandingPricing(
          "pro",
          "Comparacao entre Starter e Pro",
          "Levamos-te para a oferta Pro para veres onde a automacao e a operacao de equipa sobem de nivel."
        ),
    },
    {
      id: "pro",
      eyebrow: "Agencia ou equipa comercial",
      title: "Ver o Pro como workspace vendavel para a maioria das equipas",
      detail:
        "A entrada certa para mostrar owners, desks, SLA, pipeline e o agente a trabalhar como copiloto operacional.",
      tags: ["Plano mais vendavel", "Ate 7 utilizadores", "Portugal + Iberia"],
      primaryLabel: "Abrir jornada Pro",
      primaryAction: () =>
        openLandingLogin(
          "pro",
          "Pro pronto para demonstracao comercial",
          "Entramos diretamente na configuracao certa para mostrar ganho de tempo, visibilidade e controlo comercial.",
          DEMO_ACCESS[1]
        ),
      secondaryLabel: "Ver plano Pro",
      secondaryAction: () =>
        openLandingPricing(
          "pro",
          "Oferta Pro em foco",
          "Mantemos o Pro selecionado para veres utilizadores, relatorios e progressao de forma imediata."
        ),
    },
    {
      id: "enterprise",
      eyebrow: "Rede multi-loja ou direcao",
      title: "Abrir a leitura enterprise para decisores e expansao",
      detail:
        "Mostra governance, cobertura geografica, controlo ADM e estrutura preparada para Portugal hoje e Europa a seguir.",
      tags: ["25 utilizadores", "ADM e governance", "Expansao europeia"],
      primaryLabel: "Abrir jornada Enterprise",
      primaryAction: () =>
        openLandingLogin(
          "custom",
          "Enterprise preparado para decisores",
          "Levamos a demonstracao para a leitura executiva certa, com foco em governance, equipas e escala.",
          DEMO_ACCESS[0]
        ),
      secondaryLabel: "Falar com a equipa",
      secondaryAction: () => navigatePublicPage("contact"),
    },
  ];

  const visibleLeads = leads.filter((lead) => {
    const term = deferredSearch.trim().toLowerCase();

    if (stageFilter !== "all" && lead.pipelineStage !== stageFilter) {
      return false;
    }

    if (officeFilter !== "all" && lead.officeName !== officeFilter) {
      return false;
    }

    if (!term) {
      return true;
    }

    return [
      lead.name,
      lead.property,
      lead.location,
      lead.source,
      lead.routingBucket,
      lead.assignedOwner,
      lead.officeName,
      lead.market,
      lead.nextStep,
    ]
      .join(" ")
      .toLowerCase()
      .includes(term);
  });

  const stageColumns = STAGE_ORDER.map((stage) => {
    const stageLeads = visibleLeads.filter((lead) => lead.pipelineStage === stage);
    const averageScore =
      stageLeads.length > 0
        ? Math.round(
            stageLeads.reduce((total, lead) => total + lead.aiScore, 0) / stageLeads.length
          )
        : 0;

    return {
      id: stage,
      label: getStageLabel(stage),
      leads: stageLeads,
      averageScore,
    };
  });

  const topHotLeads = [...leads]
    .filter((lead) => lead.status === "quente")
    .sort((left, right) => right.aiScore - left.aiScore)
    .slice(0, 4);

  const followUpQueue = [...leads]
    .filter((lead) => Boolean(lead.followUpAt))
    .sort((left, right) => {
      const leftDate = left.followUpAt
        ? new Date(left.followUpAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      const rightDate = right.followUpAt
        ? new Date(right.followUpAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      return leftDate - rightDate;
    })
    .slice(0, 5);
  const communicationLead = topHotLeads[0] || followUpQueue[0] || leads[0] || null;
  const communicationEmail = extractEmailFromContact(communicationLead?.contact);
  const communicationPhone = extractPhoneFromContact(communicationLead?.contact);
  const communicationEmailSubject = communicationLead ? buildLeadEmailSubject(communicationLead) : "";
  const communicationEmailBody = communicationLead ? buildLeadEmailBody(communicationLead) : "";
  const communicationWhatsAppBody = communicationLead
    ? buildLeadWhatsAppMessage(communicationLead)
    : "";
  const communicationMailto =
    communicationLead && communicationEmail
      ? `mailto:${communicationEmail}?subject=${encodeURIComponent(communicationEmailSubject)}&body=${encodeURIComponent(communicationEmailBody)}`
      : "";
  const communicationWhatsAppUrl =
    communicationLead && communicationPhone
      ? `https://wa.me/${communicationPhone}?text=${encodeURIComponent(communicationWhatsAppBody)}`
      : "";
  const activeAgentCapabilities = (activePlan?.agentCapabilities || []).slice(0, 4);
  const radarHighlight = topMarket
    ? `${topMarket.market} lidera o radar com ${topMarket.totalLeads} leads, score medio ${topMarket.averageAiScore} e ${topMarket.overdueFollowUps} follow-ups atrasados.`
    : "Radar pronto para ler o primeiro lote de leads assim que entrarem no workspace.";
  const topRadarSources = topMarket?.topSources?.slice(0, 3).join(" · ") || dominantSource;

  const viewMeta =
    visibleNavItems.find((item) => item.id === activeView) || visibleNavItems[0];

  useEffect(() => {
    if (!activePlan || !form.countryCode) {
      return;
    }

    if (!activePlan.includedCountryCodes.includes(form.countryCode)) {
      const fallbackCountry = COUNTRY_OPTIONS.find((item) =>
        activePlan.includedCountryCodes.includes(item.code)
      );

      setForm((current) => ({
        ...current,
        countryCode: fallbackCountry?.code || "PT",
        preferredLanguage: fallbackCountry?.language || "pt-PT",
      }));
    }
  }, [activePlan, form.countryCode]);

  function renderPipelineForm() {
    return (
      <form className="lead-form" onSubmit={handleSubmit}>
        <div className="form-helper">
          <strong>{activePlan?.publicName || "ImoLead Pro"}</strong>
          <span>
            {(activePlan?.agentLabel || "AI Copilot") + " · mercados ativos: "}
            {activePlan?.includedMarkets.join(", ") || "Portugal, Espanha"}
          </span>
        </div>

        <label>
          Nome do proprietario
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Ex.: Ana Ferreira"
            required
          />
        </label>

        <label>
          Imovel
          <input
            value={form.property}
            onChange={(event) =>
              setForm((current) => ({ ...current, property: event.target.value }))
            }
            placeholder="Ex.: T4 premium com jardim"
          />
        </label>

        <div className="form-row">
          <label>
            Localizacao
            <input
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({ ...current, location: event.target.value }))
              }
              placeholder="Lisboa, Porto, Madrid..."
              required
            />
          </label>

          <label>
            Preco pedido
            <input
              type="number"
              min="1"
              value={form.price}
              onChange={(event) =>
                setForm((current) => ({ ...current, price: event.target.value }))
              }
              placeholder="650000"
              required
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Pais
            <select
              value={form.countryCode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  countryCode: event.target.value,
                  preferredLanguage:
                    COUNTRY_OPTIONS.find((item) => item.code === event.target.value)?.language ||
                    current.preferredLanguage,
                }))
              }
            >
              {COUNTRY_OPTIONS.filter((item) => availableCountries.includes(item.code)).map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Idioma
            <select
              value={form.preferredLanguage}
              onChange={(event) =>
                setForm((current) => ({ ...current, preferredLanguage: event.target.value }))
              }
            >
              <option value="pt-PT">Portugues</option>
              <option value="es-ES">Espanhol</option>
              <option value="en-GB">Ingles</option>
              <option value="fr-FR">Frances</option>
              <option value="it-IT">Italiano</option>
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            Area m2
            <input
              type="number"
              min="0"
              value={form.area}
              onChange={(event) =>
                setForm((current) => ({ ...current, area: event.target.value }))
              }
              placeholder="140"
            />
          </label>

          <label>
            Fonte
            <select
              value={form.source}
              onChange={(event) =>
                setForm((current) => ({ ...current, source: event.target.value }))
              }
            >
              <option value="Manual">Manual</option>
              <option value="Idealista">Idealista</option>
              <option value="Casafari">Casafari</option>
              <option value="OLX">OLX</option>
            </select>
          </label>
        </div>

        <label>
          Contacto
          <input
            value={form.contact}
            onChange={(event) =>
              setForm((current) => ({ ...current, contact: event.target.value }))
            }
            placeholder="email ou telefone"
          />
        </label>

        <label>
          Notas operacionais
          <textarea
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Motivacao do vendedor, urgencia, contexto da carteira"
            rows={4}
          />
        </label>

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "A analisar..." : "Criar e distribuir lead"}
        </button>
      </form>
    );
  }

  function renderDashboardView() {
    return (
      <div className="page-stack">
        <section className="hero-panel shell-panel command-panel">
          <div className="hero-copy command-copy">
            <p className="eyebrow">ImoLead AI Pro Enterprise</p>
            <h2>Agente AI, radar de mercado e comunicacao prontos no mesmo cockpit.</h2>
            <p className="hero-text">
              O workspace passa a mostrar quem o agente vai atacar, onde o radar esta a aquecer
              e que mensagem sai por email ou WhatsApp para a equipa agir no momento certo.
            </p>

            <div className="hero-actions hero-actions-grid">
              <div className="status-chip">{apiState}</div>
              <div className="status-chip muted">
                AI {aiMode === "hybrid" ? "externa + heuristica" : "heuristica"}
              </div>
              <div className="status-chip muted">
                {dashboardStats.average_ai_score} score medio AI
              </div>
              <div className="status-chip muted">
                {dashboardStats.active_offices} lojas ativas
              </div>
              <div className="status-chip muted">
                DB {databaseConfigured ? "configurada" : "fallback local"}
              </div>
            </div>

            <div className="command-strips">
              {commandSignals.map((signal) => (
                <article className="command-strip" key={signal.label}>
                  <span>{signal.label}</span>
                  <strong>{signal.value}</strong>
                  <p>{signal.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="hero-visual command-surface">
            <article className="command-surface-card command-surface-primary">
              <span>Radar do mercado</span>
              <strong>
                {topMarket
                  ? `${topMarket.market} lidera com ${topMarket.totalLeads} leads e score medio ${topMarket.averageAiScore}.`
                  : `${dashboardStats.overdue_followups} follow-ups estao em atraso.`}
              </strong>
              <p>{radarHighlight}</p>
            </article>

            <div className="command-surface-grid">
              <article className="command-surface-card">
                <span>Heat index</span>
                <strong>{hotLeadRatio}%</strong>
                <p>Carteira em estado quente e com urgencia comercial visivel.</p>
              </article>

              <article className="command-surface-card">
                <span>Fonte dominante</span>
                <strong>{dominantSource}</strong>
                <p>Origem mais forte a alimentar a operacao neste momento.</p>
              </article>

              <article className="command-surface-card">
                <span>Routing mix</span>
                <div className="routing-mix">
                  {routingMix.map((item) => (
                    <div className={`routing-row ${item.tone}`} key={item.label}>
                      <small>{item.label}</small>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="command-surface-card">
                <span>Agente ativo</span>
                <strong>{activePlan?.agentLabel || communicationLead?.agentLabel || marketingAiLabel}</strong>
                <p>
                  {activePlan
                    ? `${activePlan.publicName} com ${activePlan.reportsLabel.toLowerCase()} e cadencia operacional pronta.`
                    : "Workspace pronto para ativar o agente comercial."}
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="summary-grid">
          <article className="summary-card">
            <span>Total de leads</span>
            <strong>{dashboardStats.total}</strong>
          </article>
          <article className="summary-card warm">
            <span>Follow-ups em atraso</span>
            <strong>{dashboardStats.overdue_followups}</strong>
          </article>
          <article className="summary-card cold">
            <span>Mercados ativos</span>
            <strong>{dashboardStats.european_markets}</strong>
          </article>
          <article className="summary-card hot">
            <span>Desk flagship</span>
            <strong>{dashboardStats.flagship_queue}</strong>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="shell-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Ataque prioritario</p>
                <h3>Leads quentes a proteger</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => navigateTo("pipeline")}>
                Abrir pipeline
              </button>
            </div>

            <div className="stack-list">
              {topHotLeads.length === 0 ? <p className="feedback">Sem leads quentes nesta fase.</p> : null}
              {topHotLeads.map((lead) => (
                <article className="stack-item" key={lead.id}>
                  <div>
                    <strong>{lead.name}</strong>
                    <p>{lead.location} · {lead.officeName}</p>
                  </div>
                  <div className="stack-meta">
                    <span>AI {lead.aiScore}</span>
                    <span>{formatCurrency(lead.price, lead.currencyCode)}</span>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="shell-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Radar do mercado</p>
                <h3>Mercado, origem e desk em leitura unica</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => navigateTo("reports")}>
                Abrir radar
              </button>
            </div>

            <div className="signal-grid">
              {marketInsights.slice(0, 4).map((market) => (
                <article className="signal-card" key={market.market}>
                  <span>{market.market}</span>
                  <strong>{market.totalLeads} leads</strong>
                  <p>
                    Score medio {market.averageAiScore} · ticket medio{" "}
                    {formatCurrency(market.averagePrice)}
                  </p>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section className="dashboard-grid dashboard-grid-bottom">
          <article className="shell-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Agenda comercial</p>
                <h3>Proximos follow-ups</h3>
              </div>
            </div>

            <div className="timeline-list">
              {followUpQueue.length === 0 ? <p className="feedback">Sem follow-ups agendados.</p> : null}
              {followUpQueue.map((lead) => (
                <article className="timeline-item" key={lead.id}>
                  <div className="timeline-dot" />
                  <div>
                    <strong>{lead.name}</strong>
                    <p>{lead.nextStep} · {lead.assignedOwner}</p>
                  </div>
                  <span>{formatDate(lead.followUpAt)}</span>
                </article>
              ))}
            </div>
          </article>

          <article className="shell-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Agente por plano</p>
                <h3>Preview comercial</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => navigateTo("pricing")}>
                Ver pricing
              </button>
            </div>

            <div className="plan-preview-list">
              {plans.map((plan) => (
                <article
                  className={
                    plan.basePlanId === activePlanId ? "plan-preview active" : "plan-preview"
                  }
                  key={plan.id}
                >
                  <span>{plan.publicName}</span>
                  <strong>{plan.agentLabel}</strong>
                  <p>{plan.recommendedFor}</p>
                  <p className="pricing-note">
                    {formatIncludedUsers(plan.includedUsers)} · {formatExtraUsers(plan, billingMode)}
                  </p>
                  <p className="upgrade-note">{getUpgradeHintForPlan(plan.basePlanId, plans)}</p>
                </article>
              ))}
            </div>
          </article>
        </section>
      </div>
    );
  }

  void renderDashboardView;

  function renderOperationalDashboardView() {
    return (
      <div className="page-stack">
        <section className="hero-panel shell-panel command-panel">
          <div className="hero-copy command-copy">
            <p className="eyebrow">ImoLead AI Pro Enterprise</p>
            <h2>Agente AI, radar de mercado e comunicacao prontos no mesmo cockpit.</h2>
            <p className="hero-text">
              O workspace passa a mostrar quem o agente vai atacar, onde o radar esta a aquecer
              e que mensagem sai por email ou WhatsApp para a equipa agir no momento certo.
            </p>

            <div className="hero-actions hero-actions-grid">
              <div className="status-chip">{apiState}</div>
              <div className="status-chip muted">
                AI {aiMode === "hybrid" ? "externa + heuristica" : "heuristica"}
              </div>
              <div className="status-chip muted">
                {dashboardStats.average_ai_score} score medio AI
              </div>
              <div className="status-chip muted">
                {dashboardStats.active_offices} lojas ativas
              </div>
              <div className="status-chip muted">
                DB {databaseConfigured ? "configurada" : "fallback local"}
              </div>
            </div>

            <div className="command-strips">
              {commandSignals.map((signal) => (
                <article className="command-strip" key={signal.label}>
                  <span>{signal.label}</span>
                  <strong>{signal.value}</strong>
                  <p>{signal.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="hero-visual market-stage">
            <img src={homeFullImg} alt="Painel enterprise ImoLead AI Pro" />
            <div className="market-stage-grid">
              <div className="insight-card spotlight-card">
                <span>Radar do mercado</span>
                <strong>
                  {topMarket
                    ? `${topMarket.market} lidera com ${topMarket.totalLeads} leads e score medio ${topMarket.averageAiScore}.`
                    : `${dashboardStats.overdue_followups} follow-ups estao em atraso.`}
                </strong>
              </div>

              <article className="floating-card metric-card">
                <span>Heat index</span>
                <strong>{hotLeadRatio}%</strong>
                <p>Da carteira atual esta em estado quente.</p>
              </article>

              <article className="floating-card metric-card">
                <span>Fonte dominante</span>
                <strong>{dominantSource}</strong>
                <p>Canal com maior volume na operacao atual.</p>
              </article>

              <article className="floating-card routing-card">
                <span>Routing mix</span>
                <div className="routing-mix">
                  {routingMix.map((item) => (
                    <div className={`routing-row ${item.tone}`} key={item.label}>
                      <small>{item.label}</small>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="summary-grid">
          <article className="summary-card">
            <span>Total de leads</span>
            <strong>{dashboardStats.total}</strong>
          </article>
          <article className="summary-card warm">
            <span>Follow-ups em atraso</span>
            <strong>{dashboardStats.overdue_followups}</strong>
          </article>
          <article className="summary-card cold">
            <span>Mercados ativos</span>
            <strong>{dashboardStats.european_markets}</strong>
          </article>
          <article className="summary-card hot">
            <span>Desk flagship</span>
            <strong>{dashboardStats.flagship_queue}</strong>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="shell-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Ataque prioritario</p>
                <h3>Leads quentes a proteger</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => navigateTo("pipeline")}>
                Abrir pipeline
              </button>
            </div>

            <div className="stack-list">
              {topHotLeads.length === 0 ? <p className="feedback">Sem leads quentes nesta fase.</p> : null}
              {topHotLeads.map((lead) => (
                <article className="stack-item" key={lead.id}>
                  <div>
                    <strong>{lead.name}</strong>
                    <p>{lead.location} - {lead.officeName}</p>
                  </div>
                  <div className="stack-meta">
                    <span>AI {lead.aiScore}</span>
                    <span>{formatCurrency(lead.price, lead.currencyCode)}</span>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="shell-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Radar do mercado</p>
                <h3>Mercado, origem e desk em leitura unica</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => navigateTo("reports")}>
                Abrir radar
              </button>
            </div>

            <div className="signal-grid">
              {marketInsights.slice(0, 4).map((market) => (
                <article className="signal-card" key={market.market}>
                  <span>{market.market}</span>
                  <strong>{market.totalLeads} leads</strong>
                  <p>Score medio {market.averageAiScore} - ticket medio {formatCurrency(market.averagePrice)}</p>
                  <p>
                    Fontes {market.topSources.slice(0, 2).join(" / ") || "Manual"} - {market.officeCount} lojas
                  </p>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section className="dashboard-grid dashboard-grid-bottom">
          <article className="shell-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Agente AI</p>
                <h3>Motor operacional em comando</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => navigateTo("pricing")}>
                Ver planos
              </button>
            </div>

            <article className="agent-command-card">
              <div className="agent-command-head">
                <div>
                  <span className="eyebrow">Agente ativo</span>
                  <strong>{activePlan?.agentLabel || communicationLead?.agentLabel || marketingAiLabel}</strong>
                </div>
                <div className="agent-status-group">
                  <span className="status-chip muted">{session?.user.planName || activePlan?.publicName || "Workspace"}</span>
                  <span className="status-chip muted">
                    {aiMode === "hybrid" ? "IA externa com heuristica" : "Heuristica orientada por regras"}
                  </span>
                </div>
              </div>

              <p className="agent-command-copy">{radarHighlight}</p>

              <div className="agent-capability-grid">
                {activeAgentCapabilities.length === 0 ? (
                  <article className="signal-card">
                    <span>Capacidade</span>
                    <strong>Agente em preparacao</strong>
                    <p>Ativa um plano comercial para desbloquear guidance, radar e outreach.</p>
                  </article>
                ) : null}
                {activeAgentCapabilities.map((capability) => (
                  <article className="signal-card" key={capability}>
                    <span>Capacidade</span>
                    <strong>{capability}</strong>
                    <p>Ligado ao plano ativo e a leitura comercial do workspace.</p>
                  </article>
                ))}
              </div>

              {communicationLead ? (
                <div className="agent-priority-box">
                  <span>Lead prioritario agora</span>
                  <strong>{communicationLead.name}</strong>
                  <p>
                    {communicationLead.location} - {communicationLead.officeName} - Desk{" "}
                    {getBucketLabel(communicationLead.routingBucket)}
                  </p>
                  <p>{communicationLead.recommendedAction}</p>
                </div>
              ) : null}
            </article>
          </article>

          <article className="shell-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Centro de comunicacao</p>
                <h3>Email e WhatsApp prontos a sair</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => navigateTo("pipeline")}>
                Ver leads
              </button>
            </div>

            {workspaceFeedback ? <p className="feedback success">{workspaceFeedback}</p> : null}

            {communicationLead ? (
              <article className="communication-card">
                <div className="communication-head">
                  <div>
                    <span className="eyebrow">Lead em foco</span>
                    <strong>{communicationLead.name}</strong>
                    <p>
                      {communicationLead.location} - {communicationLead.market} - AI {communicationLead.aiScore}
                    </p>
                  </div>
                  <div className="communication-contact-stack">
                    <span className="contact-pill">Email {communicationEmail || "por validar"}</span>
                    <span className="contact-pill">
                      WhatsApp {communicationPhone ? `+${communicationPhone}` : "sem numero"}
                    </span>
                  </div>
                </div>

                <div className="communication-channel-grid">
                  <div className="outreach-box">
                    <span>Email pronto</span>
                    <p>{communicationEmailBody}</p>
                    <div className="communication-actions">
                      <button
                        className="primary-button"
                        type="button"
                        disabled={!communicationEmail}
                        onClick={() =>
                          handleOpenExternal(
                            communicationMailto,
                            "Este lead ainda nao tem email para abrir a mensagem."
                          )
                        }
                      >
                        Abrir email
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() =>
                          void handleCopyText(
                            communicationEmailBody,
                            "Texto de email copiado para a equipa."
                          )
                        }
                      >
                        Copiar email
                      </button>
                    </div>
                  </div>

                  <div className="outreach-box">
                    <span>WhatsApp pronto</span>
                    <p>{communicationWhatsAppBody}</p>
                    <div className="communication-actions">
                      <button
                        className="primary-button"
                        type="button"
                        disabled={!communicationPhone}
                        onClick={() =>
                          handleOpenExternal(
                            communicationWhatsAppUrl,
                            "Este lead ainda nao tem numero valido para WhatsApp."
                          )
                        }
                      >
                        Abrir WhatsApp
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() =>
                          void handleCopyText(
                            communicationWhatsAppBody,
                            "Texto de WhatsApp copiado para a equipa."
                          )
                        }
                      >
                        Copiar WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ) : (
              <p className="feedback">Sem leads para gerar comunicacao nesta fase.</p>
            )}
          </article>
        </section>

        <section className="shell-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Agenda comercial</p>
              <h3>Proximos follow-ups e radar operacional</h3>
            </div>
            <button className="ghost-button" type="button" onClick={() => navigateTo("pipeline")}>
              Abrir pipeline
            </button>
          </div>

          <div className="timeline-list">
            {followUpQueue.length === 0 ? <p className="feedback">Sem follow-ups agendados.</p> : null}
            {followUpQueue.map((lead) => (
              <article className="timeline-item" key={lead.id}>
                <div className="timeline-dot" />
                <div>
                  <strong>{lead.name}</strong>
                  <p>{lead.nextStep} - {lead.assignedOwner}</p>
                </div>
                <span>{formatDate(lead.followUpAt)}</span>
              </article>
            ))}
          </div>

          <div className="agenda-radar-grid">
            <article className="signal-card">
              <span>Radar atual</span>
              <strong>{topMarket?.market || "Portugal"}</strong>
              <p>{radarHighlight}</p>
            </article>

            <article className="signal-card">
              <span>Fontes quentes</span>
              <strong>{topRadarSources}</strong>
              <p>Origens que mais alimentam a operacao e merecem cadencia imediata.</p>
            </article>

            <article className="signal-card">
              <span>Agente em campo</span>
              <strong>{activePlan?.agentLabel || marketingAiLabel}</strong>
              <p>
                {activePlan
                  ? `${activePlan.publicName} com ${activePlan.reportsLabel.toLowerCase()} e guidance comercial ativo.`
                  : "Plano ativo por definir para desbloquear a camada completa do agente."}
              </p>
            </article>
          </div>
        </section>
      </div>
    );
  }

  function renderPipelineView() {
    return (
      <div className="page-stack">
        <section className="pipeline-layout">
          <aside className="shell-panel intake-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Entrada operacional</p>
                <h3>Novo lead enterprise</h3>
              </div>
            </div>
            {renderPipelineForm()}
          </aside>

          <section className="shell-panel board-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Fila comercial</p>
                <h3>Pipeline com foco em execucao</h3>
              </div>
            </div>

            <div className="toolbar-grid">
              <input
                className="search-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filtrar por cidade, owner, loja, market ou acao"
              />

              <select
                value={stageFilter}
                onChange={(event) =>
                  setStageFilter(event.target.value as PipelineStage | "all")
                }
              >
                <option value="all">Todas as fases</option>
                {STAGE_ORDER.map((stage) => (
                  <option key={stage} value={stage}>
                    {getStageLabel(stage)}
                  </option>
                ))}
              </select>

              <select
                value={officeFilter}
                onChange={(event) => setOfficeFilter(event.target.value)}
              >
                <option value="all">Todas as lojas</option>
                {offices.map((office) => (
                  <option key={office.id} value={office.name}>
                    {office.name}
                  </option>
                ))}
              </select>
            </div>

            {error ? <p className="feedback error">{error}</p> : null}
            {loading ? <p className="feedback">A carregar leads...</p> : null}

            {!loading && visibleLeads.length === 0 ? (
              <p className="feedback">Nenhum lead encontrado para o filtro atual.</p>
            ) : null}

            <div className="kanban-board">
              {stageColumns.map((column) => (
                <section className="kanban-column" key={column.id}>
                  <header className="kanban-header">
                    <div>
                      <span>{column.label}</span>
                      <strong>{column.leads.length}</strong>
                    </div>
                    <small>{column.averageScore} AI medio</small>
                  </header>

                  <div className="kanban-stack">
                    {column.leads.length === 0 ? (
                      <p className="empty-column">Sem leads nesta fase.</p>
                    ) : null}

                    {column.leads.map((lead) => {
                      const draft = workflowDrafts[lead.id] || {
                        pipelineStage: lead.pipelineStage,
                        assignedOwner: lead.assignedOwner,
                        nextStep: lead.nextStep,
                        followUpAt: toInputDateTime(lead.followUpAt),
                        lastContactAt: toInputDateTime(lead.lastContactAt),
                      };

                      const ownerOptions = members.filter(
                        (member) =>
                          member.teamName === lead.assignedTeam ||
                          member.officeName === lead.officeName
                      );

                      const owners = [
                        lead.assignedOwner,
                        ...ownerOptions.map((member) => member.name),
                      ].filter(
                        (owner, index, array): owner is string =>
                          Boolean(owner) && array.indexOf(owner) === index
                      );

                      return (
                        <article className="pipeline-card" key={lead.id}>
                          <div className="pipeline-card-head">
                            <div>
                              <strong>{lead.name}</strong>
                              <p>{lead.property || "Carteira sem titulo"}</p>
                            </div>
                            <span className={`badge ${lead.status}`}>{lead.status}</span>
                          </div>

                          <div className="pipeline-card-meta">
                            <span>{lead.location}</span>
                            <span>{formatCurrency(lead.price, lead.currencyCode)}</span>
                          </div>

                          <div className="mini-tags">
                            <span>AI {lead.aiScore}</span>
                            <span>{getBucketLabel(lead.routingBucket)}</span>
                            <span>{lead.officeName}</span>
                            <span>{lead.planName}</span>
                          </div>

                          <p className="pipeline-action">{lead.recommendedAction}</p>
                          <p className="pipeline-reasoning">{lead.reasoning}</p>

                          <div className="workflow-compact">
                            <label>
                              Fase
                              <select
                                value={draft.pipelineStage || lead.pipelineStage}
                                onChange={(event) =>
                                  handleWorkflowChange(lead.id, {
                                    pipelineStage: event.target.value as PipelineStage,
                                  })
                                }
                              >
                                {STAGE_ORDER.map((stage) => (
                                  <option key={stage} value={stage}>
                                    {getStageLabel(stage)}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label>
                              Owner
                              <select
                                disabled={!canReassignOwners}
                                value={draft.assignedOwner || lead.assignedOwner}
                                onChange={(event) =>
                                  handleWorkflowChange(lead.id, {
                                    assignedOwner: event.target.value,
                                  })
                                }
                              >
                                {owners.map((owner) => (
                                  <option key={owner} value={owner}>
                                    {owner}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="workflow-span">
                              Proximo passo
                              <input
                                value={draft.nextStep || ""}
                                onChange={(event) =>
                                  handleWorkflowChange(lead.id, {
                                    nextStep: event.target.value,
                                  })
                                }
                              />
                            </label>

                            <label>
                              Follow-up
                              <input
                                type="datetime-local"
                                value={draft.followUpAt || ""}
                                onChange={(event) =>
                                  handleWorkflowChange(lead.id, {
                                    followUpAt: event.target.value,
                                  })
                                }
                              />
                            </label>

                            <label>
                              Ultimo contacto
                              <input
                                type="datetime-local"
                                value={draft.lastContactAt || ""}
                                onChange={(event) =>
                                  handleWorkflowChange(lead.id, {
                                    lastContactAt: event.target.value,
                                  })
                                }
                              />
                            </label>
                          </div>

                          <div className="pipeline-footer">
                            <span>{lead.assignedTeam}</span>
                            <span>SLA {lead.slaHours}h</span>
                          </div>

                          <button
                            className="secondary-button"
                            type="button"
                            disabled={savingLeadId === lead.id}
                            onClick={() => void handleWorkflowSave(lead.id)}
                          >
                            {savingLeadId === lead.id ? "A guardar..." : "Atualizar workflow"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </section>
      </div>
    );
  }

  function renderTeamsView() {
    return (
      <div className="page-stack">
        <section className="summary-grid">
          <article className="summary-card">
            <span>Lojas</span>
            <strong>{offices.length}</strong>
          </article>
          <article className="summary-card">
            <span>Owners</span>
            <strong>{members.length}</strong>
          </article>
          <article className="summary-card">
            <span>Mercados cobertos</span>
            <strong>{markets.length}</strong>
          </article>
          <article className="summary-card">
            <span>Linguas operacionais</span>
            <strong>{languages.length}</strong>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="shell-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Cobertura</p>
                <h3>Mercados e linguas</h3>
              </div>
            </div>

            <div className="tag-cloud">
              {markets.map((market) => (
                <span key={market}>{market}</span>
              ))}
            </div>

            <div className="tag-cloud">
              {languages.map((language) => (
                <span key={language}>{language}</span>
              ))}
            </div>
          </article>

          <article className="shell-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Governo operacional</p>
                <h3>Leitura atual da rede</h3>
              </div>
            </div>

            <div className="stack-list">
              <article className="stack-item">
                <div>
                  <strong>{dashboardStats.active_teams} desks ativos</strong>
                  <p>Distribuicao real entre flagship, growth e nurture.</p>
                </div>
              </article>
              <article className="stack-item">
                <div>
                  <strong>{dashboardStats.contacted_today} leads contactados hoje</strong>
                  <p>Indicador rapido de atividade comercial diaria.</p>
                </div>
              </article>
              <article className="stack-item">
                <div>
                  <strong>{dashboardStats.urgent_actions} acoes urgentes</strong>
                  <p>Itens com SLA curto e risco de perda de oportunidade.</p>
                </div>
              </article>
            </div>
          </article>
        </section>

        <section className="shell-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Lojas e desks</p>
              <h3>Base pronta para Portugal e expansao europeia</h3>
            </div>
          </div>

          <div className="office-grid">
            {offices.map((office) => (
              <article className="office-card" key={office.id}>
                <span>{office.name}</span>
                <strong>
                  {office.city} · {office.timezone}
                </strong>
                <p>{office.focus}</p>
                <div className="mini-tags">
                  {office.coverageMarkets.map((market) => (
                    <span key={market}>{market}</span>
                  ))}
                </div>
                <div className="mini-tags">
                  {office.languages.map((language) => (
                    <span key={language}>{language}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="shell-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Owners</p>
              <h3>Roster operacional</h3>
            </div>
          </div>

          <div className="member-grid">
            {members.map((member) => (
              <article className="member-card" key={member.id}>
                <strong>{member.name}</strong>
                <span>{member.role}</span>
                <p>
                  {member.teamName} · {member.officeName}
                </p>
                <div className="mini-tags">
                  {member.marketFocus.map((focus) => (
                    <span key={focus}>{focus}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  function renderReportsView() {
    return (
      <div className="page-stack">
        <section className="shell-panel report-hero">
          <div>
            <p className="eyebrow">Market radar</p>
            <h3>
              {topMarket
                ? `${topMarket.market} lidera o radar atual.`
                : "Sem mercado lider neste momento."}
            </h3>
            <p className="hero-text">
              Esta pagina concentra o pulso do mercado, combinando carteira ativa,
              score AI, backlog comercial e cadencia de relatorios por plano.
            </p>
          </div>

          <div className="signal-grid">
            <article className="signal-card">
              <span>Ticket medio</span>
              <strong>
                {topMarket ? formatCurrency(topMarket.averagePrice) : formatCurrency(0)}
              </strong>
              <p>Na geografia com maior volume operacional.</p>
            </article>
            <article className="signal-card">
              <span>Hot leads</span>
              <strong>{topMarket ? topMarket.hotLeads : 0}</strong>
              <p>Leads com maior urgencia de protecao comercial.</p>
            </article>
            <article className="signal-card">
              <span>Fonte lider</span>
              <strong>{sourceMix[0]?.[0] || "Sem dados"}</strong>
              <p>Canal dominante na carteira atual.</p>
            </article>
          </div>
        </section>

        <section className="report-grid">
          {marketInsights.map((insight) => (
            <article className="report-card" key={insight.market}>
              <span>{insight.market}</span>
              <strong>{insight.totalLeads} leads</strong>
              <p>Score medio {insight.averageAiScore}</p>
              <p>Ticket medio {formatCurrency(insight.averagePrice)}</p>
              <p>{insight.officeCount} desks com cobertura</p>
              <p>{insight.overdueFollowUps} follow-ups em risco</p>
              <div className="mini-tags">
                {insight.topSources.map((source) => (
                  <span key={source}>{source}</span>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="shell-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Cadencia por plano</p>
              <h3>Relatorios de mercado incluidos</h3>
            </div>
          </div>

          <div className="pricing-grid compact-grid">
            {plans.map((plan) => (
              <article className="pricing-card compact-pricing" key={plan.id}>
                <span>{plan.publicName}</span>
                <strong>{plan.reportsLabel}</strong>
                <p>{plan.recommendedFor}</p>
                <p className="pricing-note">
                  {formatIncludedUsers(plan.includedUsers)} · {formatExtraUsers(plan, billingMode)}
                </p>
                <p className="upgrade-note">{getUpgradeHintForPlan(plan.basePlanId, plans)}</p>
                <div className="mini-tags">
                  {getTrialDaysForPlan(plan.basePlanId) > 0 ? (
                    <span>{getTrialDaysForPlan(plan.basePlanId)} dias trial</span>
                  ) : null}
                  <span>{formatLeadLimit(plan.leadLimit)}</span>
                  {plan.marketReports.map((report) => (
                    <span key={report}>{report}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  function renderPricingView() {
    return (
      <div className="page-stack">
        <section className="shell-panel pricing-shell">
          <div className="section-head">
            <div>
              <p className="eyebrow">Oferta comercial</p>
              <h3>Planos pensados para Portugal e escalaveis para Europa</h3>
            </div>

            <div className="billing-toggle">
              <button
                className={billingMode === "month" ? "toggle-button active" : "toggle-button"}
                type="button"
                onClick={() => setBillingMode("month")}
              >
                Mensal
              </button>
              <button
                className={billingMode === "year" ? "toggle-button active" : "toggle-button"}
                type="button"
                onClick={() => setBillingMode("year")}
              >
                Anual -20%
              </button>
            </div>
          </div>

          <div className="pricing-grid">
            {plans.map((plan) => {
              const isFeatured = plan.basePlanId === "pro";
              const price =
                billingMode === "month"
                  ? formatCurrency(plan.monthlyPrice)
                  : formatCurrency(plan.yearlyPrice, "EUR", true);
              const period = billingMode === "month" ? "/mes" : "/ano";
              const equivalentMonthly = formatCurrency(plan.yearlyPrice / 12, "EUR", true);

              return (
                <article
                  className={isFeatured ? "pricing-card featured" : "pricing-card"}
                  key={plan.id}
                >
                  <div className="pricing-head">
                    <span>{plan.publicName}</span>
                    <strong>
                      {price}
                      <small>{period}</small>
                    </strong>
                    <p>{plan.recommendedFor}</p>
                  </div>

                  <div className="mini-tags">
                    {getTrialDaysForPlan(plan.basePlanId) > 0 ? (
                      <span>{getTrialDaysForPlan(plan.basePlanId)} dias trial</span>
                    ) : null}
                    <span>{formatLeadLimit(plan.leadLimit)}</span>
                    <span>{formatIncludedUsers(plan.includedUsers)}</span>
                    <span>{plan.agentLabel}</span>
                  </div>

                  <p className="pricing-note">
                    {formatExtraUsers(plan, billingMode)} · {plan.reportsLabel}
                  </p>
                  <p className="upgrade-note">{getUpgradeHintForPlan(plan.basePlanId, plans)}</p>
                  <p className="pricing-note">
                    Capacidade operacional mensal, nao promessa de captacao garantida.
                  </p>

                  <div className="pricing-action-row">
                    <button
                      className={
                        plan.basePlanId === activePlanId
                          ? "select-plan-button active"
                          : "select-plan-button"
                      }
                      type="button"
                      disabled={!canSwitchPlan}
                      onClick={() => setActivePlanId(plan.basePlanId)}
                    >
                      {session
                        ? plan.basePlanId === activePlanId
                          ? "Plano do utilizador"
                          : "Bloqueado pelo perfil"
                        : getTrialDaysForPlan(plan.basePlanId) > 0
                          ? plan.basePlanId === activePlanId
                            ? `Trial de ${getTrialDaysForPlan(plan.basePlanId)} dias ativo`
                            : `Comecar trial de ${getTrialDaysForPlan(plan.basePlanId)} dias`
                          : plan.basePlanId === activePlanId
                            ? "Plano ativo no workspace"
                            : "Usar neste workspace"}
                    </button>
                  </div>

                  {billingMode === "year" ? (
                    <p className="pricing-note">
                      Equivale a {equivalentMonthly}/mes com desconto anual fixo de{" "}
                      {plan.annualDiscountPercent}%.
                    </p>
                  ) : null}

                  <div className="pricing-section">
                    <p className="pricing-section-title">Core</p>
                    <ul className="feature-list">
                      {plan.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pricing-section">
                    <p className="pricing-section-title">Utilizadores</p>
                    <ul className="feature-list compact-list">
                      <li>{formatIncludedUsers(plan.includedUsers)}</li>
                      <li>{formatExtraUsers(plan, billingMode)}</li>
                    </ul>
                  </div>

                  <div className="pricing-section">
                    <p className="pricing-section-title">Agente AI</p>
                    <div className="agent-box">
                      <span>{plan.agentLabel}</span>
                      <ul className="feature-list compact-list">
                        {plan.agentCapabilities.map((capability) => (
                          <li key={capability}>{capability}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pricing-section">
                    <p className="pricing-section-title">Mercados incluidos</p>
                    <div className="mini-tags">
                      {plan.includedMarkets.map((market) => (
                        <span key={market}>{market}</span>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  function renderAdminPlanFields(
    draft: AdminPlanDraft,
    onChange: (patch: Partial<AdminPlanDraft>) => void
  ) {
    return (
      <div className="admin-form-grid">
        <label>
          Plano base
          <select
            value={draft.basePlanId}
            onChange={(event) =>
              onChange({
                basePlanId: event.target.value as PlanType,
              })
            }
          >
            <option value="basic">Starter</option>
            <option value="pro">Pro</option>
            <option value="custom">Enterprise</option>
          </select>
        </label>

        <label>
          Slug comercial
          <input
            value={draft.slug}
            onChange={(event) => onChange({ slug: event.target.value })}
            placeholder="starter-plus"
          />
        </label>

        <label>
          Nome publico
          <input
            value={draft.publicName}
            onChange={(event) => onChange({ publicName: event.target.value })}
            placeholder="ImoLead Prime"
          />
        </label>

        <label>
          Indicado para
          <input
            value={draft.recommendedFor}
            onChange={(event) => onChange({ recommendedFor: event.target.value })}
            placeholder="Rede multi-loja com operacao iberica"
          />
        </label>

        <label>
          Preco mensal
          <input
            type="number"
            min="0"
            step="0.01"
            value={draft.monthlyPrice}
            onChange={(event) => onChange({ monthlyPrice: event.target.value })}
          />
        </label>

        <label>
          Preco anual
          <input
            type="number"
            min="0"
            step="0.01"
            value={draft.yearlyPrice}
            onChange={(event) => onChange({ yearlyPrice: event.target.value })}
          />
        </label>

        <label>
          Desconto anual %
          <input
            type="number"
            min="0"
            value={draft.annualDiscountPercent}
            onChange={(event) => onChange({ annualDiscountPercent: event.target.value })}
          />
        </label>

        <label>
          Capacidade leads/mes
          <input
            type="number"
            min="0"
            value={draft.leadLimit}
            onChange={(event) => onChange({ leadLimit: event.target.value })}
          />
        </label>

        <label>
          Utilizadores incluidos
          <input
            type="number"
            min="1"
            value={draft.includedUsers}
            onChange={(event) => onChange({ includedUsers: event.target.value })}
          />
        </label>

        <label>
          Utilizador extra /mes
          <input
            type="number"
            min="0"
            step="0.01"
            value={draft.extraUserMonthlyPrice}
            onChange={(event) => onChange({ extraUserMonthlyPrice: event.target.value })}
            disabled={!draft.allowsExtraUsers}
          />
        </label>

        <label>
          Utilizador extra /ano
          <input
            type="number"
            min="0"
            step="0.01"
            value={draft.extraUserYearlyPrice}
            onChange={(event) => onChange({ extraUserYearlyPrice: event.target.value })}
            disabled={!draft.allowsExtraUsers}
          />
        </label>

        <label>
          Max messages/mes
          <input
            type="number"
            min="0"
            value={draft.maxMessagesPerMonth}
            onChange={(event) => onChange({ maxMessagesPerMonth: event.target.value })}
          />
        </label>

        <label>
          Ordem
          <input
            type="number"
            min="0"
            value={draft.sortOrder}
            onChange={(event) => onChange({ sortOrder: event.target.value })}
          />
        </label>

        <label>
          Label de relatorios
          <input
            value={draft.reportsLabel}
            onChange={(event) => onChange({ reportsLabel: event.target.value })}
            placeholder="Relatorio executivo semanal"
          />
        </label>

        <label>
          Label do agente
          <input
            value={draft.agentLabel}
            onChange={(event) => onChange({ agentLabel: event.target.value })}
            placeholder="AI Orchestrator"
          />
        </label>

        <label className="admin-span">
          Label de suporte
          <input
            value={draft.supportLabel}
            onChange={(event) => onChange({ supportLabel: event.target.value })}
            placeholder="Suporte prioritario e onboarding"
          />
        </label>

        <label className="admin-span">
          Paises incluidos
          <textarea
            rows={3}
            value={draft.includedCountryCodes}
            onChange={(event) => onChange({ includedCountryCodes: event.target.value })}
            placeholder={"PT\nES\nFR"}
          />
        </label>

        <label className="admin-span">
          Mercados incluidos
          <textarea
            rows={3}
            value={draft.includedMarkets}
            onChange={(event) => onChange({ includedMarkets: event.target.value })}
            placeholder={"Portugal\nIberia\nEuropa"}
          />
        </label>

        <label className="admin-span">
          Relatorios de mercado
          <textarea
            rows={4}
            value={draft.marketReports}
            onChange={(event) => onChange({ marketReports: event.target.value })}
            placeholder={"Relatorio semanal por cidade\nRadar executivo europeu"}
          />
        </label>

        <label className="admin-span">
          Capacidades do agente
          <textarea
            rows={4}
            value={draft.agentCapabilities}
            onChange={(event) => onChange({ agentCapabilities: event.target.value })}
            placeholder={"Routing por loja\nAutomacao assistida\nGovernance"}
          />
        </label>

        <label className="admin-span">
          Features
          <textarea
            rows={5}
            value={draft.features}
            onChange={(event) => onChange({ features: event.target.value })}
            placeholder={
              "Capacidade ate 600 leads geridas/analisadas por mes\n7 utilizadores incluidos\nUtilizador extra: 17€/mes ou 163,20€/ano"
            }
          />
        </label>

        <div className="admin-boolean-grid admin-span">
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={draft.advancedAI}
              onChange={(event) => onChange({ advancedAI: event.target.checked })}
            />
            <span>AI avancada</span>
          </label>
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={draft.autoContact}
              onChange={(event) => onChange({ autoContact: event.target.checked })}
            />
            <span>Auto contact</span>
          </label>
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={draft.allowsExtraUsers}
              onChange={(event) => onChange({ allowsExtraUsers: event.target.checked })}
            />
            <span>Utilizadores extra</span>
          </label>
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={draft.multiLocation}
              onChange={(event) => onChange({ multiLocation: event.target.checked })}
            />
            <span>Multi-location</span>
          </label>
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={draft.multiLanguage}
              onChange={(event) => onChange({ multiLanguage: event.target.checked })}
            />
            <span>Multi-language</span>
          </label>
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) => onChange({ isActive: event.target.checked })}
            />
            <span>Ativo</span>
          </label>
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={draft.isPublic}
              onChange={(event) => onChange({ isPublic: event.target.checked })}
            />
            <span>Publico</span>
          </label>
        </div>
      </div>
    );
  }

  function renderAdminView() {
    return (
      <div className="page-stack">
        <section className="shell-panel admin-hero">
          <div>
            <p className="eyebrow">Painel ADM</p>
            <h3>Controlo total do catalogo comercial</h3>
            <p className="hero-text">
              O teu email fica como administrador principal e esta vista permite criar,
              editar, ativar, ocultar e remover planos sem mexer diretamente no codigo.
            </p>
          </div>

          <div className="signal-grid">
            <article className="signal-card">
              <span>Admin geral</span>
              <strong>carlospsantos19820@gmail.com</strong>
              <p>Conta principal com governance total do workspace.</p>
            </article>
            <article className="signal-card">
              <span>Catalogo ativo</span>
              <strong>{adminPlans.filter((plan) => plan.isActive && plan.isPublic).length}</strong>
              <p>Planos visiveis neste momento no pricing publico.</p>
            </article>
          </div>
        </section>

        <section className="admin-layout">
          <article className="shell-panel admin-create-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Novo plano</p>
                <h3>Criar oferta comercial</h3>
              </div>
            </div>

            <form className="admin-plan-form" onSubmit={handleAdminPlanCreate}>
              {renderAdminPlanFields(newPlanDraft, (patch) =>
                setNewPlanDraft((current) => ({
                  ...current,
                  ...patch,
                }))
              )}

              <button className="primary-button" type="submit" disabled={adminBusy}>
                {adminBusy ? "A criar..." : "Criar plano"}
              </button>
            </form>
          </article>

          <section className="admin-plan-stack">
            {adminPlans.map((plan) => {
              const draft = adminDrafts[plan.id] || buildAdminPlanDraft(plan);

              return (
                <article className="shell-panel admin-plan-card" key={plan.id}>
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">{plan.basePlanId.toUpperCase()}</p>
                      <h3>{plan.publicName}</h3>
                    </div>

                    <div className="mini-tags">
                      <span>{plan.slug}</span>
                      <span>{plan.isActive ? "Ativo" : "Inativo"}</span>
                      <span>{plan.isPublic ? "Publico" : "Privado"}</span>
                    </div>
                  </div>

                  <div className="admin-plan-form">
                    {renderAdminPlanFields(draft, (patch) =>
                      handleAdminDraftChange(plan.id, patch)
                    )}
                  </div>

                  <div className="admin-plan-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      disabled={savingAdminPlanId === plan.id}
                      onClick={() => void handleAdminPlanSave(plan.id)}
                    >
                      {savingAdminPlanId === plan.id ? "A guardar..." : "Guardar plano"}
                    </button>

                    <button
                      className="ghost-button"
                      type="button"
                      disabled={savingAdminPlanId === plan.id}
                      onClick={() => void handleAdminPlanDelete(plan.id)}
                    >
                      Remover plano
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </section>
      </div>
    );
  }

  function renderLoginView() {
    return renderPublicSite();

    /*
    return (
      <main className="auth-shell marketing-auth-shell">
        <div className="marketing-main">
          <section className="shell-panel marketing-hero">
            <div className="marketing-nav">
              <div className="marketing-brand">
                <div className="marketing-brand-mark">IL</div>
                <div>
                  <p>ImoLead AI Pro</p>
                  <span>Automacao inteligente para profissionais imobiliarios</span>
                </div>
              </div>

              <div className="marketing-nav-links">
                <a href="#landing-features">Funcionalidades</a>
                <a href="#landing-pricing">Precos</a>
                <a href="#landing-contact">Contacto</a>
              </div>

              <div className="marketing-nav-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => scrollToElement("landing-login")}
                >
                  Entrar
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() =>
                    openLandingPricing(
                      "basic",
                      "Criacao de conta orientada para conversao",
                      "Levamos-te diretamente ao plano de entrada com trial protegido e caminho natural para Pro e Enterprise."
                    )
                  }
                >
                  Criar conta
                </button>
              </div>
            </div>

            <div className="marketing-hero-grid">
              <div className="marketing-copy">
                <p className="eyebrow">Control tower para redes imobiliarias</p>
                <h1>Automatize a prospeccao imobiliaria com IA.</h1>
                <p className="hero-text">
                  O ImoLead AI Pro encontra, qualifica e organiza leads com mais velocidade,
                  mais contexto e menos trabalho manual para a equipa comercial.
                </p>

                <div className="marketing-cta-row">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() =>
                      openLandingLogin(
                        "pro",
                        "Demonstracao preparada para impacto imediato",
                        "Levamos-te diretamente para a experiencia que melhor mostra como a plataforma acelera follow-up, priorizacao e controlo comercial."
                      )
                    }
                  >
                    Comecar agora
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() =>
                      openLandingPricing(
                        "pro",
                        "Pricing com o plano mais vendavel em foco",
                        "O Pro fica em destaque porque e o ponto certo para a maioria das equipas imobiliarias em Portugal."
                      )
                    }
                  >
                    Ver demonstracao
                  </button>
                </div>

                <div className="marketing-chip-row">
                  <div className="status-chip">{marketingApiLabel}</div>
                  <div className="status-chip muted">{marketingAiLabel}</div>
                  <div className="status-chip muted">{marketingInfraLabel}</div>
                </div>

              </div>

              <div className="marketing-visual">
                <div className="marketing-mockup-shell marketing-mockup-desktop">
                  <img src={homeFullImg} alt="Vista desktop do ImoLead AI Pro" />
                </div>

                <div className="marketing-mockup-shell marketing-mockup-mobile">
                  <img src={mobileHomeHeroImg} alt="Vista mobile da home publica" />
                </div>

                <div className="marketing-float-card marketing-float-main">
                  <span>Desk dominante</span>
                  <strong>{dominantDeskLabel}</strong>
                  <p>{dashboardStats.urgent_actions} acoes urgentes sob monitorizacao.</p>
                </div>

                <div className="marketing-float-card marketing-float-side">
                  <span>Mercado em foco</span>
                  <strong>{topMarket?.market || "Portugal"}</strong>
                  <p>
                    {topMarket
                      ? `${topMarket.totalLeads} leads com score medio ${topMarket.averageAiScore}`
                      : "Operacao pronta para captar o primeiro lote de leads."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="marketing-metric-ribbon">
            {landingMetricBar.map((item) => (
              <article className="marketing-metric-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </section>

          <section className="marketing-section">
            <div className="section-head">
              <div>
                <p className="eyebrow">Produto em acao</p>
                <h3>As telas reais sustentam a promessa comercial</h3>
              </div>
            </div>

            <div className="marketing-showcase-grid">
              <article className="marketing-showcase-card featured">
                <div className="marketing-showcase-copy">
                  <span>Funcionalidades</span>
                  <strong>Blocos claros para explicar valor sem parecer software generico</strong>
                  <p>
                    Captacao, classificacao, mensagens, agenda e relatorios apresentados de forma
                    simples, vendavel e orientada ao mercado.
                  </p>
                </div>
                <img src={featuresSectionImg} alt="Secao real de funcionalidades do produto" />
              </article>

              <article className="marketing-showcase-card">
                <div className="marketing-showcase-copy">
                  <span>Administracao</span>
                  <strong>Painel protegido e pronto para controlo real do negocio</strong>
                  <p>Governance, acessos e operacao com cara de plataforma, nao de prototipo.</p>
                </div>
                <img src={adminSectionImg} alt="Entrada real do painel administrativo" />
              </article>

              <article className="marketing-showcase-card">
                <div className="marketing-showcase-copy">
                  <span>Mobile</span>
                  <strong>Experiencia preparada para demonstracao no telemovel</strong>
                  <p>
                    A leitura continua forte em mobile, com entrada clara e restricao controlada
                    quando necessario.
                  </p>
                </div>
                <img src={mobileDashboardImg} alt="Vista mobile real do produto" />
              </article>
            </div>
          </section>

          <section className="marketing-section" id="landing-features">
            <div className="section-head">
              <div>
                <p className="eyebrow">Tudo o que precisa para automatizar</p>
                <h3>Captacao, classificacao, mensagens e controlo num unico sistema</h3>
              </div>
            </div>

            <div className="marketing-feature-grid">
              {landingFeatureCards.map((feature) => (
                <article className="marketing-feature-card" key={feature.title}>
                  <span>{feature.eyebrow}</span>
                  <strong>{feature.title}</strong>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="marketing-section marketing-duo-grid">
            <article className="shell-panel marketing-story-card">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Workflow</p>
                  <h3>Da captacao ao follow-up numa experiencia unica</h3>
                </div>
              </div>

              <div className="marketing-step-list">
                {landingWorkflow.map((item) => (
                  <article className="marketing-step-card" key={item.step}>
                    <span>{item.step}</span>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>
            </article>

            <article className="shell-panel marketing-story-card">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Percepcao de valor</p>
                  <h3>Como deve soar para um diretor comercial</h3>
                </div>
              </div>

              <div className="marketing-testimonial-list">
                {landingTestimonials.map((item) => (
                  <blockquote className="marketing-testimonial-card" key={item.author}>
                    <p>{item.quote}</p>
                    <footer>
                      <strong>{item.author}</strong>
                      <span>{item.role}</span>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </article>
          </section>

          <section className="marketing-section marketing-results-shell">
            <article className="shell-panel marketing-results-visual">
              <div className="marketing-results-board">
                <div className="marketing-results-head">
                  <span>Vista executiva</span>
                  <strong>{topMarket?.market || "Portugal"} em destaque</strong>
                </div>

                <div className="marketing-results-grid">
                  <article>
                    <span>Desk</span>
                    <strong>{dominantDeskLabel}</strong>
                  </article>
                  <article>
                    <span>Fonte lider</span>
                    <strong>{dominantSource}</strong>
                  </article>
                  <article>
                    <span>Quentes</span>
                    <strong>{dashboardStats.quente}</strong>
                  </article>
                  <article>
                    <span>SLA urgente</span>
                    <strong>{dashboardStats.urgent_actions}</strong>
                  </article>
                </div>
              </div>
            </article>

            <article className="shell-panel marketing-results-copy">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Porque isto impacta</p>
                  <h3>Precisamos de parecer categoria nova, nao software repetido</h3>
                </div>
              </div>

              <ul className="marketing-benefit-list">
                {landingBenefitBullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div className="marketing-inline-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() =>
                    openLandingLogin(
                      activePlanId,
                      "Entrar agora e ver o ganho de tempo na pratica",
                      "Ja escolhemos um perfil demo compativel com este plano para reduzires atrito e entrares direto na experiencia certa."
                    )
                  }
                >
                  Pedir demonstracao
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() =>
                    openLandingPricing(
                      activePlanId,
                      "Rever a oferta antes de decidir",
                      "Mantemos o plano atual em foco para comparares sem perder o contexto do que ja viste."
                    )
                  }
                >
                  Rever oferta
                </button>
              </div>
            </article>
          </section>

          <section className="marketing-section" id="landing-pricing">
            <div className="section-head">
              <div>
                <p className="eyebrow">Planos</p>
                <h3>Oferta comercial clara, europeia e pronta para venda</h3>
              </div>

              <div className="billing-toggle">
                <button
                  className={billingMode === "month" ? "toggle-button active" : "toggle-button"}
                  type="button"
                  onClick={() => setBillingMode("month")}
                >
                  Mensal
                </button>
                <button
                  className={billingMode === "year" ? "toggle-button active" : "toggle-button"}
                  type="button"
                  onClick={() => setBillingMode("year")}
                >
                  Anual -20%
                </button>
              </div>
            </div>

            <div className="pricing-grid marketing-pricing-grid">
              {plans.map((plan) => {
                const isYear = billingMode === "year";
                const price = isYear ? plan.yearlyPrice : plan.monthlyPrice;
                const suffix = isYear ? "/ano" : "/mes";
                const featured = plan.basePlanId === "pro";

                return (
                  <article
                    className={featured ? "pricing-card featured" : "pricing-card"}
                    key={plan.id}
                  >
                    <div className="pricing-head">
                      <span>{plan.recommendedFor}</span>
                      <strong>
                        {formatCurrency(price, "EUR", price % 1 !== 0)}
                        <small>{suffix}</small>
                      </strong>
                    </div>

                    <p className="pricing-note">{plan.agentLabel}</p>
                    <p className="hero-text">{plan.reportsLabel}</p>
                    <div className="mini-tags">
                      {getTrialDaysForPlan(plan.basePlanId) > 0 ? (
                        <span>{getTrialDaysForPlan(plan.basePlanId)} dias trial</span>
                      ) : null}
                      <span>{formatLeadLimit(plan.leadLimit)}</span>
                      <span>{formatIncludedUsers(plan.includedUsers)}</span>
                      <span>{formatExtraUsers(plan, billingMode)}</span>
                    </div>
                    <p className="pricing-note">
                      Capacidade operacional mensal, nao volume garantido de leads captadas.
                    </p>
                    <p className="upgrade-note">
                      {getUpgradeHintForPlan(plan.basePlanId, plans)}
                    </p>

                    <ul className="feature-list">
                      {plan.features.slice(0, 4).map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>

                    <div className="pricing-action-row">
                      <button
                        className={
                          plan.basePlanId === activePlanId
                            ? "select-plan-button active"
                            : "select-plan-button"
                        }
                        type="button"
                        onClick={() => {
                          openLandingLogin(
                            plan.basePlanId,
                            `${plan.publicName} pronto para demonstracao`,
                            `Preparamos o perfil demo mais adequado para mostrar como o ${plan.publicName} facilita a operacao logo nos primeiros minutos.`
                          );
                        }}
                      >
                        {getTrialDaysForPlan(plan.basePlanId) > 0
                          ? plan.basePlanId === activePlanId
                            ? `Trial de ${getTrialDaysForPlan(plan.basePlanId)} dias pronto`
                            : `Comecar trial de ${getTrialDaysForPlan(plan.basePlanId)} dias`
                          : plan.basePlanId === activePlanId
                            ? "Demo pronta para este plano"
                            : "Quero ver este plano em acao"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="marketing-section marketing-duo-grid">
            <article className="shell-panel marketing-story-card">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Prova social</p>
                  <h3>O discurso que queremos que o mercado repita</h3>
                </div>
              </div>

              <div className="marketing-testimonial-list">
                {landingTestimonials.map((item) => (
                  <blockquote className="marketing-testimonial-card" key={item.author}>
                    <p>{item.quote}</p>
                    <footer>
                      <strong>{item.author}</strong>
                      <span>{item.role}</span>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </article>

            <article className="shell-panel marketing-story-card">
              <div className="section-head">
                <div>
                  <p className="eyebrow">FAQ</p>
                  <h3>Resposta curta para as duvidas que travam a venda</h3>
                </div>
              </div>

              <div className="marketing-faq-list">
                {landingFaqs.map((item) => (
                  <article className="marketing-faq-card" key={item.question}>
                    <strong>{item.question}</strong>
                    <p>{item.answer}</p>
                  </article>
                ))}
              </div>
            </article>
          </section>

          <section className="marketing-section" id="landing-legal">
            <div className="section-head">
              <div>
                <p className="eyebrow">Compliance</p>
                <h3>Privacidade, termos e IA explicados sem esconder o que tratamos</h3>
              </div>
            </div>

            <div className="marketing-legal-grid">
              {LEGAL_SECTIONS.map((section) => (
                <article className="marketing-legal-card" id={section.id} key={section.id}>
                  <span>{section.eyebrow}</span>
                  <strong>{section.title}</strong>
                  <p>{section.summary}</p>
                  <ul className="feature-list compact-list">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="shell-panel marketing-final-cta" id="landing-contact">
            <div>
              <p className="eyebrow">Fecho comercial</p>
              <h3>Vender isto deve parecer uma demonstracao, nao uma promessa vaga</h3>
              <p className="hero-text">
                O passo seguinte e simples: usar esta landing como frente comercial e manter
                o cockpit para utilizadores autenticados, com a mesma identidade de marca.
              </p>

              <div className="marketing-final-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() =>
                    openLandingLogin(
                      "custom",
                      "Demo enterprise preparada para impressionar decisores",
                      "Abrimos a conta ADM para mostrares governance, planos, equipas e a leitura executiva do produto."
                    )
                  }
                >
                  Abrir demo enterprise
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() =>
                    openLandingPricing(
                      "custom",
                      "Oferta enterprise em foco",
                      "A secao de planos abre com a camada enterprise destacada para conversa de valor e escala."
                    )
                  }
                >
                  Rever proposta enterprise
                </button>
              </div>
            </div>

            <div className="marketing-final-grid">
              <article className="marketing-final-card">
                <span>Email ADM</span>
                <strong>carlospsantos19820@gmail.com</strong>
                <p>Conta principal com controlo total do workspace e dos planos.</p>
              </article>
              <article className="marketing-final-card">
                <span>Mercados</span>
                <strong>{coverageLabel}</strong>
                <p>Base pronta para Portugal agora e Europa nas proximas fases.</p>
              </article>
              <article className="marketing-final-card">
                <span>Contacto RGPD</span>
                <strong>{privacyContactEmail}</strong>
                <p>Versao de politica ativa {policyVersion} com consentimento explicito no trial.</p>
              </article>
            </div>
          </section>
        </div>

        <aside className="auth-panel shell-panel marketing-auth-panel" id="landing-login">
          <div className="section-head">
            <div>
              <p className="eyebrow">Autenticacao</p>
              <h3>Entrar no workspace</h3>
            </div>
          </div>

          <div className="auth-panel-note">
            <span>{PUBLIC_DEMO_ENABLED ? "Entrada guiada" : "Acesso protegido"}</span>
            <p>
              {PUBLIC_DEMO_ENABLED
                ? "Usa um dos perfis demo para validar escopo, desks, agente por plano e controlo por perfil."
                : "A demo publica fica desativada em producao. O login abaixo serve para utilizadores reais e demonstracoes assistidas."}
            </p>
          </div>

          <div className="auth-guidance-card">
            <span>Proximo passo recomendado</span>
            <strong>{landingGuidance.title}</strong>
            <p>{landingGuidance.detail}</p>

            <div className="mini-tags">
              <span>{activePlan?.publicName || "ImoLead Pro"}</span>
              {activePlanTrialDays > 0 ? <span>{activePlanTrialDays} dias trial</span> : null}
              <span>{PUBLIC_DEMO_ENABLED ? suggestedDemoEntry.role : "Demo assistida"}</span>
              <span>{PUBLIC_DEMO_ENABLED ? suggestedDemoEntry.email : "Acesso validado pela equipa"}</span>
            </div>
          </div>

          <div className="auth-helper-actions">
            {PUBLIC_DEMO_ENABLED ? (
              <button
                className="secondary-button"
                type="button"
                onClick={() => selectDemoProfile(suggestedDemoEntry)}
              >
                Usar perfil sugerido
              </button>
            ) : (
              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  openLandingLogin(
                    activePlanId,
                    "Demo assistida recomendada",
                    "A equipa prepara a demonstracao com o plano certo, sem expor credenciais demo na frente publica."
                  )
                }
              >
                Pedir demo assistida
              </button>
            )}
            <button
              className="ghost-button"
              type="button"
              onClick={() =>
                openLandingPricing(
                  activePlanId,
                  "Revisao rapida do plano selecionado",
                  "Voltamos a oferta mantendo o plano atual ativo para comparacao imediata."
                )
              }
            >
              Rever planos
            </button>
          </div>

          <div className="auth-scenario-grid">
            {guidedUseCases.map((useCase) => (
              <article className="auth-scenario-card" key={useCase.id}>
                <span>{useCase.eyebrow}</span>
                <strong>{useCase.title}</strong>
                <p>{useCase.detail}</p>
                <button className="ghost-button" type="button" onClick={useCase.primaryAction}>
                  {useCase.primaryLabel}
                </button>
              </article>
            ))}
          </div>

          {activePlanTrialDays > 0 ? (
            <section className="trial-card">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Trial protegido</p>
                  <h3>Ativar 15 dias no Starter</h3>
                </div>
              </div>

              <p className="trial-copy">
                O trial fica limitado a um unico email e um unico telefone, para evitar
                reutilizacao do periodo inicial. Antes de reservar, confirmas privacidade,
                termos e uso de IA.
              </p>

              <form className="lead-form trial-form" onSubmit={handleTrialRequest}>
                <label>
                  Nome
                  <input
                    value={trialForm.name}
                    onChange={(event) =>
                      setTrialForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Nome do responsavel"
                    required
                  />
                </label>

                <label>
                  Email profissional
                  <input
                    type="email"
                    value={trialForm.email}
                    onChange={(event) =>
                      setTrialForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="equipa@agencia.pt"
                    required
                  />
                </label>

                <label>
                  Telefone
                  <input
                    value={trialForm.phone}
                    onChange={(event) =>
                      setTrialForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    placeholder="+351 912 345 678"
                    required
                  />
                </label>

                <label className="consent-check">
                  <input
                    type="checkbox"
                    checked={trialForm.privacyAccepted}
                    onChange={(event) =>
                      setTrialForm((current) => ({
                        ...current,
                        privacyAccepted: event.target.checked,
                      }))
                    }
                    required
                  />
                  <span>
                    Aceito a <a href="#legal-privacy">Politica de Privacidade</a> e o tratamento
                    dos meus dados para contacto comercial e operacao do trial.
                  </span>
                </label>

                <label className="consent-check">
                  <input
                    type="checkbox"
                    checked={trialForm.termsAccepted}
                    onChange={(event) =>
                      setTrialForm((current) => ({
                        ...current,
                        termsAccepted: event.target.checked,
                      }))
                    }
                    required
                  />
                  <span>
                    Aceito os <a href="#legal-terms">Termos de Utilizacao</a> e compreendo que os
                    planos representam capacidade operacional, nao volume garantido de leads.
                  </span>
                </label>

                <label className="consent-check">
                  <input
                    type="checkbox"
                    checked={trialForm.aiDisclosureAccepted}
                    onChange={(event) =>
                      setTrialForm((current) => ({
                        ...current,
                        aiDisclosureAccepted: event.target.checked,
                      }))
                    }
                    required
                  />
                  <span>
                    Compreendo a nota de <a href="#legal-ai">uso de IA</a> e que algumas funcoes
                    podem envolver processamento por fornecedores externos quando o plano o permitir.
                  </span>
                </label>

                <p className="trial-legal-note">
                  Versao de politica {policyVersion}. Contacto de privacidade: {privacyContactEmail}.
                </p>

                {trialFeedback ? (
                  <p className={trialFeedbackTone === "success" ? "feedback success" : "feedback error"}>
                    {trialFeedback}
                  </p>
                ) : null}

                <button className="primary-button" type="submit" disabled={trialSubmitting}>
                  {trialSubmitting ? "A validar trial..." : "Reservar trial de 15 dias"}
                </button>
              </form>
            </section>
          ) : null}

          <form className="lead-form auth-form" onSubmit={handleLogin}>
            <label>
              Email
              <input
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder={PUBLIC_DEMO_ENABLED ? DEMO_ACCESS[0].email : "equipa@agencia.pt"}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder={PUBLIC_DEMO_ENABLED ? "Demo123!" : "Acesso seguro"}
                required
              />
            </label>

            {error ? <p className="feedback error">{error}</p> : null}
            {authBooting ? <p className="feedback">A validar sessao existente...</p> : null}

            <button
              className="primary-button"
              type="submit"
              disabled={authSubmitting || authBooting}
            >
              {authSubmitting ? "A entrar..." : "Entrar no workspace"}
            </button>
          </form>

          {PUBLIC_DEMO_ENABLED ? (
            <div className="auth-demo-grid">
              {DEMO_ACCESS.map((entry) => (
                <button
                  className="auth-demo-card"
                  key={entry.email}
                  type="button"
                  onClick={() => selectDemoProfile(entry)}
                >
                  <span>{entry.role}</span>
                  <strong>{entry.email}</strong>
                  <p>{entry.description}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="auth-guard-card">
              <span>Demo publica desativada</span>
              <strong>As credenciais demo nao ficam expostas na frente publica.</strong>
              <p>
                Mantemos a experiencia comercial ativa, mas a demonstracao entra por validacao
                humana ou por contas reais do workspace.
              </p>
            </div>
          )}

          <div className="plan-preview-list">
            {plans.map((plan) => (
              <article
                className={plan.basePlanId === activePlanId ? "plan-preview active" : "plan-preview"}
                key={plan.id}
              >
                <span>{plan.publicName}</span>
                <strong>{plan.agentLabel}</strong>
                <p>{plan.recommendedFor}</p>
                <p className="pricing-note">
                  {formatIncludedUsers(plan.includedUsers)} · {formatExtraUsers(plan, billingMode)}
                </p>
                <p className="upgrade-note">{getUpgradeHintForPlan(plan.basePlanId, plans)}</p>
              </article>
            ))}
          </div>

          <div className="auth-legal-stack">
            <article className="auth-legal-card">
              <span>Politica ativa</span>
              <strong>Versao {policyVersion}</strong>
              <p>{compliance?.dataUseSummary || LEGAL_SECTIONS[0].summary}</p>
            </article>
            <article className="auth-legal-card">
              <span>Contacto RGPD</span>
              <strong>{privacyContactEmail}</strong>
              <p>
                Direitos de acesso, retificacao, apagamento e oposicao tratados por este contacto.
              </p>
            </article>
          </div>
        </aside>
      </main>
    );
    */
  }

  function renderPublicNav() {
    return (
      <div className="marketing-nav">
        <div className="marketing-brand">
          <div className="marketing-brand-mark">IL</div>
          <div>
            <p>ImoLead AI Pro</p>
            <span>Automacao inteligente para profissionais imobiliarios</span>
          </div>
        </div>

        <div className="marketing-nav-links">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <a
              className={publicPage === item.id ? "active" : undefined}
              href={PUBLIC_PAGE_PATHS[item.id]}
              key={item.id}
              onClick={(event) => handlePublicNavigation(event, item.id)}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="marketing-nav-actions">
          <button className="ghost-button" type="button" onClick={() => navigatePublicPage("login")}>
            Entrar
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() =>
              openLandingPricing(
                "basic",
                "Criacao de conta orientada para conversao",
                "Levamos-te diretamente ao plano de entrada com trial protegido e caminho natural para Pro e Enterprise."
              )
            }
          >
            Criar conta
          </button>
        </div>
      </div>
    );
  }

  function renderPublicStage(page: PublicPageId) {
    const featuredPlan =
      activePlan || plans.find((plan) => plan.basePlanId === "pro") || plans[0] || null;
    const compactPlans = plans.slice(0, 3);

    if (page === "features") {
      return (
        <div className="public-stage public-stage-features">
          <div className="public-stage-head">
            <span>Motor do produto</span>
            <strong>Seis blocos que explicam valor sem parecer software generico</strong>
          </div>

          <div className="public-stage-cluster">
            {landingFeatureCards.slice(0, 4).map((feature) => (
              <article className="public-stage-card" key={feature.title}>
                <span>{feature.eyebrow}</span>
                <strong>{feature.title}</strong>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>

          <article className="public-stage-card public-stage-card-accent">
            <span>Sequencia operacional</span>
            <strong>
              {landingWorkflow[0]?.title}, {landingWorkflow[1]?.title.toLowerCase()} e{" "}
              {landingWorkflow[2]?.title.toLowerCase()} no mesmo sistema.
            </strong>
            <p>
              O produto liga captacao, triagem e resposta comercial sem depender de folhas soltas,
              grupos dispersos ou CRMs sem contexto.
            </p>
          </article>
        </div>
      );
    }

    if (page === "pricing") {
      return (
        <div className="public-stage public-stage-pricing">
          <div className="public-stage-head">
            <span>Escada comercial</span>
            <strong>Planos com progressao clara, trial protegido e margem para crescer</strong>
          </div>

          <div className="public-plan-ladder">
            {compactPlans.map((plan) => {
              const highlighted = plan.basePlanId === "pro";

              return (
                <article
                  className={highlighted ? "public-plan-chip highlighted" : "public-plan-chip"}
                  key={plan.id}
                >
                  <span>{plan.publicName}</span>
                  <strong>{formatCurrency(plan.monthlyPrice, "EUR", plan.monthlyPrice % 1 !== 0)}</strong>
                  <p>
                    {formatIncludedUsers(plan.includedUsers)} · {formatLeadLimit(plan.leadLimit)}
                  </p>
                </article>
              );
            })}
          </div>

          <article className="public-stage-card public-stage-card-accent">
            <span>Plano em foco</span>
            <strong>{featuredPlan?.publicName || "ImoLead Pro"}</strong>
            <p>
              {featuredPlan?.reportsLabel || "Relatorios executivos prontos para decisores."}{" "}
              {featuredPlan?.allowsExtraUsers
                ? formatExtraUsers(featuredPlan, "month")
                : "Sem utilizadores extra no plano de entrada."}
            </p>
            <div className="public-stage-pill-row">
              <span>Anual -20%</span>
              {featuredPlan ? <span>{featuredPlan.agentLabel}</span> : null}
              {featuredPlan ? <span>{featuredPlan.supportLabel}</span> : null}
            </div>
          </article>
        </div>
      );
    }

    if (page === "contact") {
      return (
        <div className="public-stage public-stage-contact">
          <div className="public-stage-head">
            <span>Fecho e governance</span>
            <strong>Contacto real, linguagem clara e compliance visivel antes da reuniao</strong>
          </div>

          <div className="public-stage-cluster">
            <article className="public-stage-card public-stage-card-accent">
              <span>Email ADM</span>
              <strong>carlospsantos19820@gmail.com</strong>
              <p>Conta principal para controlo total do workspace, planos e operacao comercial.</p>
            </article>

            <article className="public-stage-card">
              <span>Contacto RGPD</span>
              <strong>{privacyContactEmail}</strong>
              <p>Canal ativo para privacidade, pedidos de eliminacao, direitos do titular e auditoria.</p>
            </article>

            <article className="public-stage-card">
              <span>Mercados</span>
              <strong>{coverageLabel}</strong>
              <p>Portugal como entrada, Iberia como proximo passo e base pronta para Europa.</p>
            </article>

            <article className="public-stage-card">
              <span>Politica ativa</span>
              <strong>{policyVersion}</strong>
              <p>Trial com consentimento, uso de IA explicado e documentos legais ligados ao fluxo.</p>
            </article>
          </div>
        </div>
      );
    }

    if (page === "login") {
      return (
        <div className="public-stage public-stage-login">
          <div className="public-stage-head">
            <span>Acesso protegido</span>
            <strong>Entrar com contexto, trial controlado e demonstracao assistida</strong>
          </div>

          <article className="public-stage-card public-stage-card-accent public-stage-card-large">
            <span>Workspace preparado</span>
            <strong>{featuredPlan?.publicName || "ImoLead Pro"} pronto para entrada comercial</strong>
            <p>
              O acesso abre no plano certo, com o agente certo e sem expor uma demo publica solta
              na frente comercial.
            </p>
            <div className="public-stage-pill-row">
              <span>{PUBLIC_DEMO_ENABLED ? "Demo publica ativa" : "Demo assistida"}</span>
              {activePlanTrialDays > 0 ? <span>{activePlanTrialDays} dias trial</span> : null}
              <span>{featuredPlan?.agentLabel || marketingAiLabel}</span>
            </div>
          </article>

          <div className="public-stage-cluster public-stage-cluster-compact">
            <article className="public-stage-card">
              <span>Validacao</span>
              <strong>Email e telefone unicos no trial</strong>
              <p>Reduz reutilizacao e protege o plano de entrada antes da conversao para Pro.</p>
            </article>
            <article className="public-stage-card">
              <span>Governance</span>
              <strong>Perfis, lojas e desks ja condicionam o acesso</strong>
              <p>Admin, manager e consultant entram com contexto operacional e escopo real.</p>
            </article>
            <article className="public-stage-card">
              <span>Proxima acao</span>
              <strong>{landingGuidance.title}</strong>
              <p>{landingGuidance.detail}</p>
            </article>
          </div>
        </div>
      );
    }

    return (
      <div className="public-stage public-stage-home">
        <div className="public-stage-head">
          <span>Entrada comercial viva</span>
          <strong>Menos ruído visual. Mais sinal de negocio logo na primeira dobra.</strong>
        </div>

        <article className="public-stage-card public-stage-card-accent public-stage-card-large">
          <span>Mercado em foco</span>
          <strong>{topMarket?.market || "Portugal"} lidera a operacao atual</strong>
          <p>
            {topMarket
              ? `${topMarket.totalLeads} leads ativas, score medio ${topMarket.averageAiScore} e ${dashboardStats.urgent_actions} acoes urgentes visiveis.`
              : "Workspace pronto para captar, classificar e distribuir o primeiro lote de leads com criterio comercial."}
          </p>
          <div className="public-stage-pill-row">
            <span>{coverageLabel}</span>
            <span>{featuredPlan?.publicName || "ImoLead Pro"}</span>
            <span>{featuredPlan?.agentLabel || marketingAiLabel}</span>
          </div>
        </article>

        <div className="public-stage-cluster">
          {commandSignals.map((signal) => (
            <article className="public-stage-card" key={signal.label}>
              <span>{signal.label}</span>
              <strong>{signal.value}</strong>
              <p>{signal.detail}</p>
            </article>
          ))}
        </div>

        <div className="public-stage-cluster public-stage-cluster-compact">
          {landingWorkflow.map((item) => (
            <article className="public-stage-card" key={item.step}>
              <span>{item.step}</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  function renderPageHero(options: {
    eyebrow: string;
    title: string;
    text: string;
    stage: PublicPageId;
    primaryLabel: string;
    secondaryLabel: string;
    onPrimaryClick: () => void;
    onSecondaryClick: () => void;
  }) {
    return (
      <section className="shell-panel marketing-hero public-route-hero">
        {renderPublicNav()}

        <div className="public-route-hero-grid">
          <div className="public-route-copy">
            <p className="eyebrow">{options.eyebrow}</p>
            <h1>{options.title}</h1>
            <p className="hero-text">{options.text}</p>

            <div className="marketing-cta-row">
              <button className="primary-button" type="button" onClick={options.onPrimaryClick}>
                {options.primaryLabel}
              </button>
              <button className="ghost-button" type="button" onClick={options.onSecondaryClick}>
                {options.secondaryLabel}
              </button>
            </div>

            <div className="public-hero-chips">
              <div className="status-chip">Mercado {topMarket?.market || "Portugal"}</div>
              <div className="status-chip muted">{activePlan?.publicName || "ImoLead Pro"}</div>
              <div className="status-chip muted">
                {PUBLIC_DEMO_ENABLED ? "Demo publica ativa" : "Acesso protegido"}
              </div>
            </div>
          </div>

          {renderPublicStage(options.stage)}
        </div>
      </section>
    );
  }

  function renderPricingCardsSection(options?: { enableCheckout?: boolean }) {
    const enableCheckout = Boolean(options?.enableCheckout);

    return (
      <section className="marketing-section" id="landing-pricing">
        <div className="section-head">
          <div>
            <p className="eyebrow">Planos</p>
            <h3>Oferta comercial clara, europeia e pronta para venda</h3>
          </div>

          <div className="billing-toggle">
            <button
              className={billingMode === "month" ? "toggle-button active" : "toggle-button"}
              type="button"
              onClick={() => setBillingMode("month")}
            >
              Mensal
            </button>
            <button
              className={billingMode === "year" ? "toggle-button active" : "toggle-button"}
              type="button"
              onClick={() => setBillingMode("year")}
            >
              Anual -20%
            </button>
          </div>
        </div>

        {enableCheckout ? (
          <article className="shell-panel payment-activation-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Ativacao imediata</p>
                <h3>Prepara o checkout Stripe com os dados certos antes de escolher o plano</h3>
              </div>
            </div>

            <div className="payment-activation-grid">
              <label>
                Nome
                <input
                  type="text"
                  value={checkoutForm.name}
                  onChange={(event) =>
                    setCheckoutForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Nome da pessoa ou da equipa"
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={checkoutForm.email}
                  onChange={(event) =>
                    setCheckoutForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="billing@agencia.pt"
                />
              </label>

              <div className="payment-methods-note">
                <span>Meios de pagamento ativos</span>
                <strong>Cartao online via Stripe Checkout</strong>
                <p>
                  MB WAY e Multibanco ficam na camada assistida enquanto fechamos um fluxo real e
                  compativel com subscricoes. Para venda imediata, o checkout robusto hoje e por
                  cartao.
                </p>

                <div className="mini-tags">
                  <span>Stripe Checkout</span>
                  <span>Subscricao segura</span>
                  <span>{billingMode === "year" ? "Modo anual ativo" : "Modo mensal ativo"}</span>
                </div>
              </div>
            </div>

            {checkoutFeedback ? (
              <div className={checkoutFeedbackTone === "success" ? "form-helper success" : "form-helper"}>
                <strong>{checkoutFeedbackTone === "success" ? "Pagamento" : "Checkout"}</strong>
                <span>{checkoutFeedback}</span>
              </div>
            ) : null}
          </article>
        ) : null}

        <div className="pricing-grid marketing-pricing-grid">
          {plans.map((plan) => {
            const isYear = billingMode === "year";
            const price = isYear ? plan.yearlyPrice : plan.monthlyPrice;
            const suffix = isYear ? "/ano" : "/mes";
            const featured = plan.basePlanId === "pro";
            const secondaryAction =
              plan.basePlanId === "custom"
                ? () => navigatePublicPage("contact")
                : plan.basePlanId === "basic"
                  ? () =>
                      openLandingPricing(
                        "pro",
                        "Caminho natural do Starter para o Pro",
                        "Comparamos a entrada protegida com a camada vendavel para equipas e mostramos onde o upgrade faz sentido."
                      )
                  : () =>
                      openLandingLogin(
                        "custom",
                        "Enterprise em foco para a fase seguinte",
                        "Abrimos a leitura enterprise para mostrar governance, multi-loja e controlo executivo.",
                        DEMO_ACCESS[0]
                      );
            const secondaryLabel =
              plan.basePlanId === "custom"
                ? "Falar com a equipa"
                : plan.basePlanId === "basic"
                  ? "Ver salto para Pro"
                  : "Abrir leitura Enterprise";
            const journeyLabel =
              plan.basePlanId === "basic"
                ? "Entrada sugerida: trial protegido com validacao e caminho claro de upgrade."
                : plan.basePlanId === "pro"
                  ? "Entrada sugerida: demonstracao de equipa com pipeline, owners e desks em acao."
                  : "Entrada sugerida: leitura executiva com governance, ADM e expansao multi-loja.";

            return (
              <article className={featured ? "pricing-card featured" : "pricing-card"} key={plan.id}>
                <div className="pricing-head">
                  <span>{plan.recommendedFor}</span>
                  <strong>
                    {formatCurrency(price, "EUR", price % 1 !== 0)}
                    <small>{suffix}</small>
                  </strong>
                </div>

                <p className="pricing-note">{plan.agentLabel}</p>
                <p className="hero-text">{plan.reportsLabel}</p>
                <p className="pricing-note">
                  {formatCurrency(plan.monthlyPrice, "EUR", plan.monthlyPrice % 1 !== 0)}/mes ou{" "}
                  {formatCurrency(plan.yearlyPrice, "EUR", plan.yearlyPrice % 1 !== 0)}/ano com{" "}
                  {plan.annualDiscountPercent}% de desconto anual fixo.
                </p>
                <div className="mini-tags">
                  {getTrialDaysForPlan(plan.basePlanId) > 0 ? (
                    <span>{getTrialDaysForPlan(plan.basePlanId)} dias trial</span>
                  ) : null}
                  <span>{formatLeadLimit(plan.leadLimit)}</span>
                  <span>{formatIncludedUsers(plan.includedUsers)}</span>
                  <span>{formatExtraUsers(plan, billingMode)}</span>
                </div>
                <p className="pricing-note">
                  Capacidade operacional mensal, nao volume garantido de leads captadas.
                </p>
                <p className="upgrade-note">{getUpgradeHintForPlan(plan.basePlanId, plans)}</p>

                <ul className="feature-list">
                  {plan.features.slice(0, 4).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <div className="pricing-action-row">
                  <button
                    className={
                      plan.basePlanId === activePlanId
                        ? "select-plan-button active"
                        : "select-plan-button"
                    }
                    type="button"
                    disabled={enableCheckout && checkoutSubmittingPlanId === plan.basePlanId}
                    onClick={() =>
                      enableCheckout
                        ? void handleStartCheckout(plan)
                        : openLandingLogin(
                            plan.basePlanId,
                            `${plan.publicName} pronto para demonstracao`,
                            `Preparamos o perfil demo mais adequado para mostrar como o ${plan.publicName} facilita a operacao logo nos primeiros minutos.`
                          )
                    }
                  >
                    {enableCheckout
                      ? checkoutSubmittingPlanId === plan.basePlanId
                        ? "A abrir checkout..."
                        : getTrialDaysForPlan(plan.basePlanId) > 0
                          ? `Ativar com ${getTrialDaysForPlan(plan.basePlanId)} dias de trial`
                          : "Abrir checkout deste plano"
                      : getTrialDaysForPlan(plan.basePlanId) > 0
                        ? plan.basePlanId === activePlanId
                          ? `Trial de ${getTrialDaysForPlan(plan.basePlanId)} dias pronto`
                          : `Comecar trial de ${getTrialDaysForPlan(plan.basePlanId)} dias`
                        : plan.basePlanId === activePlanId
                          ? "Demo pronta para este plano"
                          : "Quero ver este plano em acao"}
                  </button>
                  <button className="ghost-button pricing-secondary-button" type="button" onClick={secondaryAction}>
                    {secondaryLabel}
                  </button>
                </div>

                <p className="pricing-note pricing-guidance-note">{journeyLabel}</p>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  function renderSocialProofSection() {
    return (
      <section className="marketing-section marketing-duo-grid">
        <article className="shell-panel marketing-story-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Prova social</p>
              <h3>O discurso que queremos que o mercado repita</h3>
            </div>
          </div>

          <div className="marketing-testimonial-list">
            {landingTestimonials.map((item) => (
              <blockquote className="marketing-testimonial-card" key={item.author}>
                <p>{item.quote}</p>
                <footer>
                  <strong>{item.author}</strong>
                  <span>{item.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </article>

        <article className="shell-panel marketing-story-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">FAQ</p>
              <h3>Resposta curta para as duvidas que travam a venda</h3>
            </div>
          </div>

          <div className="marketing-faq-list">
            {landingFaqs.map((item) => (
              <article className="marketing-faq-card" key={item.question}>
                <strong>{item.question}</strong>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    );
  }

  function renderLegalSection() {
    return (
      <section className="marketing-section" id="landing-legal">
        <div className="section-head">
          <div>
            <p className="eyebrow">Compliance</p>
            <h3>Privacidade, termos e IA explicados sem esconder o que tratamos</h3>
          </div>
        </div>

        <div className="marketing-legal-grid">
          {LEGAL_SECTIONS.map((section) => (
            <article className="marketing-legal-card" id={section.id} key={section.id}>
              <span>{section.eyebrow}</span>
              <strong>{section.title}</strong>
              <p>{section.summary}</p>
              <ul className="feature-list compact-list">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderFinalCtaSection() {
    return (
      <section className="shell-panel marketing-final-cta" id="landing-contact">
        <div>
          <p className="eyebrow">Fecho comercial</p>
          <h3>Vender isto deve parecer uma demonstracao, nao uma promessa vaga</h3>
          <p className="hero-text">
            O passo seguinte e simples: usar esta frente publica como venda e manter o cockpit para
            utilizadores autenticados, com a mesma identidade de marca.
          </p>

          <div className="marketing-final-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                openLandingLogin(
                  "custom",
                  "Demo enterprise preparada para impressionar decisores",
                  "Abrimos a conta ADM para mostrares governance, planos, equipas e a leitura executiva do produto."
                )
              }
            >
              Abrir demo enterprise
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={() =>
                openLandingPricing(
                  "custom",
                  "Oferta enterprise em foco",
                  "A secao de planos abre com a camada enterprise destacada para conversa de valor e escala."
                )
              }
            >
              Rever proposta enterprise
            </button>
          </div>
        </div>

        <div className="marketing-final-grid">
          <article className="marketing-final-card">
            <span>Email ADM</span>
            <strong>carlospsantos19820@gmail.com</strong>
            <p>Conta principal com controlo total do workspace e dos planos.</p>
          </article>
          <article className="marketing-final-card">
            <span>Mercados</span>
            <strong>{coverageLabel}</strong>
            <p>Base pronta para Portugal agora e Europa nas proximas fases.</p>
          </article>
          <article className="marketing-final-card">
            <span>Contacto RGPD</span>
            <strong>{privacyContactEmail}</strong>
            <p>Versao de politica ativa {policyVersion} com consentimento explicito no trial.</p>
          </article>
        </div>
      </section>
    );
  }

  function renderLoginEntryHero() {
    const featuredPlan = activePlan || plans.find((plan) => plan.basePlanId === "pro") || plans[0] || null;

    return (
      <section className="shell-panel public-login-intro">
        {renderPublicNav()}

        <div className="public-login-intro-grid">
          <div className="public-login-copy">
            <p className="eyebrow">Acesso protegido</p>
            <h1>Entra no workspace certo sem perder a forca comercial.</h1>
            <p className="public-login-lead">
              Esta entrada serve contas reais, trial protegido e demos assistidas. O objetivo aqui
              e simples: mostrar um acesso serio, curto e coerente com o plano que estas a vender.
            </p>
            <p className="hero-text">
              A demonstração publica fica fechada. Esta entrada serve contas reais, trials
              protegidos e sessoes assistidas para mostrar valor sem expor a operacao.
            </p>

            <div className="marketing-cta-row">
              <button
                className="primary-button"
                type="button"
                onClick={() =>
                  openLandingPricing(
                    activePlanId,
                    "Comparacao orientada pelo plano selecionado",
                    "Levamos-te para a oferta ja com o plano ativo, desconto anual e caminho natural de upgrade visiveis."
                  )
                }
              >
                Ver planos
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() =>
                  openLandingLogin(
                    activePlanId,
                    "Demonstracao assistida preparada para a tua realidade",
                    "Mantemos o plano ativo, ajustamos a guidance e abrimos o acesso de forma coerente com o teu contexto comercial."
                  )
                }
              >
                Pedir demonstracao
              </button>
            </div>

            <div className="public-hero-chips">
              <div className="status-chip">{activePlan?.publicName || "ImoLead Pro"}</div>
              <div className="status-chip muted">
                {PUBLIC_DEMO_ENABLED ? "Demo publica ativa" : "Demo assistida"}
              </div>
              <div className="status-chip muted">{featuredPlan?.agentLabel || marketingAiLabel}</div>
            </div>
          </div>

          <div className="public-login-stage-panel">
            <article className="public-login-stage-card public-login-stage-card-wide">
              <span>Workspace preparado</span>
              <strong>{activePlan?.publicName || "ImoLead Pro"} pronto para mostrar valor real</strong>
              <p>
                O login nao aparece solto. Ele entra no fluxo comercial com escopo, discurso e
                governanca para a demonstracao parecer produto serio e nao uma area tecnica perdida.
              </p>
            </article>

            <div className="public-login-stage-grid">
              <article className="public-login-stage-card">
                <span>Validacao do trial</span>
                <strong>Email e telefone unicos protegem a oferta inicial</strong>
                <p>Reduz abuso, filtra curiosos e empurra a conversa certa para o plano Pro.</p>
              </article>

              <article className="public-login-stage-card">
                <span>Governanca comercial</span>
                <strong>Perfis, lojas e desks entram com responsabilidade real</strong>
                <p>Admin, manager e consultant acedem ao que lhes pertence sem desorganizar a demo.</p>
              </article>

              <article className="public-login-stage-card">
                <span>Cobertura operacional</span>
                <strong>{coverageLabel}</strong>
                <p>{landingGuidance.detail}</p>
              </article>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderAuthPanel() {
    return (
      <aside className="auth-panel shell-panel marketing-auth-panel" id="landing-login">
        <div className="section-head">
          <div>
            <p className="eyebrow">Autenticacao</p>
            <h3>Entrar no workspace</h3>
          </div>
        </div>

        <div className="auth-panel-note">
          <span>{PUBLIC_DEMO_ENABLED ? "Entrada guiada" : "Acesso protegido"}</span>
          <p>
            {PUBLIC_DEMO_ENABLED
              ? "Usa um dos perfis demo para validar escopo, desks, agente por plano e controlo por perfil."
              : "A demo publica fica desativada em producao. O login abaixo serve para utilizadores reais e demonstracoes assistidas."}
          </p>
        </div>

        <div className="auth-guidance-card">
          <span>Contexto ativo</span>
          <strong>{activePlan?.publicName || "ImoLead Pro"} selecionado para este acesso</strong>
          <p>
            Se precisares de demonstracao, usamos o plano e o perfil certos. Se ja tens conta,
            entra abaixo e continua no teu workspace.
          </p>

          <div className="mini-tags">
            <span>{activePlan?.publicName || "ImoLead Pro"}</span>
            {activePlanTrialDays > 0 ? <span>{activePlanTrialDays} dias trial</span> : null}
            <span>{coverageLabel}</span>
          </div>
        </div>

        <div className="auth-helper-actions">
          {PUBLIC_DEMO_ENABLED ? (
            <button
              className="secondary-button"
              type="button"
              onClick={() => selectDemoProfile(suggestedDemoEntry)}
            >
              Usar perfil sugerido
            </button>
          ) : (
            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                openLandingLogin(
                  activePlanId,
                  "Demo assistida recomendada",
                  "A equipa prepara a demonstracao com o plano certo, sem expor credenciais demo na frente publica."
                )
              }
            >
              Pedir demo assistida
            </button>
          )}
          <button
            className="ghost-button"
            type="button"
            onClick={() =>
              openLandingPricing(
                activePlanId,
                "Revisao rapida do plano selecionado",
                "Voltamos a oferta mantendo o plano atual ativo para comparacao imediata."
              )
            }
          >
            Rever planos
          </button>
        </div>

        {activePlanTrialDays > 0 ? (
          <section className="trial-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Trial protegido</p>
                <h3>Ativar 15 dias no Starter</h3>
              </div>
            </div>

            <p className="trial-copy">
              O trial fica limitado a um unico email e um unico telefone, para evitar reutilizacao
              do periodo inicial. Antes de reservar, confirmas privacidade, termos e uso de IA.
            </p>

            <form className="lead-form trial-form" onSubmit={handleTrialRequest}>
              <label>
                Nome
                <input
                  value={trialForm.name}
                  onChange={(event) =>
                    setTrialForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Nome do responsavel"
                  required
                />
              </label>

              <label>
                Email profissional
                <input
                  type="email"
                  value={trialForm.email}
                  onChange={(event) =>
                    setTrialForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="equipa@agencia.pt"
                  required
                />
              </label>

              <label>
                Telefone
                <input
                  value={trialForm.phone}
                  onChange={(event) =>
                    setTrialForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  placeholder="+351 912 345 678"
                  required
                />
              </label>

              <label className="consent-check">
                <input
                  type="checkbox"
                  checked={trialForm.privacyAccepted}
                  onChange={(event) =>
                    setTrialForm((current) => ({
                      ...current,
                      privacyAccepted: event.target.checked,
                    }))
                  }
                  required
                />
                <span>
                  Aceito a{" "}
                  <a
                    href={`${PUBLIC_PAGE_PATHS.contact}#legal-privacy`}
                    onClick={(event) => {
                      event.preventDefault();
                      navigatePublicPage("contact", "legal-privacy");
                    }}
                  >
                    Politica de Privacidade
                  </a>{" "}
                  e o tratamento dos meus dados para contacto comercial e operacao do trial.
                </span>
              </label>

              <label className="consent-check">
                <input
                  type="checkbox"
                  checked={trialForm.termsAccepted}
                  onChange={(event) =>
                    setTrialForm((current) => ({
                      ...current,
                      termsAccepted: event.target.checked,
                    }))
                  }
                  required
                />
                <span>
                  Aceito os{" "}
                  <a
                    href={`${PUBLIC_PAGE_PATHS.contact}#legal-terms`}
                    onClick={(event) => {
                      event.preventDefault();
                      navigatePublicPage("contact", "legal-terms");
                    }}
                  >
                    Termos de Utilizacao
                  </a>{" "}
                  e compreendo que os planos representam capacidade operacional, nao volume garantido
                  de leads.
                </span>
              </label>

              <label className="consent-check">
                <input
                  type="checkbox"
                  checked={trialForm.aiDisclosureAccepted}
                  onChange={(event) =>
                    setTrialForm((current) => ({
                      ...current,
                      aiDisclosureAccepted: event.target.checked,
                    }))
                  }
                  required
                />
                <span>
                  Compreendo a nota de{" "}
                  <a
                    href={`${PUBLIC_PAGE_PATHS.contact}#legal-ai`}
                    onClick={(event) => {
                      event.preventDefault();
                      navigatePublicPage("contact", "legal-ai");
                    }}
                  >
                    uso de IA
                  </a>{" "}
                  e que algumas funcoes podem envolver processamento por fornecedores externos quando
                  o plano o permitir.
                </span>
              </label>

              <p className="trial-legal-note">
                Versao de politica {policyVersion}. Contacto de privacidade: {privacyContactEmail}.
              </p>

              {trialFeedback ? (
                <p className={trialFeedbackTone === "success" ? "feedback success" : "feedback error"}>
                  {trialFeedback}
                </p>
              ) : null}

              <button className="primary-button" type="submit" disabled={trialSubmitting}>
                {trialSubmitting ? "A validar trial..." : "Reservar trial de 15 dias"}
              </button>
            </form>
          </section>
        ) : null}

        <form className="lead-form auth-form" onSubmit={handleLogin}>
          <label>
            Email
            <input
              value={loginForm.email}
              onChange={(event) =>
                setLoginForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder={PUBLIC_DEMO_ENABLED ? DEMO_ACCESS[0].email : "equipa@agencia.pt"}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={loginForm.password}
              onChange={(event) =>
                setLoginForm((current) => ({ ...current, password: event.target.value }))
              }
              placeholder={PUBLIC_DEMO_ENABLED ? "Demo123!" : "Acesso seguro"}
              required
            />
          </label>

          {error ? <p className="feedback error">{error}</p> : null}
          {authBooting ? <p className="feedback">A validar sessao existente...</p> : null}

          <button className="primary-button" type="submit" disabled={authSubmitting || authBooting}>
            {authSubmitting ? "A entrar..." : "Entrar no workspace"}
          </button>
        </form>

        {PUBLIC_DEMO_ENABLED ? (
          <div className="auth-demo-grid">
            {DEMO_ACCESS.map((entry) => (
              <button
                className="auth-demo-card"
                key={entry.email}
                type="button"
                onClick={() => selectDemoProfile(entry)}
              >
                <span>{entry.role}</span>
                <strong>{entry.email}</strong>
                <p>{entry.description}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="auth-guard-card">
            <span>Demo publica desativada</span>
            <strong>As credenciais demo nao ficam expostas na frente publica.</strong>
            <p>
              Mantemos a experiencia comercial ativa, mas a demonstracao entra por validacao humana
              ou por contas reais do workspace.
            </p>
          </div>
        )}

        <div className="plan-preview-list">
          {plans.map((plan) => (
            <article
              className={plan.basePlanId === activePlanId ? "plan-preview active" : "plan-preview"}
              key={plan.id}
            >
              <span>{plan.publicName}</span>
              <strong>{plan.agentLabel}</strong>
              <p>{plan.recommendedFor}</p>
              <p className="pricing-note">
                {formatIncludedUsers(plan.includedUsers)} · {formatExtraUsers(plan, billingMode)}
              </p>
              <p className="upgrade-note">{getUpgradeHintForPlan(plan.basePlanId, plans)}</p>
            </article>
          ))}
        </div>

        <div className="auth-legal-stack">
          <article className="auth-legal-card">
            <span>Politica ativa</span>
            <strong>Versao {policyVersion}</strong>
            <p>{compliance?.dataUseSummary || LEGAL_SECTIONS[0].summary}</p>
          </article>
          <article className="auth-legal-card">
            <span>Contacto RGPD</span>
            <strong>{privacyContactEmail}</strong>
            <p>Direitos de acesso, retificacao, apagamento e oposicao tratados por este contacto.</p>
          </article>
        </div>
      </aside>
    );
  }

  function renderHomePage() {
    return (
      <>
        {renderPageHero({
          eyebrow: "Automacao inteligente para imobiliario em Portugal",
          title: "Automatize a prospeccao imobiliaria com IA.",
          text:
            "O ImoLead AI Pro encontra, qualifica e organiza leads com mais velocidade, mais contexto e menos trabalho manual para a equipa comercial.",
          stage: "home",
          primaryLabel: "Comecar agora",
          secondaryLabel: "Ver funcionalidades",
          onPrimaryClick: () =>
            openLandingLogin(
              "pro",
              "Demonstracao preparada para impacto imediato",
              "Levamos-te diretamente para a experiencia que melhor mostra como a plataforma acelera follow-up, priorizacao e controlo comercial."
            ),
          onSecondaryClick: () => navigatePublicPage("features"),
        })}

        <section className="marketing-metric-ribbon">
          {landingMetricBar.map((item) => (
            <article className="marketing-metric-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="marketing-section">
          <div className="section-head">
            <div>
              <p className="eyebrow">Entradas por cenario</p>
              <h3>O cliente entra pelo contexto certo em vez de cair numa demo generica</h3>
            </div>
          </div>

          <div className="marketing-scenario-grid">
            {guidedUseCases.map((useCase) => (
              <article
                className={useCase.id === "pro" ? "marketing-scenario-card featured" : "marketing-scenario-card"}
                key={useCase.id}
              >
                <span>{useCase.eyebrow}</span>
                <strong>{useCase.title}</strong>
                <p>{useCase.detail}</p>

                <div className="mini-tags">
                  {useCase.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

                <div className="marketing-inline-actions">
                  <button className="primary-button" type="button" onClick={useCase.primaryAction}>
                    {useCase.primaryLabel}
                  </button>
                  <button className="ghost-button" type="button" onClick={useCase.secondaryAction}>
                    {useCase.secondaryLabel}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-section public-sales-grid">
          <article className="public-sales-card public-sales-card-featured">
            <span>Pitch de venda</span>
            <strong>Uma entrada que vende autoridade e uma area interna que entrega operacao.</strong>
            <p>
              A conversa deixa de ser "mais um CRM" e passa a ser controlo comercial, triagem com
              IA, desks claros e crescimento preparado para Portugal e Europa.
            </p>
            <div className="public-stage-pill-row">
              <span>{coverageLabel}</span>
              <span>{dominantDeskLabel}</span>
              <span>{activePlan?.publicName || "ImoLead Pro"}</span>
            </div>
          </article>

          {commandSignals.map((signal) => (
            <article className="public-sales-card" key={signal.label}>
              <span>{signal.label}</span>
              <strong>{signal.value}</strong>
              <p>{signal.detail}</p>
            </article>
          ))}
        </section>

        <section className="marketing-section" id="landing-features">
          <div className="section-head">
            <div>
              <p className="eyebrow">Tudo o que precisa para automatizar</p>
              <h3>Captacao, classificacao, mensagens e controlo num unico sistema</h3>
            </div>
          </div>

          <div className="marketing-feature-grid home-feature-grid">
            {landingFeatureCards.map((feature) => (
              <article className="marketing-feature-card" key={feature.title}>
                <span>{feature.eyebrow}</span>
                <strong>{feature.title}</strong>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-section marketing-results-shell">
          <article className="shell-panel marketing-results-visual">
            <div className="marketing-results-board">
              <div className="marketing-results-head">
                <span>Vista executiva</span>
                <strong>{topMarket?.market || "Portugal"} em destaque</strong>
              </div>

              <div className="marketing-results-grid">
                <article>
                  <span>Desk</span>
                  <strong>{dominantDeskLabel}</strong>
                </article>
                <article>
                  <span>Fonte lider</span>
                  <strong>{dominantSource}</strong>
                </article>
                <article>
                  <span>Quentes</span>
                  <strong>{dashboardStats.quente}</strong>
                </article>
                <article>
                  <span>SLA urgente</span>
                  <strong>{dashboardStats.urgent_actions}</strong>
                </article>
              </div>
            </div>
          </article>

          <article className="shell-panel marketing-results-copy">
            <div className="section-head">
              <div>
                <p className="eyebrow">Resultado pedido</p>
                <h3>Uma estrutura que explica valor sem parecer improviso</h3>
              </div>
            </div>

            <ul className="marketing-benefit-list">
              {landingBenefitBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="marketing-inline-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() =>
                  openLandingLogin(
                    activePlanId,
                    "Entrar agora e ver o ganho de tempo na pratica",
                    "Ja escolhemos um perfil demo compativel com este plano para reduzires atrito e entrares direto na experiencia certa."
                  )
                }
              >
                Pedir demonstracao
              </button>
              <button className="ghost-button" type="button" onClick={() => navigatePublicPage("pricing")}>
                Rever oferta
              </button>
              <button className="ghost-button" type="button" onClick={() => navigatePublicPage("contact")}>
                Falar com a equipa
              </button>
            </div>
          </article>
        </section>

        {renderPricingCardsSection()}
        {renderSocialProofSection()}
        {renderFinalCtaSection()}
      </>
    );
  }

  function renderFeaturesPage() {
    return (
      <>
        {renderPageHero({
          eyebrow: "Tudo o que precisa para automatizar",
          title: "Captacao, classificacao, mensagens e controlo num unico sistema.",
          text:
            "A pagina de produto foca o essencial: blocos de valor, workflow operacional e o discurso certo para direcao, equipas e redes imobiliarias.",
          stage: "features",
          primaryLabel: "Ver planos",
          secondaryLabel: "Pedir demo",
          onPrimaryClick: () =>
            openLandingPricing(
              "pro",
              "Oferta comercial pronta para comparacao",
              "A pagina de precos abre com o plano Pro em foco para uma leitura mais rapida."
            ),
          onSecondaryClick: () =>
            openLandingLogin(
              "pro",
              "Demonstracao orientada ao valor do produto",
              "Entramos diretamente com o plano mais vendavel para mostrar o fluxo completo."
            ),
        })}

        <section className="marketing-section" id="landing-features">
          <div className="section-head">
            <div>
              <p className="eyebrow">Funcionalidades</p>
              <h3>Os blocos que resolvem o trabalho comercial no dia a dia</h3>
            </div>
          </div>

          <div className="marketing-feature-grid">
            {landingFeatureCards.map((feature) => (
              <article className="marketing-feature-card" key={feature.title}>
                <span>{feature.eyebrow}</span>
                <strong>{feature.title}</strong>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-section public-sales-grid">
          {commandSignals.map((signal) => (
            <article className="public-sales-card" key={signal.label}>
              <span>{signal.label}</span>
              <strong>{signal.value}</strong>
              <p>{signal.detail}</p>
            </article>
          ))}
        </section>

        <section className="marketing-section marketing-duo-grid">
          <article className="shell-panel marketing-story-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Workflow</p>
                <h3>Da captacao ao follow-up numa experiencia unica</h3>
              </div>
            </div>

            <div className="marketing-step-list">
              {landingWorkflow.map((item) => (
                <article className="marketing-step-card" key={item.step}>
                  <span>{item.step}</span>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="shell-panel marketing-story-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Percepcao de valor</p>
                <h3>Como isto deve soar para um diretor comercial</h3>
              </div>
            </div>

            <div className="marketing-testimonial-list">
              {landingTestimonials.map((item) => (
                <blockquote className="marketing-testimonial-card" key={item.author}>
                  <p>{item.quote}</p>
                  <footer>
                    <strong>{item.author}</strong>
                    <span>{item.role}</span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </article>
        </section>

        <section className="marketing-section marketing-results-shell">
          <article className="shell-panel marketing-results-copy">
            <div className="section-head">
              <div>
                <p className="eyebrow">Resultado</p>
                <h3>O produto mostra valor antes de pedirmos a reuniao seguinte</h3>
              </div>
            </div>

            <ul className="marketing-benefit-list">
              {landingBenefitBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="marketing-inline-actions">
              <button className="primary-button" type="button" onClick={() => navigatePublicPage("pricing")}>
                Ver planos
              </button>
              <button className="ghost-button" type="button" onClick={() => navigatePublicPage("contact")}>
                Ir para contacto
              </button>
            </div>
          </article>

          <article className="shell-panel marketing-results-visual">
            <div className="marketing-results-board">
              <div className="marketing-results-head">
                <span>Vista executiva</span>
                <strong>{topMarket?.market || "Portugal"} em destaque</strong>
              </div>

              <div className="marketing-results-grid">
                <article>
                  <span>Desk</span>
                  <strong>{dominantDeskLabel}</strong>
                </article>
                <article>
                  <span>Fonte lider</span>
                  <strong>{dominantSource}</strong>
                </article>
                <article>
                  <span>Quentes</span>
                  <strong>{dashboardStats.quente}</strong>
                </article>
                <article>
                  <span>SLA urgente</span>
                  <strong>{dashboardStats.urgent_actions}</strong>
                </article>
              </div>
            </div>
          </article>
        </section>

        {renderSocialProofSection()}
        {renderFinalCtaSection()}
      </>
    );
  }

  function renderPricingPage() {
    return (
      <>
        {renderPageHero({
          eyebrow: "Planos transparentes e flexiveis",
          title: "Uma proposta clara para vender Starter, Pro e Enterprise sem ambiguidades.",
          text:
            "A pagina de precos passa a ter autonomia propria, com trial, utilizadores incluidos, extra users e progressao natural entre planos.",
          stage: "pricing",
          primaryLabel: "Entrar com este plano",
          secondaryLabel: "Falar com a equipa",
          onPrimaryClick: () =>
            openLandingLogin(
              activePlanId,
              "Plano atual pronto para demonstracao",
              "Abrimos a pagina de entrada com o plano selecionado e a guidance certa."
            ),
          onSecondaryClick: () => navigatePublicPage("contact"),
        })}
        {renderPricingCardsSection({ enableCheckout: true })}
        <section className="marketing-section public-plan-summary-grid">
          {plans.map((plan) => (
            <article className="public-plan-summary-card" key={plan.id}>
              <span>{plan.publicName}</span>
              <strong>{plan.agentLabel}</strong>
              <p>{plan.reportsLabel}</p>
              <ul className="feature-list compact-list">
                <li>{formatLeadLimit(plan.leadLimit)}</li>
                <li>{formatIncludedUsers(plan.includedUsers)}</li>
                <li>{formatExtraUsers(plan, billingMode)}</li>
              </ul>
            </article>
          ))}
        </section>
        {renderSocialProofSection()}
        {renderFinalCtaSection()}
      </>
    );
  }

  function renderContactPage() {
    return (
      <>
        {renderPageHero({
          eyebrow: "Contacto e compliance",
          title: "Fechar a conversa com contacto real, governance e politicas visiveis.",
          text:
            "Esta pagina concentra fecho comercial, contacto RGPD, oferta enterprise e os documentos que sustentam a operacao publica.",
          stage: "contact",
          primaryLabel: "Abrir demo enterprise",
          secondaryLabel: "Ver login protegido",
          onPrimaryClick: () =>
            openLandingLogin(
              "custom",
              "Demo enterprise preparada para impressionar decisores",
              "Mostramos governance, planos, equipas e leitura executiva com a conta ADM."
            ),
          onSecondaryClick: () => navigatePublicPage("login"),
        })}
        <section className="marketing-section public-contact-grid">
          <article className="public-contact-card">
            <span>Contacto comercial</span>
            <strong>carlospsantos19820@gmail.com</strong>
            <p>Canal direto para proposta, demonstracao orientada e configuracao enterprise.</p>
          </article>
          <article className="public-contact-card">
            <span>Privacidade</span>
            <strong>{privacyContactEmail}</strong>
            <p>Tratamento de dados, direitos do titular e processos RGPD com contacto explicito.</p>
          </article>
          <article className="public-contact-card">
            <span>Versao legal</span>
            <strong>{policyVersion}</strong>
            <p>Politicas visiveis, trial com consentimento e uso de IA explicado sem esconder riscos.</p>
          </article>
        </section>
        {renderFinalCtaSection()}
        {renderLegalSection()}
      </>
    );
  }

  function renderPublicSite() {
    if (publicPage === "login") {
      return (
        <main className="auth-shell marketing-auth-shell public-login-shell">
          <div className="marketing-main public-login-main">
            {renderLoginEntryHero()}
          </div>

          {renderAuthPanel()}
        </main>
      );
    }

    return (
      <main className="public-marketing-shell">
        <div className="marketing-main public-marketing-main">
          {publicPage === "features"
            ? renderFeaturesPage()
            : publicPage === "pricing"
              ? renderPricingPage()
              : publicPage === "contact"
                ? renderContactPage()
                : renderHomePage()}
        </div>
      </main>
    );
  }

  function renderActiveView() {
    if (activeView === "pipeline") {
      return renderPipelineView();
    }

    if (activeView === "teams") {
      return renderTeamsView();
    }

    if (activeView === "reports") {
      return renderReportsView();
    }

    if (activeView === "pricing") {
      return renderPricingView();
    }

    if (activeView === "admin" && canAccessAdmin) {
      return renderAdminView();
    }

    return renderOperationalDashboardView();
  }

  if (!session) {
    return renderLoginView();
  }

  return (
    <main className="app-shell">
      <aside className="shell-sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <span className="brand-mark-ring" />
            <span className="brand-mark-core">IL</span>
          </div>
          <p className="brand-kicker">ImoLead AI Pro</p>
          <h1>Radar, agente e execucao.</h1>
          <p>Portugal primeiro. Iberia a seguir. Europa na mesma operacao.</p>

          <div className="brand-story">
            <strong>Agente AI, radar e comunicacao numa so camada.</strong>
            <p>
              Um workspace desenhado para mostrar prioridade comercial, contexto de mercado
              e outreach pronto sem obrigar a equipa a andar entre ferramentas soltas.
            </p>
          </div>

          <div className="brand-mini-grid">
            <article className="mini-metric">
              <span>Heat</span>
              <strong>{hotLeadRatio}%</strong>
            </article>
            <article className="mini-metric">
              <span>Desk</span>
              <strong>{dominantDeskLabel}</strong>
            </article>
            <article className="mini-metric">
              <span>Fonte</span>
              <strong>{dominantSource}</strong>
            </article>
          </div>
        </div>

        <nav className="shell-nav">
          {visibleNavItems.map((item) => (
            <button
              className={item.id === activeView ? "nav-button active" : "nav-button"}
              key={item.id}
              type="button"
              onClick={() => navigateTo(item.id)}
            >
              <span>{item.eyebrow}</span>
              <strong>{item.label}</strong>
              <p>{item.description}</p>
            </button>
          ))}
        </nav>

        <section className="sidebar-panel">
          <span>Workspace</span>
          <strong>{session.user.name}</strong>
          <div className="sidebar-meta">
            <p>{getRoleLabel(session.user.role)}</p>
            <p>{session.user.officeName}</p>
            <p>{session.user.teamName}</p>
            <p>{session.user.email}</p>
          </div>
          <button className="ghost-button sidebar-button" type="button" onClick={handleLogout}>
            Terminar sessao
          </button>
        </section>

        <section className="sidebar-panel">
          <span>Status da plataforma</span>
          <strong>{apiState}</strong>
          <div className="sidebar-meta">
            <p>AI {aiMode === "hybrid" ? "externa + heuristica" : "heuristica"}</p>
            <p>{dashboardStats.total} leads ativas</p>
            <p>{dashboardStats.overdue_followups} follow-ups em atraso</p>
            <p>{databaseConfigured ? "DB configurada" : "Fallback local ativo"}</p>
          </div>
        </section>

        <section className="sidebar-panel">
          <span>Plano comercial</span>
          <strong>{session.user.planName}</strong>
          <div className="sidebar-meta">
            <p>{activePlan?.agentLabel || session.user.planName}</p>
            <p>{activePlan?.reportsLabel || "Relatorios semanais"}</p>
            <p>{activePlan?.annualDiscountPercent || 20}% desconto anual fixo</p>
            <p>{activePlan?.includedMarkets.join(", ") || "Portugal, Espanha"}</p>
          </div>
        </section>
      </aside>

      <section className="shell-main">
        <header className="shell-header">
          <div>
            <p className="eyebrow">{viewMeta.eyebrow}</p>
            <h2>{viewMeta.label}</h2>
            <p className="header-copy">{viewMeta.description}</p>
            <p className="header-subcopy">
              {getRoleLabel(session.user.role)} em {session.user.officeName} · {session.user.teamName}
            </p>

            <div className="header-signal-row">
              <div className="header-signal">
                <span>Plano</span>
                <strong>{session.user.planName}</strong>
              </div>
              <div className="header-signal">
                <span>Agente AI</span>
                <strong>{activePlan?.agentLabel || marketingAiLabel}</strong>
              </div>
              <div className="header-signal">
                <span>Radar</span>
                <strong>{topMarket?.market || coverageLabel}</strong>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <button className="ghost-button" type="button" onClick={() => navigateTo("pipeline")}>
              Abrir pipeline
            </button>
            <button className="ghost-button" type="button" onClick={() => navigateTo("reports")}>
              Ver mercado
            </button>
            <button
              className="primary-button header-primary"
              type="button"
              onClick={() => navigateTo("pricing")}
            >
              Ver planos
            </button>
          </div>
        </header>

        {loading && leads.length === 0 ? <p className="feedback">A carregar workspace...</p> : null}
        {error && !loading ? <p className="feedback error">{error}</p> : null}

        {!loading ? renderActiveView() : null}
      </section>
    </main>
  );
}

export default App;

