import { startTransition, useDeferredValue, useEffect, useState } from "react";
import type { FormEvent } from "react";
import heroImg from "./assets/hero.png";
import "./App.css";
import {
  clearSessionToken,
  createAdminPlan,
  createLead,
  deleteAdminPlan,
  getAdminPlans,
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

type ViewId = "dashboard" | "pipeline" | "teams" | "reports" | "pricing" | "admin";
type BillingMode = "month" | "year";
type WorkflowDraftMap = Record<string, UpdateLeadWorkflowInput>;
type LoginForm = {
  email: string;
  password: string;
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
    advancedAI: true,
    autoContact: true,
    multiLocation: true,
    multiLanguage: true,
    maxMessagesPerMonth: "1200",
    monthlyPrice: "97",
    yearlyPrice: "931.2",
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
    email: "carlospsantos@gmail.com",
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

function isViewId(value: string): value is ViewId {
  return NAV_ITEMS.some((item) => item.id === value);
}

function isPlanType(value: string | null | undefined): value is PlanType {
  return value === "basic" || value === "pro" || value === "custom";
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
    return "Escala enterprise";
  }

  return `Ate ${limit} leads/mes`;
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
  const [billingMode, setBillingMode] = useState<BillingMode>("month");
  const [activePlanId, setActivePlanId] = useState<PlanType>("pro");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authBooting, setAuthBooting] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: DEMO_ACCESS[0].email,
    password: DEMO_ACCESS[0].password,
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
  const [apiState, setApiState] = useState("A verificar ligacao");
  const [aiMode, setAiMode] = useState<"hybrid" | "heuristic">("heuristic");
  const [databaseConfigured, setDatabaseConfigured] = useState(false);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<PipelineStage | "all">("all");
  const [officeFilter, setOfficeFilter] = useState("all");
  const [form, setForm] = useState<CreateLeadInput>(initialForm);

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (!window.location.hash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#dashboard`
      );
    }

    const handleHashChange = () => {
      setActiveView(getViewFromHash());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

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
    await Promise.all([loadHealth(), loadPlansCatalog()]);

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

      setAiMode(health.aiMode);
      setDatabaseConfigured(health.databaseConfigured);
      setApiState(health.ok ? "API online" : "API com alerta");
      if (!session) {
        setActivePlanId(isPlanType(storedPlanId) ? storedPlanId : health.defaultPlanId);
      }
    } catch {
      setApiState("API offline");
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

  function handleLogout() {
    logout();
    startTransition(() => {
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

    if (typeof window !== "undefined" && window.location.hash !== `#${view}`) {
      window.location.hash = view;
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
  const visibleNavItems = canAccessAdmin
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => item.id !== "admin");

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
            <h2>Um cockpit imobiliario com assinatura propria para operar mercado, equipa e ritmo.</h2>
            <p className="hero-text">
              A plataforma passa a ler como infraestrutura comercial de uma rede imobiliaria:
              desks, cobertura geografica, radar de mercado e agente AI alinhado com o plano
              do workspace.
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
            <img src={heroImg} alt="Painel enterprise ImoLead AI Pro" />
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
                <p className="eyebrow">Cobertura</p>
                <h3>Mercados em destaque</h3>
              </div>
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
                </article>
              ))}
            </div>
          </article>
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
                <div className="mini-tags">
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
                    <span>{formatLeadLimit(plan.leadLimit)}</span>
                    <span>{plan.agentLabel}</span>
                    <span>{plan.reportsLabel}</span>
                  </div>

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
          Recommended for
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
          Lead limit
          <input
            type="number"
            min="0"
            value={draft.leadLimit}
            onChange={(event) => onChange({ leadLimit: event.target.value })}
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
          Reports label
          <input
            value={draft.reportsLabel}
            onChange={(event) => onChange({ reportsLabel: event.target.value })}
            placeholder="Relatorio executivo semanal"
          />
        </label>

        <label>
          Agent label
          <input
            value={draft.agentLabel}
            onChange={(event) => onChange({ agentLabel: event.target.value })}
            placeholder="AI Orchestrator"
          />
        </label>

        <label className="admin-span">
          Support label
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
          Market reports
          <textarea
            rows={4}
            value={draft.marketReports}
            onChange={(event) => onChange({ marketReports: event.target.value })}
            placeholder={"Relatorio semanal por cidade\nRadar executivo europeu"}
          />
        </label>

        <label className="admin-span">
          Agent capabilities
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
            placeholder={"Ate 600 leads por mes\nMulti-owner\nRelatorios semanais"}
          />
        </label>

        <div className="admin-boolean-grid admin-span">
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={draft.advancedAI}
              onChange={(event) => onChange({ advancedAI: event.target.checked })}
            />
            <span>Advanced AI</span>
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
              <strong>carlospsantos@gmail.com</strong>
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
    return (
      <main className="auth-shell">
        <section className="auth-hero shell-panel auth-stage">
          <div className="auth-stage-head">
            <p className="eyebrow">ImoLead AI Pro Enterprise</p>
            <h1>Entrar numa plataforma com cara de operacao real</h1>
            <p className="hero-text">
              A entrada agora apresenta a app como centro de comando imobiliario: desks,
              mercados, auth por perfil e agente AI alinhado com o plano do workspace.
            </p>
          </div>

          <div className="hero-actions hero-actions-grid">
            <div className="status-chip">{apiState}</div>
            <div className="status-chip muted">
              AI {aiMode === "hybrid" ? "externa + heuristica" : "heuristica"}
            </div>
            <div className="status-chip muted">
              {databaseConfigured ? "DB configurada" : "Fallback local ativo"}
            </div>
          </div>

          <div className="auth-stage-grid">
            {commandSignals.map((signal) => (
              <article className="auth-stage-card" key={signal.label}>
                <span>{signal.label}</span>
                <strong>{signal.value}</strong>
                <p>{signal.detail}</p>
              </article>
            ))}
          </div>

          <div className="auth-demo-grid">
            {DEMO_ACCESS.map((entry) => (
              <button
                className="auth-demo-card"
                key={entry.email}
                type="button"
                onClick={() =>
                  setLoginForm({
                    email: entry.email,
                    password: entry.password,
                  })
                }
              >
                <span>{entry.role}</span>
                <strong>{entry.email}</strong>
                <p>{entry.description}</p>
              </button>
            ))}
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
              </article>
            ))}
          </div>
        </section>

        <section className="auth-panel shell-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Autenticacao</p>
              <h3>Workspace com controlo por perfil</h3>
            </div>
          </div>

          <div className="auth-panel-note">
            <span>Entrada guiada</span>
            <p>
              Usa um dos perfis demo para validar escopo, desks e leitura comercial da rede.
            </p>
          </div>

          <form className="lead-form auth-form" onSubmit={handleLogin}>
            <label>
              Email
              <input
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="carla@imolead.ai"
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
                placeholder="Demo123!"
                required
              />
            </label>

            {error ? <p className="feedback error">{error}</p> : null}
            {authBooting ? <p className="feedback">A validar sessao existente...</p> : null}

            <button className="primary-button" type="submit" disabled={authSubmitting || authBooting}>
              {authSubmitting ? "A entrar..." : "Entrar no workspace"}
            </button>
          </form>
        </section>
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

    return renderDashboardView();
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
          <h1>Market command house</h1>
          <p>Portugal first. Iberia next. Europe on the same map.</p>

          <div className="brand-story">
            <strong>Operacao, mercado e agente no mesmo cockpit.</strong>
            <p>
              Um produto desenhado para parecer infraestrutura comercial de uma rede
              imobiliaria, nao apenas um painel de tarefas.
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
                <span>Mercados</span>
                <strong>{coverageLabel}</strong>
              </div>
              <div className="header-signal">
                <span>Fonte lider</span>
                <strong>{dominantSource}</strong>
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

