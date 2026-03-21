import "dotenv/config";
import { randomUUID } from "crypto";
import { Pool, PoolConfig } from "pg";
import bcrypt from "bcrypt";
import { runLeadAgent } from "./ai/agentService.js";
import { buildHeuristicLeadIntelligence, type RoutingBucket } from "./ai/enterpriseLeadAgent.js";
import {
  buildCommercialPlanSeedEntries,
  getPlanConfig,
  getPlanUpgradeMessage,
  isCountryCoveredByPlan,
  resolvePlanId,
  type CommercialPlan as CoreCommercialPlan,
  type PlanType,
} from "./core/plans.js";
import { comparePassword } from "./auth.js";

export type Customer = {
  id: string;
  name: string;
  email: string;
  googleAccessToken?: string;
};

export type TrialRequest = {
  id: string;
  name: string;
  email: string;
  normalizedEmail: string;
  phone: string;
  normalizedPhone: string;
  requestedPlanId: PlanType;
  source: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type WorkspaceRole = "admin" | "manager" | "consultant";

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

type WorkspaceUserRecord = WorkspaceUser & {
  passwordHash: string;
};

export type WorkspaceScope = {
  userId: string;
  userName: string;
  role: WorkspaceRole;
  officeName: string;
  teamName: string;
  preferredLanguage: string;
  planId: PlanType;
};

export type LeadStatus = "quente" | "morno" | "frio";
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

export type CreateLeadInput = {
  id?: string;
  name: string;
  property?: string;
  location: string;
  price: number;
  area?: number | null;
  source?: string;
  status?: LeadStatus;
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

export type CommercialPlan = CoreCommercialPlan;

export type UpsertCommercialPlanInput = {
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

type LeadStats = {
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

type LeadBase = {
  id: string;
  name: string;
  property: string;
  location: string;
  price: number;
  area?: number | null;
  source: string;
  contact?: string;
  notes?: string;
  createdAt: string;
  countryCode?: string;
  preferredLanguage?: string;
  planId?: PlanType;
};

const LEAD_INTELLIGENCE_VERSION = 4;
const LEGACY_ADMIN_EMAIL = "carla@imolead.ai";
const PREVIOUS_PRIMARY_ADMIN_EMAIL = "carlospsantos@gmail.com";
const PRIMARY_ADMIN_EMAIL = "carlospsantos19820@gmail.com";
const PRIMARY_ADMIN_NAME = "Carlos Santos";
const PRIMARY_ADMIN_PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD || "Demo123!";
const fallbackCustomers: Customer[] = [];
const fallbackTrialRequests: TrialRequest[] = [];
const fallbackCommercialPlans: CommercialPlan[] = buildCommercialPlanSeedEntries();

function createPasswordHash(password: string) {
  return bcrypt.hashSync(password, 10);
}

function sanitizeWorkspaceUser(user: WorkspaceUserRecord): WorkspaceUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    officeName: user.officeName,
    teamName: user.teamName,
    preferredLanguage: user.preferredLanguage,
    planId: user.planId,
    planName: user.planName,
  };
}

const fallbackOffices: Office[] = [
  {
    id: "office-lisboa",
    name: "Lisboa HQ",
    city: "Lisboa",
    countryCode: "PT",
    timezone: "Europe/Lisbon",
    languages: ["pt-PT", "en-GB", "fr-FR"],
    coverageMarkets: ["Portugal", "Franca", "Benelux"],
    focus: "direcao comercial e contas flagship",
  },
  {
    id: "office-porto",
    name: "Porto Prime Hub",
    city: "Porto",
    countryCode: "PT",
    timezone: "Europe/Lisbon",
    languages: ["pt-PT", "en-GB", "es-ES"],
    coverageMarkets: ["Portugal Norte", "Galiza", "Investimento iberico"],
    focus: "angariacao prime e growth norte",
  },
  {
    id: "office-algarve",
    name: "Algarve International Desk",
    city: "Faro",
    countryCode: "PT",
    timezone: "Europe/Lisbon",
    languages: ["pt-PT", "en-GB", "fr-FR", "de-DE"],
    coverageMarkets: ["Algarve", "Mercado britanico", "Mercado frances"],
    focus: "luxury coastal e compradores internacionais",
  },
  {
    id: "office-europe",
    name: "Europe Expansion Desk",
    city: "Lisboa",
    countryCode: "PT",
    timezone: "Europe/Lisbon",
    languages: ["en-GB", "es-ES", "fr-FR", "it-IT"],
    coverageMarkets: ["Espanha", "Franca", "Italia", "Europa"],
    focus: "expansao europeia e operacao multilingue",
  },
];

const fallbackTeamMembers: TeamMember[] = [
  {
    id: "member-1",
    name: "Carla Santos",
    role: "Head of Prime",
    teamName: "Prime Desk Lisboa",
    officeName: "Lisboa HQ",
    languages: ["pt-PT", "en-GB", "fr-FR"],
    marketFocus: ["Portugal", "Franca"],
  },
  {
    id: "member-2",
    name: "Miguel Leite",
    role: "Senior Consultant",
    teamName: "Prime Desk Norte",
    officeName: "Porto Prime Hub",
    languages: ["pt-PT", "en-GB", "es-ES"],
    marketFocus: ["Portugal Norte", "Galiza"],
  },
  {
    id: "member-3",
    name: "Rita Moreira",
    role: "Growth Manager",
    teamName: "Growth Centro Sul",
    officeName: "Lisboa HQ",
    languages: ["pt-PT", "en-GB"],
    marketFocus: ["Portugal", "Investimento urbano"],
  },
  {
    id: "member-4",
    name: "Joao Figueiredo",
    role: "Growth Manager",
    teamName: "Growth Norte",
    officeName: "Porto Prime Hub",
    languages: ["pt-PT", "en-GB", "es-ES"],
    marketFocus: ["Portugal Norte", "Espanha"],
  },
  {
    id: "member-5",
    name: "Helena Duarte",
    role: "International Advisor",
    teamName: "Prime Algarve International",
    officeName: "Algarve International Desk",
    languages: ["pt-PT", "en-GB", "fr-FR", "de-DE"],
    marketFocus: ["Algarve", "Mercado internacional"],
  },
  {
    id: "member-6",
    name: "Lucas Martin",
    role: "Expansion Lead",
    teamName: "Growth Europe",
    officeName: "Europe Expansion Desk",
    languages: ["en-GB", "es-ES", "fr-FR", "it-IT"],
    marketFocus: ["Espanha", "Franca", "Italia", "Europa"],
  },
  {
    id: "member-7",
    name: "Ana Pires",
    role: "Inside Sales",
    teamName: "Inside Sales Nurture",
    officeName: "Lisboa HQ",
    languages: ["pt-PT", "en-GB"],
    marketFocus: ["Portugal", "Nurture"],
  },
];

const fallbackWorkspaceUsers: WorkspaceUserRecord[] = [
  {
    id: "workspace-user-admin",
    name: PRIMARY_ADMIN_NAME,
    email: PRIMARY_ADMIN_EMAIL,
    role: "admin",
    officeName: "Lisboa HQ",
    teamName: "Prime Desk Lisboa",
    preferredLanguage: "pt-PT",
    planId: "custom",
    planName: getPlanConfig("custom").publicName,
    passwordHash: createPasswordHash(PRIMARY_ADMIN_PASSWORD),
  },
  {
    id: "workspace-user-manager",
    name: "Lucas Martin",
    email: "lucas@imolead.ai",
    role: "manager",
    officeName: "Europe Expansion Desk",
    teamName: "Growth Europe",
    preferredLanguage: "es-ES",
    planId: "pro",
    planName: getPlanConfig("pro").publicName,
    passwordHash: createPasswordHash("Demo123!"),
  },
  {
    id: "workspace-user-consultant",
    name: "Ana Pires",
    email: "ana@imolead.ai",
    role: "consultant",
    officeName: "Lisboa HQ",
    teamName: "Inside Sales Nurture",
    preferredLanguage: "pt-PT",
    planId: "basic",
    planName: getPlanConfig("basic").publicName,
    passwordHash: createPasswordHash("Demo123!"),
  },
];

function normalizeOptionalString(value: string | undefined | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeEmailAddress(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhoneNumber(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+")) {
    return `+${cleaned.slice(1).replace(/\D/g, "")}`;
  }

  const digits = cleaned.replace(/\D/g, "");
  return digits.startsWith("351") ? `+${digits}` : `+351${digits}`;
}

function normalizeStringList(values: string[] | undefined | null, fallback: string[] = []) {
  const normalized = (values || [])
    .map((value) => value.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : [...fallback];
}

function toSlug(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function assertAdminScope(scope?: WorkspaceScope | null) {
  if (!scope || scope.role !== "admin") {
    throw new Error("Sem permissao para gerir o painel de administracao.");
  }
}

function normalizeOptionalTimestamp(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function addHours(referenceIso: string, hours: number) {
  const date = new Date(referenceIso);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function inferLeadStatus(price: number): LeadStatus {
  if (price >= 400000) {
    return "quente";
  }

  if (price >= 250000) {
    return "morno";
  }

  return "frio";
}

function normalizeLeadStatus(status: string | undefined, price: number): LeadStatus {
  if (status === "quente" || status === "morno" || status === "frio") {
    return status;
  }

  return inferLeadStatus(price);
}

function inferCountryCode(location: string, explicit?: string) {
  if (explicit) {
    return explicit.toUpperCase();
  }

  if (/(madrid|barcelona|valencia|malaga|espanha|spain)/i.test(location)) {
    return "ES";
  }

  if (/(paris|lyon|nice|franca|france)/i.test(location)) {
    return "FR";
  }

  if (/(milan|milao|roma|rome|italia|italy)/i.test(location)) {
    return "IT";
  }

  return "PT";
}

function getPreferredLanguage(countryCode: string, explicit?: string) {
  if (explicit) {
    return explicit;
  }

  if (countryCode === "ES") {
    return "es-ES";
  }

  if (countryCode === "FR") {
    return "fr-FR";
  }

  if (countryCode === "IT") {
    return "it-IT";
  }

  return "pt-PT";
}

function getCurrencyCode(_countryCode: string) {
  return "EUR";
}

function getMarketName(countryCode: string, location: string) {
  if (countryCode === "ES") {
    return "Espanha";
  }

  if (countryCode === "FR") {
    return "Franca";
  }

  if (countryCode === "IT") {
    return "Italia";
  }

  if (/algarve|vilamoura|loule|quarteira|faro/i.test(location)) {
    return "Portugal Sul";
  }

  if (/porto|braga|aveiro|guimaraes/i.test(location)) {
    return "Portugal Norte";
  }

  return "Portugal";
}

function assertPlanCoverage(planId: PlanType, countryCode: string) {
  if (isCountryCoveredByPlan(planId, countryCode)) {
    return;
  }

  throw new Error(getPlanUpgradeMessage(planId, countryCode));
}

function hasLeadAccess(lead: Lead, scope?: WorkspaceScope) {
  if (!scope || scope.role === "admin") {
    return true;
  }

  if (scope.role === "manager") {
    return lead.officeName === scope.officeName;
  }

  return (
    lead.officeName === scope.officeName &&
    (lead.assignedTeam === scope.teamName || lead.assignedOwner === scope.userName)
  );
}

function canManageLead(lead: Lead, scope?: WorkspaceScope) {
  if (!scope) {
    return true;
  }

  if (scope.role === "admin") {
    return true;
  }

  if (scope.role === "manager") {
    return lead.officeName === scope.officeName;
  }

  return lead.assignedOwner === scope.userName || lead.assignedTeam === scope.teamName;
}

function filterLeadsForScope(leads: Lead[], scope?: WorkspaceScope) {
  return leads.filter((lead) => hasLeadAccess(lead, scope));
}

function filterTeamOverviewForScope(overview: TeamOverview, scope?: WorkspaceScope) {
  if (!scope || scope.role === "admin") {
    return overview;
  }

  const offices = overview.offices.filter((office) => office.name === scope.officeName);
  const members = overview.members.filter((member) =>
    scope.role === "manager"
      ? member.officeName === scope.officeName
      : member.officeName === scope.officeName && member.teamName === scope.teamName
  );

  return {
    offices,
    members,
    markets: [...new Set(offices.flatMap((office) => office.coverageMarkets))],
    languages: [...new Set(members.flatMap((member) => member.languages))],
  } satisfies TeamOverview;
}

function buildLeadStatsSnapshot(leads: Lead[]) {
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
  } satisfies LeadStats;
}

function getOfficeForLead(location: string, countryCode: string) {
  if (countryCode !== "PT") {
    return fallbackOffices.find((office) => office.name === "Europe Expansion Desk")!;
  }

  if (/algarve|vilamoura|loule|quarteira|faro/i.test(location)) {
    return fallbackOffices.find((office) => office.name === "Algarve International Desk")!;
  }

  if (/porto|foz|braga|aveiro|guimaraes/i.test(location)) {
    return fallbackOffices.find((office) => office.name === "Porto Prime Hub")!;
  }

  return fallbackOffices.find((office) => office.name === "Lisboa HQ")!;
}

function assignTeam(location: string, routingBucket: RoutingBucket, countryCode: string) {
  if (countryCode !== "PT") {
    return routingBucket === "flagship" ? "Prime Europe" : "Growth Europe";
  }

  if (/algarve|vilamoura|loule|quarteira|faro/i.test(location)) {
    return routingBucket === "nurture"
      ? "Inside Sales Nurture"
      : "Prime Algarve International";
  }

  if (routingBucket === "flagship") {
    if (/porto|foz|braga|aveiro|guimaraes/i.test(location)) {
      return "Prime Desk Norte";
    }

    return "Prime Desk Lisboa";
  }

  if (routingBucket === "growth") {
    if (/porto|braga|aveiro|guimaraes/i.test(location)) {
      return "Growth Norte";
    }

    return "Growth Centro Sul";
  }

  return "Inside Sales Nurture";
}

function pickOwner(teamName: string, officeName: string, preferredLanguage: string, leadName: string) {
  const exactTeam = fallbackTeamMembers.filter((member) => member.teamName === teamName);
  const officePool =
    exactTeam.length > 0
      ? exactTeam
      : fallbackTeamMembers.filter((member) => member.officeName === officeName);
  const languagePool = officePool.filter((member) =>
    member.languages.includes(preferredLanguage)
  );
  const pool = languagePool.length > 0 ? languagePool : officePool;

  if (pool.length === 0) {
    return "Equipa em atribuicao";
  }

  const hash = [...leadName].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return pool[hash % pool.length].name;
}

function buildOutreachChannel(
  routingBucket: RoutingBucket,
  status: LeadStatus,
  countryCode: string
) {
  if (countryCode !== "PT") {
    return "email e telefone";
  }

  if (routingBucket === "flagship") {
    return "telefone e email";
  }

  if (status === "quente") {
    return "telefone";
  }

  if (status === "morno") {
    return "whatsapp ou email";
  }

  return "email";
}

function buildStrategyGoal(routingBucket: RoutingBucket, status: LeadStatus) {
  if (routingBucket === "flagship") {
    return "agendar qualificacao premium nas proximas 2 horas";
  }

  if (status === "quente") {
    return "converter em reuniao ou visita com rapidez";
  }

  if (status === "morno") {
    return "descobrir timing e motivacao do proprietario";
  }

  return "nutrir a relacao e recolher mais contexto";
}

function buildOutreachMessage(
  name: string,
  location: string,
  routingBucket: RoutingBucket,
  status: LeadStatus,
  market: string
) {
  if (routingBucket === "flagship") {
    return `Bom dia ${name}, estamos a acompanhar procura premium muito ativa em ${location} e ${market}. Faz sentido alinharmos uma conversa curta ainda hoje sobre o seu imovel?`;
  }

  if (status === "quente") {
    return `Ola ${name}, vi o seu imovel em ${location} e acredito que pode encaixar bem nos compradores que estamos a acompanhar neste momento. Tem alguns minutos para falarmos hoje?`;
  }

  if (status === "morno") {
    return `Ola ${name}, reparei no seu imovel em ${location} e gostaria de perceber melhor o momento da venda. Posso partilhar uma leitura rapida da procura na sua zona.`;
  }

  return `Ola ${name}, vimos o seu anuncio em ${location}. Quando for oportuno, podemos partilhar dados de mercado e preparar um contacto mais ajustado ao momento da venda.`;
}

function getInitialPipelineStage(status: LeadStatus, routingBucket: RoutingBucket): PipelineStage {
  if (routingBucket === "flagship") {
    return "qualificacao";
  }

  if (status === "quente") {
    return "contactado";
  }

  if (status === "morno") {
    return "novo";
  }

  return "nurture";
}

function buildNextStep(stage: PipelineStage, routingBucket: RoutingBucket, status: LeadStatus) {
  if (stage === "visita") {
    return "confirmar agenda e preparar briefing comercial";
  }

  if (stage === "proposta") {
    return "fechar proposta e alinhar expectativas do proprietario";
  }

  if (routingBucket === "flagship") {
    return "ligacao executiva e qualificacao premium";
  }

  if (status === "quente") {
    return "primeiro contacto e agendamento de chamada";
  }

  if (status === "morno") {
    return "enviar valor de mercado e confirmar motivacao";
  }

  return "enriquecer dados e preparar nova tentativa";
}

function createSeedLead(
  seed: CreateLeadInput & {
    createdAt: string;
    assignedTeam?: string;
    assignedOwner?: string;
    officeName?: string;
    pipelineStage?: PipelineStage;
  }
) {
  const planId = resolvePlanId(seed.planId);
  const plan = getPlanConfig(planId);
  const property = seed.property || `Imovel em ${seed.location}`;
  const intelligence = buildHeuristicLeadIntelligence({
    name: seed.name,
    property,
    location: seed.location,
    price: seed.price,
    area: seed.area ?? null,
    source: seed.source || "Manual",
    contact: seed.contact,
    notes: seed.notes,
  });
  const countryCode = inferCountryCode(seed.location, seed.countryCode);
  const preferredLanguage = getPreferredLanguage(countryCode, seed.preferredLanguage);
  const market = getMarketName(countryCode, seed.location);
  const office = getOfficeForLead(seed.location, countryCode);
  const officeName = seed.officeName || office.name;
  const assignedTeam =
    seed.assignedTeam || assignTeam(seed.location, intelligence.routingBucket, countryCode);
  const assignedOwner = pickOwner(
    assignedTeam,
    officeName,
    preferredLanguage,
    seed.name
  );
  const status = seed.status || intelligence.status;
  const pipelineStage =
    seed.pipelineStage || getInitialPipelineStage(status, intelligence.routingBucket);

  return {
    id: seed.id || randomUUID(),
    name: seed.name,
    property,
    location: seed.location,
    price: seed.price,
    area: seed.area ?? null,
    source: seed.source || "Manual",
    status,
    aiScore: intelligence.aiScore,
    reasoning: intelligence.reasoning,
    recommendedAction: intelligence.recommendedAction,
    routingBucket: intelligence.routingBucket,
    slaHours: intelligence.slaHours,
    assignedTeam,
    assignedOwner: seed.assignedOwner || assignedOwner,
    officeName,
    pipelineStage,
    nextStep: buildNextStep(pipelineStage, intelligence.routingBucket, status),
    followUpAt: addHours(seed.createdAt, intelligence.slaHours),
    lastContactAt: null,
    strategyGoal: buildStrategyGoal(intelligence.routingBucket, intelligence.status),
    outreachChannel: buildOutreachChannel(
      intelligence.routingBucket,
      intelligence.status,
      countryCode
    ),
    outreachMessage: buildOutreachMessage(
      seed.name,
      seed.location,
      intelligence.routingBucket,
      intelligence.status,
      market
    ),
    market,
    countryCode,
    preferredLanguage,
    currencyCode: getCurrencyCode(countryCode),
    contact: seed.contact,
    notes: seed.notes,
    planId,
    planName: plan.publicName,
    agentLabel: plan.agentLabel,
    createdAt: seed.createdAt,
  } satisfies Lead;
}

const fallbackLeads: Lead[] = [
  createSeedLead({
    id: "lead-1",
    name: "Joao Martins",
    property: "T2 renovado no centro de Lisboa",
    location: "Lisboa",
    price: 320000,
    area: 78,
    source: "Idealista",
    contact: "joao@example.com",
    notes: "Anuncio com boa apresentacao e margem para abordagem imediata.",
    createdAt: new Date("2026-03-17T10:00:00.000Z").toISOString(),
  }),
  createSeedLead({
    id: "lead-2",
    name: "Marta Costa",
    property: "Moradia T3 com jardim",
    location: "Cascais",
    price: 540000,
    area: 145,
    source: "Casafari",
    contact: "marta@example.com",
    notes: "Lead interessante, mas requer follow-up mais consultivo.",
    createdAt: new Date("2026-03-18T14:30:00.000Z").toISOString(),
  }),
  createSeedLead({
    id: "lead-3",
    name: "Rui Almeida",
    property: "Apartamento T1 para investimento",
    location: "Porto",
    price: 215000,
    area: 54,
    source: "OLX",
    contact: "rui@example.com",
    notes: "Informacao ainda incompleta e contacto pouco responsivo.",
    createdAt: new Date("2026-03-19T08:15:00.000Z").toISOString(),
  }),
  createSeedLead({
    id: "lead-4",
    name: "Elena Garcia",
    property: "Piso T3 para relocation executiva",
    location: "Madrid",
    price: 610000,
    area: 118,
    source: "Manual",
    contact: "elena@example.com",
    notes: "Lead de expansao iberica com interesse em operacao multilingue.",
    countryCode: "ES",
    preferredLanguage: "es-ES",
    createdAt: new Date("2026-03-19T11:45:00.000Z").toISOString(),
  }),
  createSeedLead({
    id: "lead-5",
    name: "Sofia Nunes",
    property: "Apartamento T1 para venda gradual",
    location: "Lisboa",
    price: 185000,
    area: 51,
    source: "Manual",
    contact: "sofia@example.com",
    notes: "Carteira de nurture para inside sales com contexto inicial ja recolhido.",
    status: "frio",
    planId: "basic",
    officeName: "Lisboa HQ",
    assignedTeam: "Inside Sales Nurture",
    assignedOwner: "Ana Pires",
    pipelineStage: "nurture",
    createdAt: new Date("2026-03-19T16:10:00.000Z").toISOString(),
  }),
];

let pool: Pool | null = null;
let databaseReadyPromise: Promise<boolean> | null = null;

function isRailwayInternalHostname(hostname: string) {
  return hostname === "railway.internal" || hostname.endsWith(".railway.internal");
}

function getPoolConfig(): PoolConfig | null {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    let ssl: PoolConfig["ssl"];

    try {
      const url = new URL(connectionString);
      const hostname = url.hostname;
      const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
      const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
      const isInternalRailwayHost = isRailwayInternalHostname(hostname);

      if (sslMode === "disable") {
        ssl = undefined;
      } else if (isLocalHost || isInternalRailwayHost) {
        ssl = undefined;
      } else {
        ssl = { rejectUnauthorized: false };
      }
    } catch {
      ssl = undefined;
    }

    return {
      connectionString,
      ssl,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    };
  }

  if (
    process.env.PGHOST &&
    process.env.PGPORT &&
    process.env.PGUSER &&
    process.env.PGDATABASE
  ) {
    return {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl:
        process.env.PGHOST === "localhost" ||
        process.env.PGHOST === "127.0.0.1" ||
        isRailwayInternalHostname(process.env.PGHOST)
          ? undefined
          : { rejectUnauthorized: false },
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    };
  }

  return null;
}

function getPool() {
  if (pool) {
    return pool;
  }

  const config = getPoolConfig();

  if (!config) {
    return null;
  }

  pool = new Pool(config);
  pool.on("error", (error) => {
    console.error("Postgres pool error:", error);
  });

  return pool;
}

function mapLeadRow(row: any): Lead {
  const baseLead = {
    id: String(row.id),
    name: String(row.name),
    property: String(row.property),
    location: String(row.location),
    price: Number(row.price),
    area: row.area === null || row.area === undefined ? null : Number(row.area),
    source: String(row.source || "Manual"),
    contact: normalizeOptionalString(row.contact),
    notes: normalizeOptionalString(row.notes),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : new Date(row.created_at).toISOString(),
    countryCode: normalizeOptionalString(row.country_code),
    preferredLanguage: normalizeOptionalString(row.preferred_language),
    planId: resolvePlanId(normalizeOptionalString(row.plan_id)),
  } satisfies LeadBase;

  const fallbackLead = createSeedLead({
    id: baseLead.id,
    name: baseLead.name,
    property: baseLead.property,
    location: baseLead.location,
    price: baseLead.price,
    area: baseLead.area ?? null,
    source: baseLead.source,
    contact: baseLead.contact,
    notes: baseLead.notes,
    createdAt: baseLead.createdAt,
    countryCode: baseLead.countryCode,
    preferredLanguage: baseLead.preferredLanguage,
    planId: baseLead.planId,
    status: normalizeLeadStatus(row.status, Number(row.price)),
  });

  const status = normalizeLeadStatus(row.status, Number(row.price));
  const routingBucket = (row.routing_bucket || fallbackLead.routingBucket) as RoutingBucket;
  const countryCode = String(row.country_code || fallbackLead.countryCode);
  const market = String(row.market || fallbackLead.market);

  return {
    ...fallbackLead,
    status,
    aiScore:
      row.ai_score === null || row.ai_score === undefined
        ? fallbackLead.aiScore
        : Number(row.ai_score),
    reasoning: String(row.reasoning || fallbackLead.reasoning),
    recommendedAction: String(
      row.recommended_action || fallbackLead.recommendedAction
    ),
    routingBucket,
    slaHours:
      row.sla_hours === null || row.sla_hours === undefined
        ? fallbackLead.slaHours
        : Number(row.sla_hours),
    assignedTeam: String(
      row.assigned_team || assignTeam(String(row.location), routingBucket, countryCode)
    ),
    assignedOwner: String(row.assigned_owner || fallbackLead.assignedOwner),
    officeName: String(row.office_name || fallbackLead.officeName),
    pipelineStage:
      (row.pipeline_stage as PipelineStage | undefined) || fallbackLead.pipelineStage,
    nextStep: String(row.next_step || fallbackLead.nextStep),
    followUpAt: normalizeOptionalTimestamp(row.follow_up_at) || fallbackLead.followUpAt,
    lastContactAt: normalizeOptionalTimestamp(row.last_contact_at),
    strategyGoal: String(row.strategy_goal || buildStrategyGoal(routingBucket, status)),
    outreachChannel: String(
      row.outreach_channel || buildOutreachChannel(routingBucket, status, countryCode)
    ),
    outreachMessage: String(
      row.outreach_message ||
        buildOutreachMessage(String(row.name), String(row.location), routingBucket, status, market)
    ),
    market,
    countryCode,
    preferredLanguage: String(row.preferred_language || fallbackLead.preferredLanguage),
    currencyCode: String(row.currency_code || fallbackLead.currencyCode),
    contact: baseLead.contact,
    notes: baseLead.notes,
    planId: resolvePlanId(row.plan_id || fallbackLead.planId),
    planName: String(row.plan_name || fallbackLead.planName),
    agentLabel: String(row.agent_label || fallbackLead.agentLabel),
    createdAt: baseLead.createdAt,
  };
}

async function seedLeads(activePool: Pool) {
  const result = await activePool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM leads");
  const count = Number(result.rows[0]?.count || 0);

  if (count > 0) {
    return;
  }

  for (const lead of fallbackLeads) {
    await activePool.query(
      `
        INSERT INTO leads (
          id, name, property, location, price, area, source, status, ai_score,
          reasoning, recommended_action, routing_bucket, sla_hours, assigned_team,
          assigned_owner, office_name, pipeline_stage, next_step, follow_up_at,
          last_contact_at, strategy_goal, outreach_channel, outreach_message, market,
          country_code, preferred_language, currency_code, plan_id, plan_name,
          agent_label, intelligence_version,
          contact, notes, created_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31,
          $32, $33, $34
        )
        ON CONFLICT (id) DO NOTHING
      `,
      [
        lead.id,
        lead.name,
        lead.property,
        lead.location,
        lead.price,
        lead.area ?? null,
        lead.source,
        lead.status,
        lead.aiScore,
        lead.reasoning,
        lead.recommendedAction,
        lead.routingBucket,
        lead.slaHours,
        lead.assignedTeam,
        lead.assignedOwner,
        lead.officeName,
        lead.pipelineStage,
        lead.nextStep,
        lead.followUpAt ?? null,
        lead.lastContactAt ?? null,
        lead.strategyGoal,
        lead.outreachChannel,
        lead.outreachMessage,
        lead.market,
        lead.countryCode,
        lead.preferredLanguage,
        lead.currencyCode,
        lead.planId,
        lead.planName,
        lead.agentLabel,
        LEAD_INTELLIGENCE_VERSION,
        lead.contact ?? null,
        lead.notes ?? null,
        lead.createdAt,
      ]
    );
  }
}

async function seedWorkspaceUsers(activePool: Pool) {
  await activePool.query("DELETE FROM workspace_users WHERE LOWER(email) = $1", [
    LEGACY_ADMIN_EMAIL.toLowerCase(),
  ]);
  await activePool.query("DELETE FROM workspace_users WHERE LOWER(email) = $1", [
    PREVIOUS_PRIMARY_ADMIN_EMAIL.toLowerCase(),
  ]);

  for (const user of fallbackWorkspaceUsers) {
    await activePool.query(
      `
        INSERT INTO workspace_users (
          id, name, email, password_hash, role, office_name, team_name,
          preferred_language, plan_id, plan_name
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE
        SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          office_name = EXCLUDED.office_name,
          team_name = EXCLUDED.team_name,
          preferred_language = EXCLUDED.preferred_language,
          plan_id = EXCLUDED.plan_id,
          plan_name = EXCLUDED.plan_name
      `,
      [
        user.id,
        user.name,
        user.email,
        user.passwordHash,
        user.role,
        user.officeName,
        user.teamName,
        user.preferredLanguage,
        user.planId,
        user.planName,
      ]
    );
  }
}

async function seedCommercialPlans(activePool: Pool) {
  for (const plan of fallbackCommercialPlans) {
    await activePool.query(
      `
        INSERT INTO commercial_plans (
          id, base_plan_id, slug, public_name, recommended_for,
          included_country_codes, lead_limit, included_users, allows_extra_users,
          extra_user_monthly_price, extra_user_yearly_price, advanced_ai, auto_contact,
          multi_location, multi_language, max_messages_per_month, monthly_price, yearly_price, annual_discount_percent,
          reports_label, market_reports, included_markets, support_label,
          agent_label, agent_capabilities, features, is_active, is_public, sort_order
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6::jsonb, $7, $8, $9,
          $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21::jsonb, $22::jsonb, $23,
          $24, $25::jsonb, $26::jsonb, $27, $28, $29
        )
        ON CONFLICT (id) DO UPDATE
        SET
          base_plan_id = EXCLUDED.base_plan_id,
          slug = EXCLUDED.slug,
          public_name = EXCLUDED.public_name,
          recommended_for = EXCLUDED.recommended_for,
          included_country_codes = EXCLUDED.included_country_codes,
          lead_limit = EXCLUDED.lead_limit,
          included_users = EXCLUDED.included_users,
          allows_extra_users = EXCLUDED.allows_extra_users,
          extra_user_monthly_price = EXCLUDED.extra_user_monthly_price,
          extra_user_yearly_price = EXCLUDED.extra_user_yearly_price,
          advanced_ai = EXCLUDED.advanced_ai,
          auto_contact = EXCLUDED.auto_contact,
          multi_location = EXCLUDED.multi_location,
          multi_language = EXCLUDED.multi_language,
          max_messages_per_month = EXCLUDED.max_messages_per_month,
          monthly_price = EXCLUDED.monthly_price,
          yearly_price = EXCLUDED.yearly_price,
          annual_discount_percent = EXCLUDED.annual_discount_percent,
          reports_label = EXCLUDED.reports_label,
          market_reports = EXCLUDED.market_reports,
          included_markets = EXCLUDED.included_markets,
          support_label = EXCLUDED.support_label,
          agent_label = EXCLUDED.agent_label,
          agent_capabilities = EXCLUDED.agent_capabilities,
          features = EXCLUDED.features,
          is_active = EXCLUDED.is_active,
          is_public = EXCLUDED.is_public,
          sort_order = EXCLUDED.sort_order,
          updated_at = NOW()
      `,
      [
        plan.id,
        plan.basePlanId,
        plan.slug,
        plan.publicName,
        plan.recommendedFor,
        JSON.stringify(plan.includedCountryCodes),
        plan.leadLimit,
        plan.includedUsers,
        plan.allowsExtraUsers,
        plan.extraUserMonthlyPrice,
        plan.extraUserYearlyPrice,
        plan.advancedAI,
        plan.autoContact,
        plan.multiLocation,
        plan.multiLanguage,
        plan.maxMessagesPerMonth,
        plan.monthlyPrice,
        plan.yearlyPrice,
        plan.annualDiscountPercent,
        plan.reportsLabel,
        JSON.stringify(plan.marketReports),
        JSON.stringify(plan.includedMarkets),
        plan.supportLabel,
        plan.agentLabel,
        JSON.stringify(plan.agentCapabilities),
        JSON.stringify(plan.features),
        plan.isActive,
        plan.isPublic,
        plan.sortOrder,
      ]
    );
  }
}

async function syncLeadIntelligence(activePool: Pool) {
  const result = await activePool.query(
    `
      SELECT
        id, name, property, location, price, area, source, status, contact, notes,
        created_at, country_code, preferred_language, plan_id, intelligence_version
      FROM leads
      WHERE COALESCE(intelligence_version, 0) < $1
    `,
    [LEAD_INTELLIGENCE_VERSION]
  );

  for (const row of result.rows) {
    const refreshedLead = createSeedLead({
      id: String(row.id),
      name: String(row.name),
      property: String(row.property),
      location: String(row.location),
      price: Number(row.price),
      area: row.area === null || row.area === undefined ? null : Number(row.area),
      source: String(row.source || "Manual"),
      status: normalizeLeadStatus(row.status, Number(row.price)),
      contact: normalizeOptionalString(row.contact),
      notes: normalizeOptionalString(row.notes),
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : new Date(row.created_at).toISOString(),
      countryCode: normalizeOptionalString(row.country_code),
      preferredLanguage: normalizeOptionalString(row.preferred_language),
      planId: resolvePlanId(normalizeOptionalString(row.plan_id)),
    });

    await activePool.query(
      `
        UPDATE leads
        SET
          status = $2,
          ai_score = $3,
          reasoning = $4,
          recommended_action = $5,
          routing_bucket = $6,
          sla_hours = $7,
          assigned_team = $8,
          assigned_owner = $9,
          office_name = $10,
          pipeline_stage = $11,
          next_step = $12,
          follow_up_at = $13,
          strategy_goal = $14,
          outreach_channel = $15,
          outreach_message = $16,
          market = $17,
          country_code = $18,
          preferred_language = $19,
          currency_code = $20,
          plan_id = $21,
          plan_name = $22,
          agent_label = $23,
          intelligence_version = $24
        WHERE id = $1
      `,
      [
        refreshedLead.id,
        refreshedLead.status,
        refreshedLead.aiScore,
        refreshedLead.reasoning,
        refreshedLead.recommendedAction,
        refreshedLead.routingBucket,
        refreshedLead.slaHours,
        refreshedLead.assignedTeam,
        refreshedLead.assignedOwner,
        refreshedLead.officeName,
        refreshedLead.pipelineStage,
        refreshedLead.nextStep,
        refreshedLead.followUpAt ?? null,
        refreshedLead.strategyGoal,
        refreshedLead.outreachChannel,
        refreshedLead.outreachMessage,
        refreshedLead.market,
        refreshedLead.countryCode,
        refreshedLead.preferredLanguage,
        refreshedLead.currencyCode,
        refreshedLead.planId,
        refreshedLead.planName,
        refreshedLead.agentLabel,
        LEAD_INTELLIGENCE_VERSION,
      ]
    );
  }
}

async function initializeDatabase() {
  const activePool = getPool();

  if (!activePool) {
    return false;
  }

  try {
    await activePool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        google_access_token TEXT
      )
    `);

    await activePool.query(`
      CREATE TABLE IF NOT EXISTS trial_requests (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        normalized_email TEXT NOT NULL,
        phone TEXT NOT NULL,
        normalized_phone TEXT NOT NULL,
        requested_plan_id TEXT NOT NULL DEFAULT 'basic',
        source TEXT NOT NULL DEFAULT 'landing',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await activePool.query(`
      CREATE TABLE IF NOT EXISTS workspace_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        office_name TEXT NOT NULL,
        team_name TEXT NOT NULL,
        preferred_language TEXT NOT NULL DEFAULT 'pt-PT',
        plan_id TEXT NOT NULL DEFAULT 'pro',
        plan_name TEXT NOT NULL DEFAULT 'ImoLead Pro',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await activePool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        property TEXT NOT NULL,
        location TEXT NOT NULL,
        price INTEGER NOT NULL,
        area INTEGER,
        source TEXT NOT NULL,
        status TEXT NOT NULL,
        ai_score INTEGER,
        reasoning TEXT,
        recommended_action TEXT,
        routing_bucket TEXT,
        sla_hours INTEGER,
        assigned_team TEXT,
        assigned_owner TEXT,
        office_name TEXT,
        pipeline_stage TEXT,
        next_step TEXT,
        follow_up_at TIMESTAMPTZ,
        last_contact_at TIMESTAMPTZ,
        strategy_goal TEXT,
        outreach_channel TEXT,
        outreach_message TEXT,
        market TEXT,
        country_code TEXT,
        preferred_language TEXT,
        currency_code TEXT,
        plan_id TEXT,
        plan_name TEXT,
        agent_label TEXT,
        intelligence_version INTEGER NOT NULL DEFAULT 0,
        contact TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await activePool.query(`
      CREATE TABLE IF NOT EXISTS commercial_plans (
        id TEXT PRIMARY KEY,
        base_plan_id TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        public_name TEXT NOT NULL,
        recommended_for TEXT NOT NULL,
        included_country_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
        lead_limit INTEGER NOT NULL,
        included_users INTEGER NOT NULL DEFAULT 1,
        allows_extra_users BOOLEAN NOT NULL DEFAULT false,
        extra_user_monthly_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
        extra_user_yearly_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
        advanced_ai BOOLEAN NOT NULL DEFAULT false,
        auto_contact BOOLEAN NOT NULL DEFAULT false,
        multi_location BOOLEAN NOT NULL DEFAULT false,
        multi_language BOOLEAN NOT NULL DEFAULT false,
        max_messages_per_month INTEGER NOT NULL DEFAULT 0,
        monthly_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
        yearly_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
        annual_discount_percent INTEGER NOT NULL DEFAULT 20,
        reports_label TEXT NOT NULL,
        market_reports JSONB NOT NULL DEFAULT '[]'::jsonb,
        included_markets JSONB NOT NULL DEFAULT '[]'::jsonb,
        support_label TEXT NOT NULL,
        agent_label TEXT NOT NULL,
        agent_capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
        features JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_public BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await activePool.query(`
      ALTER TABLE leads
      ADD COLUMN IF NOT EXISTS ai_score INTEGER,
      ADD COLUMN IF NOT EXISTS reasoning TEXT,
      ADD COLUMN IF NOT EXISTS recommended_action TEXT,
      ADD COLUMN IF NOT EXISTS routing_bucket TEXT,
      ADD COLUMN IF NOT EXISTS sla_hours INTEGER,
      ADD COLUMN IF NOT EXISTS assigned_team TEXT,
      ADD COLUMN IF NOT EXISTS assigned_owner TEXT,
      ADD COLUMN IF NOT EXISTS office_name TEXT,
      ADD COLUMN IF NOT EXISTS pipeline_stage TEXT,
      ADD COLUMN IF NOT EXISTS next_step TEXT,
      ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS strategy_goal TEXT,
      ADD COLUMN IF NOT EXISTS outreach_channel TEXT,
      ADD COLUMN IF NOT EXISTS outreach_message TEXT,
      ADD COLUMN IF NOT EXISTS market TEXT,
      ADD COLUMN IF NOT EXISTS country_code TEXT,
      ADD COLUMN IF NOT EXISTS preferred_language TEXT,
      ADD COLUMN IF NOT EXISTS currency_code TEXT,
      ADD COLUMN IF NOT EXISTS plan_id TEXT,
      ADD COLUMN IF NOT EXISTS plan_name TEXT,
      ADD COLUMN IF NOT EXISTS agent_label TEXT,
      ADD COLUMN IF NOT EXISTS intelligence_version INTEGER NOT NULL DEFAULT 0
    `);

    await activePool.query(`
      ALTER TABLE commercial_plans
      ADD COLUMN IF NOT EXISTS included_users INTEGER NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS allows_extra_users BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS extra_user_monthly_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS extra_user_yearly_price NUMERIC(12, 2) NOT NULL DEFAULT 0
    `);

    await activePool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS trial_requests_normalized_email_idx
      ON trial_requests (normalized_email)
    `);

    await activePool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS trial_requests_normalized_phone_idx
      ON trial_requests (normalized_phone)
    `);

    await activePool.query(`
      CREATE INDEX IF NOT EXISTS leads_created_at_idx
      ON leads (created_at DESC)
    `);

    await activePool.query(`
      CREATE INDEX IF NOT EXISTS leads_follow_up_at_idx
      ON leads (follow_up_at ASC)
    `);

    await activePool.query(`
      CREATE INDEX IF NOT EXISTS commercial_plans_sort_idx
      ON commercial_plans (sort_order ASC, created_at ASC)
    `);

    await seedWorkspaceUsers(activePool);
    await seedCommercialPlans(activePool);
    await seedLeads(activePool);
    await syncLeadIntelligence(activePool);
    return true;
  } catch (error) {
    console.error("Database initialization failed, using in-memory storage:", error);
    return false;
  }
}

async function ensureDatabase() {
  if (!databaseReadyPromise) {
    databaseReadyPromise = initializeDatabase();
  }

  return databaseReadyPromise;
}

export async function prepareStorage() {
  const databaseReady = await ensureDatabase();
  const activePool = getPool();

  return {
    databaseReady,
    mode: databaseReady && activePool ? "database" : "memory",
  } as const;
}

async function useDatabase<T>(
  databaseOperation: (activePool: Pool) => Promise<T>,
  fallbackOperation: () => Promise<T>
) {
  const databaseReady = await ensureDatabase();
  const activePool = getPool();

  if (!databaseReady || !activePool) {
    return fallbackOperation();
  }

  try {
    return await databaseOperation(activePool);
  } catch (error) {
    console.error("Database operation failed, using fallback storage:", error);
    return fallbackOperation();
  }
}

export async function getCustomer(id: string) {
  return useDatabase(
    async (activePool) => {
      const result = await activePool.query(
        `
          SELECT id, name, email, google_access_token
          FROM customers
          WHERE id = $1
          LIMIT 1
        `,
        [id]
      );

      const row = result.rows[0];

      if (!row) {
        return null;
      }

      return {
        id: String(row.id),
        name: String(row.name),
        email: String(row.email),
        googleAccessToken: row.google_access_token || undefined,
      } satisfies Customer;
    },
    async () => fallbackCustomers.find((customer) => customer.id === id) || null
  );
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
  return useDatabase(
    async (activePool) => {
      const existing = await getCustomer(id);
      const merged = {
        id,
        name: data.name ?? existing?.name ?? "",
        email: data.email ?? existing?.email ?? "",
        googleAccessToken: data.googleAccessToken ?? existing?.googleAccessToken,
      };

      const result = await activePool.query(
        `
          INSERT INTO customers (id, name, email, google_access_token)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id)
          DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            google_access_token = EXCLUDED.google_access_token
          RETURNING id, name, email, google_access_token
        `,
        [merged.id, merged.name, merged.email, merged.googleAccessToken ?? null]
      );

      const row = result.rows[0];

      return {
        id: String(row.id),
        name: String(row.name),
        email: String(row.email),
        googleAccessToken: row.google_access_token || undefined,
      } satisfies Customer;
    },
    async () => {
      let customer = fallbackCustomers.find((entry) => entry.id === id);

      if (!customer) {
        customer = {
          id,
          name: data.name || "",
          email: data.email || "",
        };
        fallbackCustomers.push(customer);
      }

      Object.assign(customer, data);
      return customer;
    }
  );
}

export async function createTrialRequest(input: {
  name: string;
  email: string;
  phone: string;
  requestedPlanId?: PlanType;
  source?: string;
}) {
  const normalizedEmail = normalizeEmailAddress(input.email);
  const normalizedPhone = normalizePhoneNumber(input.phone);
  const planId = resolvePlanId(input.requestedPlanId || "basic");
  const source = normalizeOptionalString(input.source) || "landing";

  const nextRequest: TrialRequest = {
    id: randomUUID(),
    name: input.name.trim(),
    email: input.email.trim(),
    normalizedEmail,
    phone: input.phone.trim(),
    normalizedPhone,
    requestedPlanId: planId,
    source,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const duplicateMessage =
    "Ja existe um trial associado a este email ou telefone. Usa a conta anterior ou fala connosco para evoluir de plano.";

  return useDatabase(
    async (activePool) => {
      const existing = await activePool.query(
        `
          SELECT id
          FROM trial_requests
          WHERE normalized_email = $1 OR normalized_phone = $2
          LIMIT 1
        `,
        [normalizedEmail, normalizedPhone]
      );

      if (existing.rows[0]) {
        throw new Error(duplicateMessage);
      }

      const result = await activePool.query(
        `
          INSERT INTO trial_requests (
            id, name, email, normalized_email, phone, normalized_phone,
            requested_plan_id, source, status, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING
            id, name, email, normalized_email, phone, normalized_phone,
            requested_plan_id, source, status, created_at
        `,
        [
          nextRequest.id,
          nextRequest.name,
          nextRequest.email,
          nextRequest.normalizedEmail,
          nextRequest.phone,
          nextRequest.normalizedPhone,
          nextRequest.requestedPlanId,
          nextRequest.source,
          nextRequest.status,
          nextRequest.createdAt,
        ]
      );

      const row = result.rows[0];

      return {
        id: String(row.id),
        name: String(row.name),
        email: String(row.email),
        normalizedEmail: String(row.normalized_email),
        phone: String(row.phone),
        normalizedPhone: String(row.normalized_phone),
        requestedPlanId: resolvePlanId(String(row.requested_plan_id)),
        source: String(row.source),
        status: String(row.status) as TrialRequest["status"],
        createdAt: new Date(row.created_at).toISOString(),
      } satisfies TrialRequest;
    },
    async () => {
      const duplicate = fallbackTrialRequests.find(
        (entry) =>
          entry.normalizedEmail === normalizedEmail || entry.normalizedPhone === normalizedPhone
      );

      if (duplicate) {
        throw new Error(duplicateMessage);
      }

      fallbackTrialRequests.push(nextRequest);
      return nextRequest;
    }
  );
}

function mapWorkspaceUserRow(row: any): WorkspaceUserRecord {
  const planId = resolvePlanId(row.plan_id);

  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role) as WorkspaceRole,
    officeName: String(row.office_name),
    teamName: String(row.team_name),
    preferredLanguage: String(row.preferred_language || "pt-PT"),
    planId,
    planName: String(row.plan_name || getPlanConfig(planId).publicName),
    passwordHash: String(row.password_hash),
  };
}

function parseJsonArray(value: unknown, fallback: string[] = []) {
  if (Array.isArray(value)) {
    return normalizeStringList(value.map((entry) => String(entry)), fallback);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return normalizeStringList(parsed.map((entry) => String(entry)), fallback);
      }
    } catch {
      return normalizeStringList(
        value
          .split(/\r?\n|,/)
          .map((entry) => entry.trim())
          .filter(Boolean),
        fallback
      );
    }
  }

  return [...fallback];
}

function mapCommercialPlanRow(row: any): CommercialPlan {
  const basePlanId = resolvePlanId(row.base_plan_id);
  const fallbackPlan = getPlanConfig(basePlanId);

  return {
    id: String(row.id),
    basePlanId,
    slug: String(row.slug || toSlug(String(row.public_name || fallbackPlan.publicName), basePlanId)),
    publicName: String(row.public_name || fallbackPlan.publicName),
    recommendedFor: String(row.recommended_for || fallbackPlan.recommendedFor),
    includedCountryCodes: parseJsonArray(row.included_country_codes, fallbackPlan.includedCountryCodes),
    leadLimit: Number(row.lead_limit ?? fallbackPlan.leadLimit),
    includedUsers: Number(row.included_users ?? fallbackPlan.includedUsers),
    allowsExtraUsers: Boolean(row.allows_extra_users ?? fallbackPlan.allowsExtraUsers),
    extraUserMonthlyPrice: Number(
      row.extra_user_monthly_price ?? fallbackPlan.extraUserMonthlyPrice
    ),
    extraUserYearlyPrice: Number(
      row.extra_user_yearly_price ?? fallbackPlan.extraUserYearlyPrice
    ),
    advancedAI: Boolean(row.advanced_ai ?? fallbackPlan.advancedAI),
    autoContact: Boolean(row.auto_contact ?? fallbackPlan.autoContact),
    multiLocation: Boolean(row.multi_location ?? fallbackPlan.multiLocation),
    multiLanguage: Boolean(row.multi_language ?? fallbackPlan.multiLanguage),
    maxMessagesPerMonth: Number(row.max_messages_per_month ?? fallbackPlan.maxMessagesPerMonth),
    monthlyPrice: Number(row.monthly_price ?? fallbackPlan.monthlyPrice),
    yearlyPrice: Number(row.yearly_price ?? fallbackPlan.yearlyPrice),
    annualDiscountPercent: Number(
      row.annual_discount_percent ?? fallbackPlan.annualDiscountPercent
    ),
    reportsLabel: String(row.reports_label || fallbackPlan.reportsLabel),
    marketReports: parseJsonArray(row.market_reports, fallbackPlan.marketReports),
    includedMarkets: parseJsonArray(row.included_markets, fallbackPlan.includedMarkets),
    supportLabel: String(row.support_label || fallbackPlan.supportLabel),
    agentLabel: String(row.agent_label || fallbackPlan.agentLabel),
    agentCapabilities: parseJsonArray(
      row.agent_capabilities,
      fallbackPlan.agentCapabilities
    ),
    features: parseJsonArray(row.features, fallbackPlan.features),
    isActive: row.is_active === undefined ? true : Boolean(row.is_active),
    isPublic: row.is_public === undefined ? true : Boolean(row.is_public),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function buildCommercialPlanRecord(input: UpsertCommercialPlanInput): CommercialPlan {
  const basePlan = getPlanConfig(input.basePlanId);
  const annualDiscountPercent =
    Number.isFinite(input.annualDiscountPercent) && input.annualDiscountPercent >= 0
      ? input.annualDiscountPercent
      : basePlan.annualDiscountPercent;
  const monthlyPrice = Math.max(0, Number(input.monthlyPrice || 0));
  const fallbackYearly = Number(
    (monthlyPrice * 12 * (1 - annualDiscountPercent / 100)).toFixed(2)
  );
  const allowsExtraUsers = Boolean(input.allowsExtraUsers);
  const extraUserMonthlyPrice = allowsExtraUsers
    ? Math.max(0, Number(input.extraUserMonthlyPrice ?? basePlan.extraUserMonthlyPrice ?? 0))
    : 0;
  const fallbackExtraUserYearly = Number(
    (extraUserMonthlyPrice * 12 * (1 - annualDiscountPercent / 100)).toFixed(2)
  );
  const extraUserYearlyPrice = allowsExtraUsers
    ? Math.max(
        0,
        Number(input.extraUserYearlyPrice ?? basePlan.extraUserYearlyPrice ?? fallbackExtraUserYearly)
      )
    : 0;

  return {
    id: input.id || randomUUID(),
    basePlanId: input.basePlanId,
    slug: toSlug(
      normalizeOptionalString(input.slug) || input.publicName,
      input.basePlanId
    ),
    publicName: normalizeOptionalString(input.publicName) || basePlan.publicName,
    recommendedFor:
      normalizeOptionalString(input.recommendedFor) || basePlan.recommendedFor,
    includedCountryCodes: normalizeStringList(
      input.includedCountryCodes,
      basePlan.includedCountryCodes
    ),
    leadLimit: Math.max(0, Number(input.leadLimit || 0)),
    includedUsers: Math.max(1, Number(input.includedUsers || basePlan.includedUsers || 1)),
    allowsExtraUsers,
    extraUserMonthlyPrice,
    extraUserYearlyPrice,
    advancedAI: Boolean(input.advancedAI),
    autoContact: Boolean(input.autoContact),
    multiLocation: Boolean(input.multiLocation),
    multiLanguage: Boolean(input.multiLanguage),
    maxMessagesPerMonth: Math.max(0, Number(input.maxMessagesPerMonth || 0)),
    monthlyPrice,
    yearlyPrice: Math.max(0, Number(input.yearlyPrice || fallbackYearly)),
    annualDiscountPercent,
    reportsLabel: normalizeOptionalString(input.reportsLabel) || basePlan.reportsLabel,
    marketReports: normalizeStringList(input.marketReports, basePlan.marketReports),
    includedMarkets: normalizeStringList(input.includedMarkets, basePlan.includedMarkets),
    supportLabel: normalizeOptionalString(input.supportLabel) || basePlan.supportLabel,
    agentLabel: normalizeOptionalString(input.agentLabel) || basePlan.agentLabel,
    agentCapabilities: normalizeStringList(
      input.agentCapabilities,
      basePlan.agentCapabilities
    ),
    features: normalizeStringList(input.features, basePlan.features),
    isActive: Boolean(input.isActive),
    isPublic: Boolean(input.isPublic),
    sortOrder: Math.max(0, Number(input.sortOrder || 0)),
  };
}

export async function getWorkspaceUserById(id: string) {
  return useDatabase(
    async (activePool) => {
      const result = await activePool.query(
        `
          SELECT id, name, email, password_hash, role, office_name, team_name,
                 preferred_language, plan_id, plan_name
          FROM workspace_users
          WHERE id = $1
          LIMIT 1
        `,
        [id]
      );

      const row = result.rows[0];
      return row ? sanitizeWorkspaceUser(mapWorkspaceUserRow(row)) : null;
    },
    async () => {
      const user = fallbackWorkspaceUsers.find((entry) => entry.id === id);
      return user ? sanitizeWorkspaceUser(user) : null;
    }
  );
}

export async function listWorkspaceUsers(scope?: WorkspaceScope) {
  const users = await useDatabase(
    async (activePool) => {
      const result = await activePool.query(
        `
          SELECT id, name, email, password_hash, role, office_name, team_name,
                 preferred_language, plan_id, plan_name
          FROM workspace_users
          ORDER BY name ASC
        `
      );

      return result.rows.map((row) => sanitizeWorkspaceUser(mapWorkspaceUserRow(row)));
    },
    async () => fallbackWorkspaceUsers.map((user) => sanitizeWorkspaceUser(user))
  );

  if (!scope || scope.role === "admin") {
    return users;
  }

  return users.filter((user) =>
    scope.role === "manager"
      ? user.officeName === scope.officeName
      : user.id === scope.userId || user.teamName === scope.teamName
  );
}

export async function authenticateWorkspaceUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const record = await useDatabase(
    async (activePool) => {
      const result = await activePool.query(
        `
          SELECT id, name, email, password_hash, role, office_name, team_name,
                 preferred_language, plan_id, plan_name
          FROM workspace_users
          WHERE LOWER(email) = $1
          LIMIT 1
        `,
        [normalizedEmail]
      );

      const row = result.rows[0];
      return row ? mapWorkspaceUserRow(row) : null;
    },
    async () =>
      fallbackWorkspaceUsers.find((user) => user.email.toLowerCase() === normalizedEmail) || null
  );

  if (!record) {
    return null;
  }

  const passwordMatches = await comparePassword(password, record.passwordHash);

  if (!passwordMatches) {
    return null;
  }

  return sanitizeWorkspaceUser(record);
}

export async function listCommercialPlans(
  scope?: WorkspaceScope | null,
  options?: {
    includeInactive?: boolean;
    includePrivate?: boolean;
  }
) {
  const includeInactive = Boolean(options?.includeInactive);
  const includePrivate = Boolean(options?.includePrivate);
  const isAdmin = scope?.role === "admin";

  const plans = await useDatabase(
    async (activePool) => {
      const result = await activePool.query(
        `
          SELECT
            id, base_plan_id, slug, public_name, recommended_for,
            included_country_codes, lead_limit, included_users, allows_extra_users,
            extra_user_monthly_price, extra_user_yearly_price, advanced_ai, auto_contact,
            multi_location, multi_language, max_messages_per_month, monthly_price, yearly_price, annual_discount_percent,
            reports_label, market_reports, included_markets, support_label,
            agent_label, agent_capabilities, features, is_active, is_public, sort_order
          FROM commercial_plans
          ORDER BY sort_order ASC, monthly_price ASC, public_name ASC
        `
      );

      return result.rows.map(mapCommercialPlanRow);
    },
    async () => [...fallbackCommercialPlans].sort((left, right) => left.sortOrder - right.sortOrder)
  );

  return plans.filter((plan) => {
    if (isAdmin) {
      if (!includeInactive && !plan.isActive) {
        return false;
      }

      if (!includePrivate && !plan.isPublic) {
        return false;
      }

      return true;
    }

    return plan.isActive && plan.isPublic;
  });
}

export async function createCommercialPlan(
  input: UpsertCommercialPlanInput,
  scope?: WorkspaceScope | null
) {
  assertAdminScope(scope);
  const plan = buildCommercialPlanRecord(input);

  return useDatabase(
    async (activePool) => {
      const result = await activePool.query(
        `
          INSERT INTO commercial_plans (
            id, base_plan_id, slug, public_name, recommended_for,
            included_country_codes, lead_limit, included_users, allows_extra_users,
            extra_user_monthly_price, extra_user_yearly_price, advanced_ai, auto_contact,
            multi_location, multi_language, max_messages_per_month, monthly_price, yearly_price, annual_discount_percent,
            reports_label, market_reports, included_markets, support_label,
            agent_label, agent_capabilities, features, is_active, is_public, sort_order
          )
          VALUES (
            $1, $2, $3, $4, $5,
            $6::jsonb, $7, $8, $9,
            $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21::jsonb, $22::jsonb, $23,
            $24, $25::jsonb, $26::jsonb, $27, $28, $29
          )
          RETURNING
            id, base_plan_id, slug, public_name, recommended_for,
            included_country_codes, lead_limit, included_users, allows_extra_users,
            extra_user_monthly_price, extra_user_yearly_price, advanced_ai, auto_contact,
            multi_location, multi_language, max_messages_per_month, monthly_price, yearly_price, annual_discount_percent,
            reports_label, market_reports, included_markets, support_label,
            agent_label, agent_capabilities, features, is_active, is_public, sort_order
        `,
        [
          plan.id,
          plan.basePlanId,
          plan.slug,
          plan.publicName,
          plan.recommendedFor,
          JSON.stringify(plan.includedCountryCodes),
          plan.leadLimit,
          plan.includedUsers,
          plan.allowsExtraUsers,
          plan.extraUserMonthlyPrice,
          plan.extraUserYearlyPrice,
          plan.advancedAI,
          plan.autoContact,
          plan.multiLocation,
          plan.multiLanguage,
          plan.maxMessagesPerMonth,
          plan.monthlyPrice,
          plan.yearlyPrice,
          plan.annualDiscountPercent,
          plan.reportsLabel,
          JSON.stringify(plan.marketReports),
          JSON.stringify(plan.includedMarkets),
          plan.supportLabel,
          plan.agentLabel,
          JSON.stringify(plan.agentCapabilities),
          JSON.stringify(plan.features),
          plan.isActive,
          plan.isPublic,
          plan.sortOrder,
        ]
      );

      return mapCommercialPlanRow(result.rows[0]);
    },
    async () => {
      fallbackCommercialPlans.push(plan);
      return plan;
    }
  );
}

export async function updateCommercialPlan(
  id: string,
  input: UpsertCommercialPlanInput,
  scope?: WorkspaceScope | null
) {
  assertAdminScope(scope);

  const currentPlans = await listCommercialPlans(scope, {
    includeInactive: true,
    includePrivate: true,
  });
  const existingPlan = currentPlans.find((plan) => plan.id === id);

  if (!existingPlan) {
    return null;
  }

  const nextPlan = buildCommercialPlanRecord({
    ...existingPlan,
    ...input,
    id,
    basePlanId: input.basePlanId || existingPlan.basePlanId,
  });

  return useDatabase(
    async (activePool) => {
      const result = await activePool.query(
        `
          UPDATE commercial_plans
          SET
            base_plan_id = $2,
            slug = $3,
            public_name = $4,
            recommended_for = $5,
            included_country_codes = $6::jsonb,
            lead_limit = $7,
            included_users = $8,
            allows_extra_users = $9,
            extra_user_monthly_price = $10,
            extra_user_yearly_price = $11,
            advanced_ai = $12,
            auto_contact = $13,
            multi_location = $14,
            multi_language = $15,
            max_messages_per_month = $16,
            monthly_price = $17,
            yearly_price = $18,
            annual_discount_percent = $19,
            reports_label = $20,
            market_reports = $21::jsonb,
            included_markets = $22::jsonb,
            support_label = $23,
            agent_label = $24,
            agent_capabilities = $25::jsonb,
            features = $26::jsonb,
            is_active = $27,
            is_public = $28,
            sort_order = $29,
            updated_at = NOW()
          WHERE id = $1
          RETURNING
            id, base_plan_id, slug, public_name, recommended_for,
            included_country_codes, lead_limit, included_users, allows_extra_users,
            extra_user_monthly_price, extra_user_yearly_price, advanced_ai, auto_contact,
            multi_location, multi_language, max_messages_per_month, monthly_price, yearly_price, annual_discount_percent,
            reports_label, market_reports, included_markets, support_label,
            agent_label, agent_capabilities, features, is_active, is_public, sort_order
        `,
        [
          id,
          nextPlan.basePlanId,
          nextPlan.slug,
          nextPlan.publicName,
          nextPlan.recommendedFor,
          JSON.stringify(nextPlan.includedCountryCodes),
          nextPlan.leadLimit,
          nextPlan.includedUsers,
          nextPlan.allowsExtraUsers,
          nextPlan.extraUserMonthlyPrice,
          nextPlan.extraUserYearlyPrice,
          nextPlan.advancedAI,
          nextPlan.autoContact,
          nextPlan.multiLocation,
          nextPlan.multiLanguage,
          nextPlan.maxMessagesPerMonth,
          nextPlan.monthlyPrice,
          nextPlan.yearlyPrice,
          nextPlan.annualDiscountPercent,
          nextPlan.reportsLabel,
          JSON.stringify(nextPlan.marketReports),
          JSON.stringify(nextPlan.includedMarkets),
          nextPlan.supportLabel,
          nextPlan.agentLabel,
          JSON.stringify(nextPlan.agentCapabilities),
          JSON.stringify(nextPlan.features),
          nextPlan.isActive,
          nextPlan.isPublic,
          nextPlan.sortOrder,
        ]
      );

      return mapCommercialPlanRow(result.rows[0]);
    },
    async () => {
      const index = fallbackCommercialPlans.findIndex((plan) => plan.id === id);
      fallbackCommercialPlans[index] = nextPlan;
      return nextPlan;
    }
  );
}

export async function deleteCommercialPlan(id: string, scope?: WorkspaceScope | null) {
  assertAdminScope(scope);

  return useDatabase(
    async (activePool) => {
      const result = await activePool.query("DELETE FROM commercial_plans WHERE id = $1", [id]);
      return result.rowCount > 0;
    },
    async () => {
      const nextPlans = fallbackCommercialPlans.filter((plan) => plan.id !== id);
      const removed = nextPlans.length !== fallbackCommercialPlans.length;

      if (removed) {
        fallbackCommercialPlans.splice(0, fallbackCommercialPlans.length, ...nextPlans);
      }

      return removed;
    }
  );
}

export async function getTeamOverview(scope?: WorkspaceScope) {
  const overview = {
    offices: fallbackOffices,
    members: fallbackTeamMembers,
    markets: [...new Set(fallbackOffices.flatMap((office) => office.coverageMarkets))],
    languages: [...new Set(fallbackTeamMembers.flatMap((member) => member.languages))],
  } satisfies TeamOverview;

  return filterTeamOverviewForScope(overview, scope);
}

export async function getAllLeads(scope?: WorkspaceScope) {
  return useDatabase(
    async (activePool) => {
      const result = await activePool.query(
        `
          SELECT
            id, name, property, location, price, area, source, status,
            ai_score, reasoning, recommended_action, routing_bucket, sla_hours,
            assigned_team, assigned_owner, office_name, pipeline_stage, next_step,
            follow_up_at, last_contact_at, strategy_goal, outreach_channel,
            outreach_message, market, country_code, preferred_language,
            currency_code, plan_id, plan_name, agent_label, contact, notes, created_at
          FROM leads
          ORDER BY COALESCE(follow_up_at, created_at) ASC, ai_score DESC, created_at DESC
        `
      );

      return filterLeadsForScope(result.rows.map(mapLeadRow), scope);
    },
    async () =>
      filterLeadsForScope([...fallbackLeads], scope).sort((left, right) => {
        const leftDate = left.followUpAt || left.createdAt;
        const rightDate = right.followUpAt || right.createdAt;
        return leftDate.localeCompare(rightDate);
      })
  );
}

export async function createLead(data: CreateLeadInput, scope?: WorkspaceScope) {
  const planId = resolvePlanId(scope?.planId || data.planId);
  const plan = getPlanConfig(planId);
  const baseLead = {
    id: data.id || randomUUID(),
    name: data.name,
    property: data.property || `Imovel em ${data.location}`,
    location: data.location,
    price: data.price,
    area: data.area ?? null,
    source: data.source || "Manual",
    contact: normalizeOptionalString(data.contact),
    notes: normalizeOptionalString(data.notes),
    createdAt: new Date().toISOString(),
    countryCode: normalizeOptionalString(data.countryCode),
    preferredLanguage: normalizeOptionalString(data.preferredLanguage),
    planId,
  };

  const countryCode = inferCountryCode(baseLead.location, baseLead.countryCode);
  assertPlanCoverage(planId, countryCode);
  const analysis = await runLeadAgent(baseLead, { planId });
  const market = getMarketName(countryCode, baseLead.location);
  const computedStatus = data.status
    ? normalizeLeadStatus(data.status, data.price)
    : analysis.status;
  const detectedOffice = getOfficeForLead(baseLead.location, countryCode);
  const computedTeam = assignTeam(baseLead.location, analysis.routingBucket, countryCode);
  const officeName =
    scope && scope.role !== "admin" ? scope.officeName : detectedOffice.name;
  const assignedTeam =
    scope?.role === "consultant"
      ? scope.teamName
      : scope?.role === "manager" && detectedOffice.name !== scope.officeName
        ? scope.teamName
        : computedTeam;
  const assignedOwner =
    scope?.role === "consultant"
      ? scope.userName
      : pickOwner(
          assignedTeam,
          officeName,
          getPreferredLanguage(countryCode, baseLead.preferredLanguage),
          baseLead.name
        );
  const lead: Lead = {
    ...baseLead,
    status: computedStatus,
    aiScore: analysis.aiScore,
    reasoning: analysis.reasoning,
    recommendedAction: analysis.recommendedAction,
    routingBucket: analysis.routingBucket,
    slaHours: analysis.slaHours,
    assignedTeam,
    assignedOwner,
    officeName,
    pipelineStage: getInitialPipelineStage(computedStatus, analysis.routingBucket),
    nextStep: buildNextStep(
      getInitialPipelineStage(computedStatus, analysis.routingBucket),
      analysis.routingBucket,
      computedStatus
    ),
    followUpAt: addHours(baseLead.createdAt, analysis.slaHours),
    lastContactAt: null,
    strategyGoal: analysis.strategy.goal,
    outreachChannel: buildOutreachChannel(
      analysis.routingBucket,
      analysis.status,
      countryCode
    ),
    outreachMessage:
      normalizeOptionalString(analysis.message) ||
      buildOutreachMessage(
        baseLead.name,
        baseLead.location,
        analysis.routingBucket,
        analysis.status,
        market
      ),
    market,
    countryCode,
    preferredLanguage: getPreferredLanguage(countryCode, baseLead.preferredLanguage),
    currencyCode: getCurrencyCode(countryCode),
    planId,
    planName: analysis.planName || plan.publicName,
    agentLabel: analysis.agentLabel || plan.agentLabel,
  };

  return useDatabase(
    async (activePool) => {
      const result = await activePool.query(
        `
          INSERT INTO leads (
            id, name, property, location, price, area, source, status, ai_score,
            reasoning, recommended_action, routing_bucket, sla_hours, assigned_team,
            assigned_owner, office_name, pipeline_stage, next_step, follow_up_at,
            last_contact_at, strategy_goal, outreach_channel, outreach_message,
            market, country_code, preferred_language, currency_code,
            plan_id, plan_name, agent_label, intelligence_version,
            contact, notes, created_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31,
            $32, $33, $34
          )
          RETURNING
            id, name, property, location, price, area, source, status, ai_score,
            reasoning, recommended_action, routing_bucket, sla_hours, assigned_team,
            assigned_owner, office_name, pipeline_stage, next_step, follow_up_at,
            last_contact_at, strategy_goal, outreach_channel, outreach_message,
            market, country_code, preferred_language, currency_code,
            plan_id, plan_name, agent_label, contact, notes, created_at
        `,
        [
          lead.id,
          lead.name,
          lead.property,
          lead.location,
          lead.price,
          lead.area ?? null,
          lead.source,
          lead.status,
          lead.aiScore,
          lead.reasoning,
          lead.recommendedAction,
          lead.routingBucket,
          lead.slaHours,
          lead.assignedTeam,
          lead.assignedOwner,
          lead.officeName,
          lead.pipelineStage,
          lead.nextStep,
          lead.followUpAt ?? null,
          lead.lastContactAt ?? null,
          lead.strategyGoal,
          lead.outreachChannel,
          lead.outreachMessage,
          lead.market,
          lead.countryCode,
          lead.preferredLanguage,
          lead.currencyCode,
          lead.planId,
          lead.planName,
          lead.agentLabel,
          LEAD_INTELLIGENCE_VERSION,
          lead.contact ?? null,
          lead.notes ?? null,
          lead.createdAt,
        ]
      );

      return mapLeadRow(result.rows[0]);
    },
    async () => {
      fallbackLeads.unshift(lead);
      return lead;
    }
  );
}

export async function updateLeadWorkflow(
  id: string,
  input: UpdateLeadWorkflowInput,
  scope?: WorkspaceScope
) {
  return useDatabase(
    async (activePool) => {
      const currentResult = await activePool.query(
        `
          SELECT
            id, name, property, location, price, area, source, status, ai_score,
            reasoning, recommended_action, routing_bucket, sla_hours, assigned_team,
            assigned_owner, office_name, pipeline_stage, next_step, follow_up_at,
            last_contact_at, strategy_goal, outreach_channel, outreach_message,
            market, country_code, preferred_language, currency_code,
            plan_id, plan_name, agent_label, contact, notes, created_at
          FROM leads
          WHERE id = $1
          LIMIT 1
        `,
        [id]
      );

      const currentRow = currentResult.rows[0];

      if (!currentRow) {
        return null;
      }

      const currentLead = mapLeadRow(currentRow);

      if (!canManageLead(currentLead, scope)) {
        throw new Error("Sem permissao para gerir este lead.");
      }

      const nextStage = input.pipelineStage || currentLead.pipelineStage;
      const nextOwner =
        scope?.role === "consultant"
          ? currentLead.assignedOwner
          : normalizeOptionalString(input.assignedOwner) || currentLead.assignedOwner;
      const nextStep =
        normalizeOptionalString(input.nextStep) ||
        buildNextStep(nextStage, currentLead.routingBucket, currentLead.status);
      const followUpAt =
        input.followUpAt === null
          ? null
          : normalizeOptionalTimestamp(input.followUpAt) || currentLead.followUpAt || null;
      const lastContactAt =
        input.lastContactAt === null
          ? null
          : normalizeOptionalTimestamp(input.lastContactAt) || currentLead.lastContactAt || null;

      const result = await activePool.query(
        `
          UPDATE leads
          SET
            pipeline_stage = $2,
            assigned_owner = $3,
            next_step = $4,
            follow_up_at = $5,
            last_contact_at = $6
          WHERE id = $1
          RETURNING
            id, name, property, location, price, area, source, status, ai_score,
            reasoning, recommended_action, routing_bucket, sla_hours, assigned_team,
            assigned_owner, office_name, pipeline_stage, next_step, follow_up_at,
            last_contact_at, strategy_goal, outreach_channel, outreach_message,
            market, country_code, preferred_language, currency_code,
            plan_id, plan_name, agent_label, contact, notes, created_at
        `,
        [id, nextStage, nextOwner, nextStep, followUpAt, lastContactAt]
      );

      return mapLeadRow(result.rows[0]);
    },
    async () => {
      const target = fallbackLeads.find((lead) => lead.id === id);

      if (!target) {
        return null;
      }

      if (!canManageLead(target, scope)) {
        throw new Error("Sem permissao para gerir este lead.");
      }

      target.pipelineStage = input.pipelineStage || target.pipelineStage;
      target.assignedOwner =
        scope?.role === "consultant"
          ? target.assignedOwner
          : normalizeOptionalString(input.assignedOwner) || target.assignedOwner;
      target.nextStep =
        normalizeOptionalString(input.nextStep) ||
        buildNextStep(target.pipelineStage, target.routingBucket, target.status);
      target.followUpAt =
        input.followUpAt === null
          ? null
          : normalizeOptionalTimestamp(input.followUpAt) || target.followUpAt || null;
      target.lastContactAt =
        input.lastContactAt === null
          ? null
          : normalizeOptionalTimestamp(input.lastContactAt) || target.lastContactAt || null;

      return target;
    }
  );
}

export async function getLeadStats(scope?: WorkspaceScope) {
  const allLeads = await getAllLeads(scope);
  return buildLeadStatsSnapshot(allLeads);
}

export const storage = {
  getCustomer,
  updateCustomer,
  createTrialRequest,
  listCommercialPlans,
  createCommercialPlan,
  updateCommercialPlan,
  deleteCommercialPlan,
  getTeamOverview,
  getAllLeads,
  createLead,
  updateLeadWorkflow,
  getLeadStats,
};

