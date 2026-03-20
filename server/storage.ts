import "dotenv/config";
import { randomUUID } from "crypto";
import { Pool, PoolConfig } from "pg";
import { runLeadAgent } from "./ai/agentService.js";
import { buildHeuristicLeadIntelligence, type RoutingBucket } from "./ai/enterpriseLeadAgent.js";
import {
  getPlanConfig,
  getPlanUpgradeMessage,
  isCountryCoveredByPlan,
  resolvePlanId,
  type PlanType,
} from "./core/plans.js";

export type Customer = {
  id: string;
  name: string;
  email: string;
  googleAccessToken?: string;
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
const fallbackCustomers: Customer[] = [];

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

function normalizeOptionalString(value: string | undefined | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
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

function createSeedLead(seed: CreateLeadInput & { createdAt: string }) {
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
  const assignedTeam = assignTeam(seed.location, intelligence.routingBucket, countryCode);
  const assignedOwner = pickOwner(
    assignedTeam,
    office.name,
    preferredLanguage,
    seed.name
  );
  const status = seed.status || intelligence.status;
  const pipelineStage = getInitialPipelineStage(status, intelligence.routingBucket);

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
    assignedOwner,
    officeName: office.name,
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
];

let pool: Pool | null = null;
let databaseReadyPromise: Promise<boolean> | null = null;

function getPoolConfig(): PoolConfig | null {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    let ssl: PoolConfig["ssl"];

    try {
      const hostname = new URL(connectionString).hostname;
      const isLocalHost =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "railway.internal";

      ssl = isLocalHost ? undefined : { rejectUnauthorized: false };
    } catch {
      ssl = undefined;
    }

    return {
      connectionString,
      ssl,
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
      CREATE INDEX IF NOT EXISTS leads_created_at_idx
      ON leads (created_at DESC)
    `);

    await activePool.query(`
      CREATE INDEX IF NOT EXISTS leads_follow_up_at_idx
      ON leads (follow_up_at ASC)
    `);

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

export async function getTeamOverview() {
  return {
    offices: fallbackOffices,
    members: fallbackTeamMembers,
    markets: [...new Set(fallbackOffices.flatMap((office) => office.coverageMarkets))],
    languages: [...new Set(fallbackTeamMembers.flatMap((member) => member.languages))],
  } satisfies TeamOverview;
}

export async function getAllLeads() {
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

      return result.rows.map(mapLeadRow);
    },
    async () =>
      [...fallbackLeads].sort((left, right) => {
        const leftDate = left.followUpAt || left.createdAt;
        const rightDate = right.followUpAt || right.createdAt;
        return leftDate.localeCompare(rightDate);
      })
  );
}

export async function createLead(data: CreateLeadInput) {
  const planId = resolvePlanId(data.planId);
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
  const lead: Lead = {
    ...baseLead,
    status: computedStatus,
    aiScore: analysis.aiScore,
    reasoning: analysis.reasoning,
    recommendedAction: analysis.recommendedAction,
    routingBucket: analysis.routingBucket,
    slaHours: analysis.slaHours,
    assignedTeam: assignTeam(baseLead.location, analysis.routingBucket, countryCode),
    assignedOwner: pickOwner(
      assignTeam(baseLead.location, analysis.routingBucket, countryCode),
      getOfficeForLead(baseLead.location, countryCode).name,
      getPreferredLanguage(countryCode, baseLead.preferredLanguage),
      baseLead.name
    ),
    officeName: getOfficeForLead(baseLead.location, countryCode).name,
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

export async function updateLeadWorkflow(id: string, input: UpdateLeadWorkflowInput) {
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
      const nextStage = input.pipelineStage || currentLead.pipelineStage;
      const nextOwner =
        normalizeOptionalString(input.assignedOwner) || currentLead.assignedOwner;
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

      target.pipelineStage = input.pipelineStage || target.pipelineStage;
      target.assignedOwner =
        normalizeOptionalString(input.assignedOwner) || target.assignedOwner;
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

export async function getLeadStats() {
  return useDatabase(
    async (activePool) => {
      const result = await activePool.query(
        `
          SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'quente')::int AS quente,
            COUNT(*) FILTER (WHERE status = 'morno')::int AS morno,
            COUNT(*) FILTER (WHERE status = 'frio')::int AS frio,
            COALESCE(ROUND(AVG(ai_score))::int, 0) AS average_ai_score,
            COUNT(*) FILTER (WHERE routing_bucket = 'flagship')::int AS flagship_queue,
            COUNT(*) FILTER (WHERE routing_bucket = 'growth')::int AS growth_queue,
            COUNT(*) FILTER (WHERE routing_bucket = 'nurture')::int AS nurture_queue,
            COUNT(*) FILTER (WHERE sla_hours <= 8)::int AS urgent_actions,
            COUNT(DISTINCT assigned_team)::int AS active_teams,
            COUNT(DISTINCT office_name)::int AS active_offices,
            COUNT(*) FILTER (WHERE follow_up_at IS NOT NULL AND follow_up_at <= NOW())::int AS overdue_followups,
            COUNT(*) FILTER (WHERE last_contact_at IS NOT NULL AND DATE(last_contact_at) = CURRENT_DATE)::int AS contacted_today,
            COUNT(DISTINCT market)::int AS european_markets
          FROM leads
        `
      );

      return (
        result.rows[0] || {
          total: 0,
          quente: 0,
          morno: 0,
          frio: 0,
          average_ai_score: 0,
          flagship_queue: 0,
          growth_queue: 0,
          nurture_queue: 0,
          urgent_actions: 0,
          active_teams: 0,
          active_offices: 0,
          overdue_followups: 0,
          contacted_today: 0,
          european_markets: 0,
        }
      ) as LeadStats;
    },
    async () => {
      const allLeads = await getAllLeads();
      const teams = new Set(allLeads.map((lead) => lead.assignedTeam));
      const offices = new Set(allLeads.map((lead) => lead.officeName));
      const markets = new Set(allLeads.map((lead) => lead.market));

      return {
        total: allLeads.length,
        quente: allLeads.filter((lead) => lead.status === "quente").length,
        morno: allLeads.filter((lead) => lead.status === "morno").length,
        frio: allLeads.filter((lead) => lead.status === "frio").length,
        average_ai_score:
          allLeads.length > 0
            ? Math.round(allLeads.reduce((sum, lead) => sum + lead.aiScore, 0) / allLeads.length)
            : 0,
        flagship_queue: allLeads.filter((lead) => lead.routingBucket === "flagship").length,
        growth_queue: allLeads.filter((lead) => lead.routingBucket === "growth").length,
        nurture_queue: allLeads.filter((lead) => lead.routingBucket === "nurture").length,
        urgent_actions: allLeads.filter((lead) => lead.slaHours <= 8).length,
        active_teams: teams.size,
        active_offices: offices.size,
        overdue_followups: allLeads.filter((lead) =>
          lead.followUpAt ? new Date(lead.followUpAt).getTime() <= Date.now() : false
        ).length,
        contacted_today: allLeads.filter((lead) => {
          if (!lead.lastContactAt) {
            return false;
          }

          return lead.lastContactAt.slice(0, 10) === new Date().toISOString().slice(0, 10);
        }).length,
        european_markets: markets.size,
      } satisfies LeadStats;
    }
  );
}

export const storage = {
  getCustomer,
  updateCustomer,
  getTeamOverview,
  getAllLeads,
  createLead,
  updateLeadWorkflow,
  getLeadStats,
};

