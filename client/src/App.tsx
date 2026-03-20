import { startTransition, useDeferredValue, useEffect, useState } from "react";
import type { FormEvent } from "react";
import heroImg from "./assets/hero.png";
import "./App.css";
import {
  clearSessionToken,
  createLead,
  getCurrentSession,
  getHealth,
  getLeads,
  getPlans,
  getStats,
  getTeams,
  login,
  logout,
  updateLeadWorkflow,
  type AuthSession,
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

type ViewId = "dashboard" | "pipeline" | "teams" | "reports" | "pricing";
type BillingMode = "month" | "year";
type WorkflowDraftMap = Record<string, UpdateLeadWorkflowInput>;
type LoginForm = {
  email: string;
  password: string;
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

const DEMO_ACCESS = [
  {
    role: "Admin",
    email: "carla@imolead.ai",
    password: "Demo123!",
    description: "Visao total da rede, pricing e desks enterprise.",
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
  const [workflowDrafts, setWorkflowDrafts] = useState<WorkflowDraftMap>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingLeadId, setSavingLeadId] = useState("");
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

  const dashboardStats = stats || deriveStats(leads);
  const activePlan =
    plans.find((plan) => plan.id === activePlanId) ||
    plans.find((plan) => plan.id === "pro") ||
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
  const canReassignOwners = session?.user.role !== "consultant";
  const canSwitchPlan = !session;

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

  const viewMeta = NAV_ITEMS.find((item) => item.id === activeView) || NAV_ITEMS[0];

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
            {activePlan?.agentLabel || "AI Copilot"} · mercados ativos:{" "}
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
        <section className="hero-panel shell-panel">
          <div className="hero-copy">
            <p className="eyebrow">ImoLead AI Pro Enterprise</p>
            <h2>Operacao comercial para Portugal com arquitetura pronta para Europa.</h2>
            <p className="hero-text">
              O produto agora passa a ler como plataforma: uma shell de operacao, desk por
              equipas, visao executiva e pricing alinhado com o agente AI e com relatorios
              de mercado.
            </p>

            <div className="hero-actions">
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
          </div>

          <div className="hero-visual">
            <img src={heroImg} alt="Painel enterprise ImoLead AI Pro" />
            <div className="insight-card">
              <span>Radar do mercado</span>
              <strong>
                {topMarket
                  ? `${topMarket.market} lidera com ${topMarket.totalLeads} leads e score medio ${topMarket.averageAiScore}.`
                  : `${dashboardStats.overdue_followups} follow-ups estao em atraso.`}
              </strong>
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
                    <p>
                      {lead.location} · {lead.officeName}
                    </p>
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
                    <p>
                      {lead.nextStep} · {lead.assignedOwner}
                    </p>
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
                  className={plan.id === activePlanId ? "plan-preview active" : "plan-preview"}
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
              const isFeatured = plan.id === "pro";
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
                      className={plan.id === activePlanId ? "select-plan-button active" : "select-plan-button"}
                      type="button"
                      disabled={!canSwitchPlan}
                      onClick={() => setActivePlanId(plan.id)}
                    >
                      {session
                        ? plan.id === activePlanId
                          ? "Plano do utilizador"
                          : "Bloqueado pelo perfil"
                        : plan.id === activePlanId
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

  function renderLoginView() {
    return (
      <main className="auth-shell">
        <section className="auth-hero shell-panel">
          <p className="eyebrow">ImoLead AI Pro Enterprise</p>
          <h1>Entrar no cockpit comercial</h1>
          <p className="hero-text">
            Login por perfil para demonstrar desks, permissoes e comportamento do agente AI
            conforme o plano e a loja.
          </p>

          <div className="hero-actions">
            <div className="status-chip">{apiState}</div>
            <div className="status-chip muted">
              AI {aiMode === "hybrid" ? "externa + heuristica" : "heuristica"}
            </div>
            <div className="status-chip muted">
              {databaseConfigured ? "DB configurada" : "Fallback local ativo"}
            </div>
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
                className={plan.id === activePlanId ? "plan-preview active" : "plan-preview"}
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

    return renderDashboardView();
  }

  if (!session) {
    return renderLoginView();
  }

  return (
    <main className="app-shell">
      <aside className="shell-sidebar">
        <div className="brand-block">
          <p className="brand-kicker">ImoLead AI Pro</p>
          <h1>Enterprise cockpit</h1>
          <p>Portugal first. Europe ready.</p>
        </div>

        <nav className="shell-nav">
          {NAV_ITEMS.map((item) => (
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
