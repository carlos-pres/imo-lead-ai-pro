import { startTransition, useDeferredValue, useEffect, useState } from "react";
import type { DragEvent, FormEvent, MouseEvent } from "react";
import "./App.css";
import { Dashboard } from "./components/Dashboard";
import {
  BadgePercent,
  Bell,
  Bot,
  LayoutDashboard,
  ListChecks,
  LogOut,
  BarChart3,
  ShieldCheck,
  Users,
  Sparkles,
  Workflow,
} from "lucide-react";
import {
  clearSessionToken,
  createAdminPlan,
  createAdminUser,
  createCustomerPortalSession,
  createPaymentCheckoutSession,
  createLead,
  createTrialRequest,
  deleteAdminPlan,
  deleteAdminUser,
  getAdminUsers,
  getAdminSystemStatus,
  getCalendarConnectionStatus,
  getCalendarConnectUrl,
  getAdminPlans,
  getCompliance,
  getCurrentSession,
  getHealth,
  getLeads,
  getMarketStrategistRadar,
  getPlans,
  getPublicStats,
  getStats,
  getTeams,
  login,
  logout,
  requestEmailVerification,
  requestPasswordReset,
  updateAdminPlan,
  updateAdminUser,
  updateLeadWorkflow,
  resetPassword,
  type AuthSession,
  type AdminSystemStatus,
  type CalendarConnectionStatus,
  type ComplianceSummary,
  type CommercialPlanInput,
  type CreateAdminUserInput,
  type CreateLeadInput,
  type Lead,
  type LeadStats,
  type MarketStrategistRadar,
  type PipelineStage,
  type PlanCatalogEntry,
  type PlanType,
  type RoutingBucket,
  type TeamOverview,
  type UpdateLeadWorkflowInput,
  type UpdateAdminUserInput,
  type WorkspaceUser,
  type WorkspaceRole,
} from "./services/api";
import { LEGAL_POLICY_VERSION, LEGAL_SECTIONS, PRIVACY_CONTACT_EMAIL } from "./legal";
import { getLeadMomentum, getLeadRiskLevel, selectCoolingLeads, selectHeatingLeads, selectPriorityLead, selectRecommendedNextAction } from "./lib/selectors";
import { CrmStoreContext, createCrmStoreSelectors, type CrmAutomation, type CrmTask } from "./lib/crm-store";
import { ActionButton } from "./components/ActionButton";
import { AutomationCard } from "./components/AutomationCard";
import { AutomationOverview } from "./components/AutomationOverview";
import { EmptyState } from "./components/EmptyState";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { ScoreBadge } from "./components/ScoreBadge";
import { StatusBadge } from "./components/StatusBadge";

declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

const BUILD_META = (() => {
  const version =
    typeof __APP_VERSION__ !== "undefined" && __APP_VERSION__ ? __APP_VERSION__ : "dev";
  const time =
    typeof __BUILD_TIME__ !== "undefined" && __BUILD_TIME__ ? __BUILD_TIME__ : "";

  if (!time) {
    return { label: `v${version}`, title: `Build v${version}` };
  }

  const parsed = new Date(time);
  const isValid = !Number.isNaN(parsed.getTime());
  const dateLabel = isValid
    ? parsed.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })
    : "";

  return {
    label: dateLabel ? `v${version} · ${dateLabel}` : `v${version}`,
    title: isValid ? `Build v${version} · ${parsed.toISOString()}` : `Build v${version}`,
  };
})();

type ViewId =
  | "dashboard"
  | "automation"
  | "pipeline"
  | "teams"
  | "reports"
  | "pricing"
  | "admin";
type PublicPageId =
  | "home"
  | "features"
  | "pricing"
  | "contact"
  | "login"
  | "createAccount"
  | "verifyEmail"
  | "resetPassword";
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
type CheckoutFeedbackKind = "idle" | "success" | "cancel" | "portal" | "progress";
type AdminPlanDraftMap = Record<string, AdminPlanDraft>;
type AdminUserDraftMap = Record<string, AdminUserDraft>;

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

type AdminUserDraft = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: WorkspaceRole;
  officeName: string;
  teamName: string;
  preferredLanguage: string;
  planId: PlanType;
  isActive: boolean;
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
    label: "Cockpit AI",
    eyebrow: "Agente",
    description: "Decisão, prioridade comercial e próxima ação no mesmo cockpit.",
  },
  {
    id: "automation",
    label: "Automação",
    eyebrow: "Cadência",
    description: "Agente, comunicação e follow-ups prontos para ação imediata.",
  },
  {
    id: "pipeline",
    label: "Leads",
    eyebrow: "Conversão",
    description: "Leads priorizadas, probabilidade, contexto e próxima ação.",
  },
  {
    id: "teams",
    label: "Equipas",
    eyebrow: "Cobertura",
    description: "Lojas, owners, línguas e desks para escalar Portugal e Europa.",
  },
  {
    id: "reports",
    label: "Radar",
    eyebrow: "Mercado",
    description: "Leitura estrategica de zonas, procura e oportunidades.",
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
    description: "Acessos, membros, planos, cobranca e controlo do workspace.",
  },
];

const PUBLIC_PAGE_PATHS: Record<PublicPageId, string> = {
  home: "/",
  features: "/funcionalidades",
  pricing: "/precos",
  contact: "/contacto",
  login: "/entrar",
  createAccount: "/criar-conta",
  verifyEmail: "/verificar-email",
  resetPassword: "/redefinir-senha",
};

const INTERNAL_PAGE_PATHS: Record<ViewId, string> = {
  dashboard: "/app/dashboard",
  automation: "/app/automation",
  pipeline: "/app/pipeline",
  teams: "/app/equipas",
  reports: "/app/mercado",
  pricing: "/app/planos",
  admin: "/app/admin",
};

const PUBLIC_NAV_ITEMS: PublicNavItem[] = [
  {
    id: "home",
    label: "Inicio",
    eyebrow: "Entrada",
    description: "Apresentação comercial e prova visual da plataforma.",
  },
  {
    id: "features",
    label: "Funcionalidades",
    eyebrow: "Produto",
    description: "Blocos de valor, workflow e prova operacional.",
  },
  {
    id: "pricing",
    label: "Preços",
    eyebrow: "Oferta",
    description: "Planos, trial, utilizadores e progressão comercial.",
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
    description: "Login protegido, trial e demonstração assistida.",
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

function normalizeCsvHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsvLeadInputs(content: string): CreateLeadInput[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = parseCsvLine(lines[0], delimiter).map(normalizeCsvHeader);

  return lines
    .slice(1)
    .map((line, index) => {
      const values = parseCsvLine(line, delimiter);
      const read = (keys: string[]) => {
        for (const key of keys) {
          const headerIndex = headers.findIndex((item) => item === key);
          if (headerIndex >= 0 && values[headerIndex]) {
            return values[headerIndex];
          }
        }
        return "";
      };

      const name = read(["nome", "name", "lead", "cliente", "proprietario"]) || `Lead importado ${index + 1}`;
      const location = read(["localizacao", "location", "cidade", "zona"]) || "Portugal";
      const priceRaw = read(["preco", "price", "valor"]);
      const normalizedPrice = priceRaw
        .replace(/[^\d,.-]/g, "")
        .replace(/\.(?=\d{3}(\D|$))/g, "")
        .replace(",", ".");
      const numericPrice = Number(normalizedPrice);

      return {
        name,
        property: read(["imovel", "property", "interesse"]) || "Imóvel por validar",
        location,
        price: String(Number.isFinite(numericPrice) ? numericPrice : 0),
        area: read(["area"]),
        source: read(["origem", "source", "canal"]) || "Importação CSV",
        contact: read(["contacto", "contact", "telefone", "email"]),
        notes: read(["notas", "notes", "obs"]),
        countryCode: read(["pais", "country"]) || "PT",
        preferredLanguage: read(["idioma", "language"]) || "pt-PT",
      } satisfies CreateLeadInput;
    })
    .filter((lead) => Boolean(lead.name) && Boolean(lead.location));
}

function createEmptyAdminPlanDraft(): AdminPlanDraft {
  return {
    basePlanId: "pro",
    slug: "",
    publicName: "",
    recommendedFor: "",
    includedCountryCodes: "PT\nES",
    leadLimit: "250",
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

function createEmptyAdminUserDraft(): AdminUserDraft {
  return {
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "consultant",
    officeName: "Lisboa HQ",
    teamName: "Inside Sales Nurture",
    preferredLanguage: "pt-PT",
    planId: "basic",
    isActive: true,
  };
}

function buildAdminUserDraft(user: WorkspaceUser): AdminUserDraft {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    password: "",
    role: user.role,
    officeName: user.officeName,
    teamName: user.teamName,
    preferredLanguage: user.preferredLanguage,
    planId: user.planId,
    isActive: user.isActive,
  };
}

function toAdminUserCreatePayload(draft: AdminUserDraft): CreateAdminUserInput {
  return {
    name: draft.name.trim(),
    email: draft.email.trim(),
    phone: draft.phone.trim(),
    password: draft.password,
    role: draft.role,
    officeName: draft.officeName.trim(),
    teamName: draft.teamName.trim(),
    preferredLanguage: draft.preferredLanguage.trim(),
    planId: draft.planId,
    isActive: draft.isActive,
  };
}

function toAdminUserUpdatePayload(draft: AdminUserDraft): UpdateAdminUserInput {
  return {
    name: draft.name.trim(),
    email: draft.email.trim(),
    phone: draft.phone.trim(),
    password: draft.password.trim() ? draft.password : undefined,
    role: draft.role,
    officeName: draft.officeName.trim(),
    teamName: draft.teamName.trim(),
    preferredLanguage: draft.preferredLanguage.trim(),
    planId: draft.planId,
    isActive: draft.isActive,
  };
}

const DEMO_ACCESS = [
  {
    role: "Admin",
    email: "carlospsantos19820@gmail.com",
    password: "@Carlos775",
    description: "ADM geral com controlo total da rede e do catalogo comercial.",
  },
  {
    role: "Manager",
    email: "lucas@imolead.ai",
    password: "@Carlos775",
    description: "Equipa Europa com foco na Ibéria e expansão.",
  },
  {
    role: "Consultor",
    email: "ana@imolead.ai",
    password: "@Carlos775",
    description: "Operação comercial limitada a equipa e carteira própria.",
  },
] as const;

const SALES_CONTACT_EMAIL = "comercial@imolead.ai";
const SALES_WHATSAPP_LABEL = "+351 927 627 844";
const SALES_WHATSAPP_DIGITS = "351927627844";

const PUBLIC_DEMO_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_PUBLIC_DEMO === "true";
const USE_ORIGINAL_MARKETING_VISUAL_IDENTITY = true;

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

function buildSalesWhatsAppUrl(message: string) {
  return `https://wa.me/${SALES_WHATSAPP_DIGITS}?text=${encodeURIComponent(message)}`;
}

function buildSalesSupportMailto(email: string, subject: string, body: string) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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

  if (normalizedPath === "/register") {
    return "createAccount";
  }

  const matched = (Object.keys(PUBLIC_PAGE_PATHS) as PublicPageId[]).find(
    (pageId) => PUBLIC_PAGE_PATHS[pageId] === normalizedPath
  );

  return matched && isPublicPageId(matched) ? matched : "home";
}

function isAuthPage(page: PublicPageId) {
  return page === "login" || page === "createAccount" || page === "verifyEmail" || page === "resetPassword";
}

function getViewFromPath(pathname: string): ViewId | null {
  const normalizedPath = normalizePublicPath(pathname);
  const matched = (Object.keys(INTERNAL_PAGE_PATHS) as ViewId[]).find(
    (viewId) => INTERNAL_PAGE_PATHS[viewId] === normalizedPath
  );

  return matched && isViewId(matched) ? matched : null;
}

function getViewFromHash(): ViewId {
  if (typeof window === "undefined") {
    return "dashboard";
  }

  const hash = window.location.hash.replace(/^#\/?/, "");
  return isViewId(hash) ? hash : "dashboard";
}

function getInitialView() {
  if (typeof window === "undefined") {
    return "dashboard";
  }

  return getViewFromPath(window.location.pathname) || getViewFromHash();
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

function createNextFollowUp(hoursFromNow: number) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString().slice(0, 16);
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function getBucketLabel(bucket: RoutingBucket) {
  if (bucket === "flagship") {
    return "Equipa prioritária";
  }

  if (bucket === "growth") {
    return "Equipa de crescimento";
  }

  return "Equipa de nutrição";
}

function localizeAgentLabel(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("orchestrator")) {
    return "Orquestrador IA";
  }

  if (normalized.includes("copilot")) {
    return "Copiloto IA";
  }

  if (normalized.includes("assistant")) {
    return "Assistente IA";
  }

  return label.replace(/\bAI\b/g, "IA");
}

function getStageLabel(stage: PipelineStage) {
  if (stage === "novo") {
    return "Novo";
  }

  if (stage === "qualificacao") {
    return "Qualificação";
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

function getNextPipelineStage(stage: PipelineStage): PipelineStage {
  const index = STAGE_ORDER.indexOf(stage);
  if (index < 0 || index >= STAGE_ORDER.length - 1) {
    return stage;
  }

  return STAGE_ORDER[index + 1];
}

function getContactWindowLabel(slaHours: number) {
  if (slaHours <= 8) return "Imediata";
  if (slaHours <= 24) return "Hoje";
  if (slaHours <= 48) return "Próximas 48h";
  return "Esta semana";
}

function formatLeadLimit(limit: number) {
  if (limit >= 999999) {
    return "Capacidade personalizada / fair use";
  }

  return `Capacidade até ${limit} leads/mês`;
}

function formatIncludedUsers(count: number) {
  return `${count} utilizador${count === 1 ? "" : "es"} incluído${count === 1 ? "" : "s"}`;
}

function formatExtraUsers(plan: PlanCatalogEntry, billing: BillingMode) {
  if (!plan.allowsExtraUsers) {
    return "Sem utilizadores extra";
  }

  const value = billing === "year" ? plan.extraUserYearlyPrice : plan.extraUserMonthlyPrice;
  const suffix = billing === "year" ? "/ano" : "/mês";
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
    return `${trialDays} dias de trial no Starter. Evolução sugerida: ${nextPlans.join(" e ")}.`;
  }

  if (planId === "pro") {
    return nextPlans.length > 0
      ? `Plano seguinte recomendado: ${nextPlans.join(", ")}.`
      : "Plano preparado para equipas em crescimento.";
  }

  return "Camada final para operações de maior escala.";
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
    `Próxima melhor ação: ${lead.recommendedAction}.`,
    `Equipa sugerida: ${getBucketLabel(lead.routingBucket)}.`,
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
    `Próxima ação sugerida: ${lead.recommendedAction}.`,
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
  const [activeView, setActiveView] = useState<ViewId>(() => getInitialView());
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
  const [passwordResetForm, setPasswordResetForm] = useState({
    token: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordResetSubmitting, setPasswordResetSubmitting] = useState(false);
  const [passwordResetFeedback, setPasswordResetFeedback] = useState("");
  const [passwordResetTone, setPasswordResetTone] = useState<"success" | "error" | "info">("info");
  const [authNotice, setAuthNotice] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [teamOverview, setTeamOverview] = useState<TeamOverview | null>(null);
  const [strategistRadar, setStrategistRadar] = useState<MarketStrategistRadar | null>(null);
  const [plans, setPlans] = useState<PlanCatalogEntry[]>([]);
  const [adminPlans, setAdminPlans] = useState<PlanCatalogEntry[]>([]);
  const [adminDrafts, setAdminDrafts] = useState<AdminPlanDraftMap>({});
  const [newPlanDraft, setNewPlanDraft] = useState<AdminPlanDraft>(() => createEmptyAdminPlanDraft());
  const [adminUsers, setAdminUsers] = useState<WorkspaceUser[]>([]);
  const [adminUserDrafts, setAdminUserDrafts] = useState<AdminUserDraftMap>({});
  const [newUserDraft, setNewUserDraft] = useState<AdminUserDraft>(() => createEmptyAdminUserDraft());
  const [adminSystemStatus, setAdminSystemStatus] = useState<AdminSystemStatus | null>(null);
  const [calendarConnectionStatus, setCalendarConnectionStatus] =
    useState<CalendarConnectionStatus | null>(null);
  const [calendarConnecting, setCalendarConnecting] = useState(false);
  const [workflowDrafts, setWorkflowDrafts] = useState<WorkflowDraftMap>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingLeadId, setSavingLeadId] = useState("");
  const [savingAdminPlanId, setSavingAdminPlanId] = useState("");
  const [savingAdminUserId, setSavingAdminUserId] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const [error, setError] = useState("");
  const [apiState, setApiState] = useState("A preparar experiência");
  const [aiMode, setAiMode] = useState<"hybrid" | "heuristic">("heuristic");
  const [databaseConfigured, setDatabaseConfigured] = useState(false);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<PipelineStage | "all">("all");
  const [officeFilter, setOfficeFilter] = useState("all");
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dropStageId, setDropStageId] = useState<PipelineStage | null>(null);
  const [form, setForm] = useState<CreateLeadInput>(initialForm);
  const [landingGuidance, setLandingGuidance] = useState<LandingGuidance>({
    title: "Entra numa demo já preparada para a tua realidade",
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
  const [publicStats, setPublicStats] = useState<LeadStats | null>(null);
  const [trialSubmitting, setTrialSubmitting] = useState(false);
  const [trialFeedback, setTrialFeedback] = useState("");
  const [trialFeedbackTone, setTrialFeedbackTone] = useState<"success" | "error">("success");
  const [checkoutSubmittingPlanId, setCheckoutSubmittingPlanId] = useState<PlanType | "">("");
  const [portalSubmitting, setPortalSubmitting] = useState(false);
  const [checkoutFeedbackTitle, setCheckoutFeedbackTitle] = useState("Checkout");
  const [checkoutFeedback, setCheckoutFeedback] = useState("");
  const [checkoutFeedbackTone, setCheckoutFeedbackTone] = useState<"success" | "error" | "info">(
    "info"
  );
  const [checkoutFeedbackKind, setCheckoutFeedbackKind] = useState<CheckoutFeedbackKind>("idle");
  const [workspaceFeedback, setWorkspaceFeedback] = useState("");
  const [focusLeadId, setFocusLeadId] = useState<string | null>(null);
  const [crmTasks, setCrmTasks] = useState<CrmTask[]>([]);
  const [crmAutomations, setCrmAutomations] = useState<CrmAutomation[]>([
    {
      id: "auto-followup",
      name: "Follow-up automático de leads sem resposta",
      status: "ativa",
      trigger: "24h sem resposta",
      objective: "Evitar perda de oportunidades por atraso no contacto.",
      lastRun: "Hoje",
    },
    {
      id: "auto-hot-alert",
      name: "Alerta para leads quentes sem contacto",
      status: "ativa",
      trigger: "Score IA elevado",
      objective: "Priorizar leads com maior intenção comercial.",
      lastRun: "Hoje",
    },
    {
      id: "auto-proposal",
      name: "Envio de proposta após qualificação",
      status: "rascunho",
      trigger: "Entrada em qualificação",
      objective: "Garantir proposta na janela ideal de contacto.",
      lastRun: "Ainda não executada",
    },
  ]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    const nextTasks = leads
      .filter((lead) => lead.status !== "frio" || Boolean(lead.followUpAt))
      .slice(0, 8)
      .map((lead) => ({
        id: `task-${lead.id}`,
        title: lead.nextStep || lead.recommendedAction,
        done: false,
        leadId: lead.id,
      }));

    setCrmTasks(nextTasks);

    const priorityLead = selectPriorityLead(leads);
    const nextInsights = [
      priorityLead
        ? `Lead prioritário: ${priorityLead.name} com score IA ${priorityLead.aiScore}.`
        : "Sem lead prioritário definido para esta janela.",
      `Há ${selectHeatingLeads(leads).length} leads a aquecer e ${selectCoolingLeads(leads).length} a arrefecer.`,
      `Ação recomendada agora: ${selectRecommendedNextAction(priorityLead)}.`,
    ];

    setAiInsights(nextInsights);

    if (!focusLeadId && priorityLead) {
      setFocusLeadId(priorityLead.id);
    }
  }, [leads, focusLeadId]);

  useEffect(() => {
    void bootstrap();
    // bootstrap é chamado apenas no arranque da app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handlePopState = () => {
      setPublicPage(getPublicPageFromPath(window.location.pathname));
      setActiveView(getViewFromPath(window.location.pathname) || getViewFromHash());
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("token") || params.get("resetToken");
    const verified = params.get("verified");
    const error = params.get("error");

    if (resetToken) {
      setPasswordResetForm((current) => ({ ...current, token: resetToken }));
      setPublicPage("resetPassword");
    }

    if (verified === "1") {
      setAuthNotice("Email verificado com sucesso. Já podes entrar na conta.");
    } else if (verified === "0" && error) {
      setAuthNotice(`Não foi possível verificar o email: ${error}`);
    }
  }, [publicPage]);

  useEffect(() => {
    if (typeof window === "undefined" || !session) {
      return;
    }

    const nextPath = INTERNAL_PAGE_PATHS[activeView] || INTERNAL_PAGE_PATHS.dashboard;
    const nextUrl = `${nextPath}${window.location.search}`;

    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }

    setPublicPage("home");
  }, [activeView, session]);

  useEffect(() => {
    if (typeof window === "undefined" || authBooting || session) {
      return;
    }

    if (getViewFromPath(window.location.pathname)) {
      window.history.replaceState(null, "", `${PUBLIC_PAGE_PATHS.login}${window.location.search}`);
      setPublicPage("login");
    }
  }, [authBooting, session]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const checkoutState = params.get("checkout");
    const checkoutPlan = params.get("plan");
    const checkoutBilling = params.get("billing");
    const portalState = params.get("portal");

    if (isPlanType(checkoutPlan)) {
      setActivePlanId(checkoutPlan);
    }

    if (checkoutBilling === "month" || checkoutBilling === "year") {
      setBillingMode(checkoutBilling);
    }

    if (checkoutState === "success") {
      setCheckoutFeedbackTitle("Subscrição ativada");
      setCheckoutFeedback(
        "O checkout foi concluido e o plano ficou em ativação. O passo seguinte e entrar no workspace, validar equipa e começar a operar com o agente certo."
      );
      setCheckoutFeedbackTone("success");
      setCheckoutFeedbackKind("success");
      startTransition(() => {
        setPublicPage("pricing");
      });
      window.history.replaceState(null, "", PUBLIC_PAGE_PATHS.pricing);
      return;
    }

    if (checkoutState === "cancel") {
      setCheckoutFeedbackTitle("Checkout interrompido");
      setCheckoutFeedback(
        "A ativação não foi concluída. Podes rever o plano, manter os dados já preenchidos e retomar o checkout quando quiseres."
      );
      setCheckoutFeedbackTone("error");
      setCheckoutFeedbackKind("cancel");
      startTransition(() => {
        setPublicPage("pricing");
      });
      window.history.replaceState(null, "", PUBLIC_PAGE_PATHS.pricing);
      return;
    }

    if (portalState === "return") {
      setCheckoutFeedbackTitle("Subscrição em foco");
      setCheckoutFeedback(
        "Voltaste do portal de billing. Aqui podes rever o plano ativo, os utilizadores incluídos e decidir o passo comercial seguinte."
      );
      setCheckoutFeedbackTone("info");
      setCheckoutFeedbackKind("portal");
      startTransition(() => {
        setPublicPage("pricing");
      });
      window.history.replaceState(null, "", PUBLIC_PAGE_PATHS.pricing);
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
    setAdminUsers([]);
    setAdminUserDrafts({});
    setNewUserDraft(createEmptyAdminUserDraft());
    setAdminSystemStatus(null);
  }, [session]);

  useEffect(() => {
    void loadCalendarStatus();
  }, [session]);

  async function bootstrap() {
    await Promise.all([loadHealth(), loadPlansCatalog(), loadCompliance(), loadPublicStats()]);

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
        sessionError instanceof Error ? sessionError.message : "Não foi possível recuperar a sessão"
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

  async function loadPublicStats() {
    try {
      const stats = await getPublicStats();
      setPublicStats(stats);
    } catch {
      setPublicStats(null);
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
      const [adminPlanData, adminUserData, nextSystemStatus] = await Promise.all([
        getAdminPlans(),
        getAdminUsers(),
        getAdminSystemStatus(),
      ]);
      startTransition(() => {
        setAdminPlans(adminPlanData);
        setAdminDrafts(
          adminPlanData.reduce<AdminPlanDraftMap>((drafts, plan) => {
            drafts[plan.id] = buildAdminPlanDraft(plan);
            return drafts;
          }, {})
        );
        setAdminUsers(adminUserData);
        setAdminUserDrafts(
          adminUserData.reduce<AdminUserDraftMap>((drafts, user) => {
            drafts[user.id] = buildAdminUserDraft(user);
            return drafts;
          }, {})
        );
        setAdminSystemStatus(nextSystemStatus);
      });
    } catch (adminError) {
      setError(
        adminError instanceof Error
          ? adminError.message
          : "Falha ao carregar o painel de administração"
      );
    }
  }

  async function loadCalendarStatus() {
    if (!session) {
      setCalendarConnectionStatus(null);
      return;
    }

    try {
      const nextStatus = await getCalendarConnectionStatus();
      setCalendarConnectionStatus(nextStatus);
    } catch {
      setCalendarConnectionStatus(null);
    }
  }

  async function loadWorkspace() {
    try {
      setLoading(true);
      setError("");

      const [leadResult, statsResult, teamResult, strategistResult] = await Promise.allSettled([
        getLeads(),
        getStats(),
        getTeams(),
        getMarketStrategistRadar(),
      ]);

      if (leadResult.status !== "fulfilled") {
        throw leadResult.reason;
      }

      const leadData = leadResult.value;
      const statsData =
        statsResult.status === "fulfilled" ? statsResult.value : deriveStats(leadData);
      const teamData = teamResult.status === "fulfilled" ? teamResult.value : null;
      const nextStrategistRadar =
        strategistResult.status === "fulfilled" ? strategistResult.value : null;

      startTransition(() => {
        setLeads(leadData);
        setStats(statsData);
        setTeamOverview(teamData);
        setStrategistRadar(nextStrategistRadar);
        setWorkflowDrafts(buildWorkflowDrafts(leadData));
      });
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Falha ao carregar workspace";

      if (/Sessão/i.test(message)) {
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
      setError(loginError instanceof Error ? loginError.message : "Falha ao iniciar sessão");
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
        "Trial reservado com proteção anti-reutilização",
        "O email e o telefone ficaram validados como identificadores únicos do trial. A progressão natural continua a apontar para Pro e Enterprise."
      );
    } catch (trialError) {
      setTrialFeedbackTone("error");
      setTrialFeedback(
        trialError instanceof Error ? trialError.message : "Não foi possível ativar o trial."
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
      setAuthNotice("");
      setLeads([]);
      setStats(null);
      setTeamOverview(null);
      setStrategistRadar(null);
      setWorkflowDrafts({});
      setLoading(false);
      setActiveView("dashboard");
    });
  }

  function navigateTo(view: ViewId) {
    setActiveView(view);

    if (typeof window !== "undefined") {
      const nextPath = INTERNAL_PAGE_PATHS[view];
      const nextUrl = `${nextPath}${window.location.search}`;

      if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
        window.history.pushState(null, "", nextUrl);
      }
    }
  }

  function focusAgentPanel() {
    navigateTo("dashboard");

    if (typeof window === "undefined") {
      return;
    }

    window.setTimeout(() => {
      const element = document.getElementById("agent-panel");

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });

        element.classList.add(
          "ring-2",
          "ring-purple-500",
          "ring-offset-2",
          "ring-offset-[#fffaf4]"
        );

        window.setTimeout(() => {
          element.classList.remove(
            "ring-2",
            "ring-purple-500",
            "ring-offset-2",
            "ring-offset-[#fffaf4]"
          );
        }, 1200);
      }
    }, 120);
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

  async function handlePasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordResetSubmitting(true);
    setPasswordResetFeedback("");

    try {
      if (passwordResetForm.password !== passwordResetForm.confirmPassword) {
        throw new Error("As passwords não coincidem.");
      }

      if (!passwordResetForm.token) {
        throw new Error("Token de recuperação em falta.");
      }

      const response = await resetPassword(passwordResetForm.token, passwordResetForm.password);
      setPasswordResetTone("success");
      setPasswordResetFeedback(response.message);
      setPasswordResetForm({ token: "", password: "", confirmPassword: "" });
      setAuthNotice("Password atualizada com sucesso. Podes entrar novamente.");
      navigatePublicPage("login");
    } catch (resetError) {
      setPasswordResetTone("error");
      setPasswordResetFeedback(
        resetError instanceof Error ? resetError.message : "Não foi possível redefinir a password."
      );
    } finally {
      setPasswordResetSubmitting(false);
    }
  }

  async function handleRequestPasswordReset() {
    if (!loginForm.email.trim()) {
      setError("Escreve o email ou telefone para receber o link de recuperação.");
      return;
    }

    setAuthSubmitting(true);
    setError("");

    try {
      const response = await requestPasswordReset(loginForm.email.trim());
      setAuthNotice(response.message);
    } catch (resetRequestError) {
      setError(
        resetRequestError instanceof Error
          ? resetRequestError.message
          : "Não foi possível pedir a recuperação."
      );
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleRequestVerificationEmail() {
    if (!loginForm.email.trim()) {
      setError("Escreve o email ou telefone para reenviar a verificação.");
      return;
    }

    setAuthSubmitting(true);
    setError("");

    try {
      const response = await requestEmailVerification(loginForm.email.trim());
      setAuthNotice(response.message);
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "Não foi possível pedir a verificação."
      );
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleConnectGoogleCalendar() {
    if (!session) {
      setError("Inicia sessão para ligar a agenda.");
      return;
    }

    setCalendarConnecting(true);
    setError("");

    try {
      const response = await getCalendarConnectUrl();
      if (typeof window !== "undefined") {
        window.location.href = response.connectUrl;
      }
    } catch (calendarError) {
      setError(
        calendarError instanceof Error
          ? calendarError.message
          : "Não foi possível abrir a ligação do calendário."
      );
      setCalendarConnecting(false);
    }
  }

  function buildImportedLeadFallback(input: CreateLeadInput) {
    const nowIso = new Date().toISOString();
    const followUpIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return {
      id: `local-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      name: input.name || "Lead importado",
      property: input.property || "Imóvel por validar",
      location: input.location || "Portugal",
      price: Number(input.price || 0),
      area: input.area ? Number(input.area) : null,
      source: input.source || "Importação CSV",
      status: "morno" as const,
      aiScore: 62,
      reasoning: "Lead importado em modo rápido. A IA recalcula prioridade após sincronização completa.",
      recommendedAction: "Validar contacto e iniciar seguimento.",
      routingBucket: "growth" as const,
      slaHours: 24,
      assignedTeam: "Equipa de crescimento",
      assignedOwner: session?.user.name || "Equipa comercial",
      officeName: session?.user.officeName || "Lisboa HQ",
      pipelineStage: "novo" as const,
      nextStep: "Validar dados e abrir primeiro contacto.",
      followUpAt: followUpIso,
      lastContactAt: null,
      strategyGoal: "Conversão",
      outreachChannel: "WhatsApp",
      outreachMessage: `Olá ${input.name || "cliente"}, partilho já os próximos passos para avançarmos com esta oportunidade.`,
      market: input.location || "Portugal",
      countryCode: input.countryCode || "PT",
      preferredLanguage: input.preferredLanguage || "pt-PT",
      currencyCode: "EUR",
      contact: input.contact,
      notes: input.notes,
      planId: session?.user.planId || activePlanId,
      planName: session?.user.planName || activePlan?.publicName || "Plano ativo",
      agentLabel: resolvedAgentLabel,
      createdAt: nowIso,
    } satisfies Lead;
  }

  async function handleImportCsvLeads(file: File) {
    setApiState("Importação CSV em curso");
    setError("");

    try {
      const content = await file.text();
      const inputs = parseCsvLeadInputs(content);

      if (!inputs.length) {
        publishWorkspaceFeedback("O ficheiro CSV não trouxe leads válidas.");
        return;
      }

      const importedLeads: Lead[] = [];

      for (const input of inputs) {
        if (canManageLeads) {
          try {
            const created = await createLead({
              ...input,
              planId: session?.user.planId || activePlanId,
            });
            importedLeads.push(created);
            continue;
          } catch {
            importedLeads.push(buildImportedLeadFallback(input));
            continue;
          }
        }

        importedLeads.push(buildImportedLeadFallback(input));
      }

      const nextLeads = [...importedLeads, ...leads];

      startTransition(() => {
        setLeads(nextLeads);
        setStats(deriveStats(nextLeads));
        setWorkflowDrafts((current) => ({
          ...current,
          ...Object.fromEntries(
            importedLeads.map((lead) => [lead.id, buildWorkflowDraftFromLead(lead)])
          ),
        }));
      });

      refreshDashboardInsights(nextLeads, false);
      publishWorkspaceFeedback(`${importedLeads.length} leads importadas do CSV.`);
      navigateTo("dashboard");
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Falha ao importar o CSV");
    } finally {
      setApiState("API online");
    }
  }

  async function handleSyncLeadsFromApi() {
    setApiState("Sincronização da API em curso");
    setError("");

    try {
      const [leadData, statsData] = await Promise.all([
        getLeads(),
        getStats().catch(() => null),
      ]);

      const nextStats = statsData || deriveStats(leadData);

      startTransition(() => {
        setLeads(leadData);
        setStats(nextStats);
        setWorkflowDrafts(
          Object.fromEntries(leadData.map((lead) => [lead.id, buildWorkflowDraftFromLead(lead)]))
        );
      });

      refreshDashboardInsights(leadData, false);
      publishWorkspaceFeedback(`${leadData.length} leads sincronizadas da API.`);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Falha ao sincronizar a API");
    } finally {
      setApiState("API online");
    }
  }

  function buildWorkflowDraftFromLead(lead: Lead): UpdateLeadWorkflowInput {
    return {
      pipelineStage: lead.pipelineStage,
      assignedOwner: lead.assignedOwner,
      nextStep: lead.nextStep,
      followUpAt: toInputDateTime(lead.followUpAt),
      lastContactAt: toInputDateTime(lead.lastContactAt),
    };
  }

  function syncUpdatedLead(updatedLead: Lead) {
    const nextLeads = leads.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead));

    startTransition(() => {
      setLeads(nextLeads);
      setStats(deriveStats(nextLeads));
      setWorkflowDrafts((current) => ({
        ...current,
        [updatedLead.id]: buildWorkflowDraftFromLead(updatedLead),
      }));
    });
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
      syncUpdatedLead(updatedLead);
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

  async function handleQuickWorkflowAction(
    lead: Lead,
    patch: UpdateLeadWorkflowInput,
    successMessage: string
  ) {
    const draft = workflowDrafts[lead.id] || buildWorkflowDraftFromLead(lead);
    setSavingLeadId(lead.id);
    setError("");

    try {
      const updatedLead = await updateLeadWorkflow(lead.id, {
        pipelineStage: patch.pipelineStage ?? draft.pipelineStage ?? lead.pipelineStage,
        assignedOwner: patch.assignedOwner ?? draft.assignedOwner ?? lead.assignedOwner,
        nextStep: patch.nextStep ?? draft.nextStep ?? lead.nextStep,
        followUpAt:
          patch.followUpAt !== undefined
            ? patch.followUpAt || null
            : draft.followUpAt || toInputDateTime(lead.followUpAt) || null,
        lastContactAt:
          patch.lastContactAt !== undefined
            ? patch.lastContactAt || null
            : draft.lastContactAt || toInputDateTime(lead.lastContactAt) || null,
      });

      syncUpdatedLead(updatedLead);
      publishWorkspaceFeedback(successMessage);
    } catch (workflowError) {
      setError(
        workflowError instanceof Error
          ? workflowError.message
          : "Falha ao executar a automação"
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
      publishWorkspaceFeedback("Não foi possível copiar agora.");
    }
  }

  function handleOpenExternal(url: string, fallbackMessage: string) {
    if (!url) {
      publishWorkspaceFeedback(fallbackMessage);
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function updateLeadStatus(leadId: string, status: Lead["status"]) {
    setLeads((current) =>
      current.map((lead) => (lead.id === leadId ? { ...lead, status } : lead))
    );
    publishWorkspaceFeedback("Estado do lead atualizado.");
  }

  function completeTask(taskId: string) {
    setCrmTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, done: true } : task))
    );
    publishWorkspaceFeedback("Tarefa concluída.");
  }

  function setFocusLead(leadId: string | null) {
    setFocusLeadId(leadId);
    if (leadId) {
      focusAgentPanel();
      publishWorkspaceFeedback("Lead em foco atualizada no cockpit.");
    }
  }

  async function moveLead(leadId: string, stage: PipelineStage) {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;

    await handleQuickWorkflowAction(
      lead,
      {
        pipelineStage: stage,
        lastContactAt: new Date().toISOString(),
      },
      "Lead movido na pipeline com sucesso."
    );
  }

  function handleLeadDragStart(event: DragEvent<HTMLElement>, leadId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/lead-id", leadId);
    setDraggingLeadId(leadId);
  }

  function handleLeadDragEnd() {
    setDraggingLeadId(null);
    setDropStageId(null);
  }

  function handleStageDragOver(event: DragEvent<HTMLElement>, stage: PipelineStage) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (dropStageId !== stage) {
      setDropStageId(stage);
    }
  }

  function handleStageDragLeave(event: DragEvent<HTMLElement>, stage: PipelineStage) {
    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
      return;
    }

    setDropStageId((current) => (current === stage ? null : current));
  }

  async function handleStageDrop(event: DragEvent<HTMLElement>, stage: PipelineStage) {
    event.preventDefault();
    const droppedLeadId = event.dataTransfer.getData("text/lead-id") || draggingLeadId;
    setDropStageId(null);

    if (!droppedLeadId) {
      setDraggingLeadId(null);
      return;
    }

    const droppedLead = leads.find((lead) => lead.id === droppedLeadId);
    if (!droppedLead) {
      setDraggingLeadId(null);
      return;
    }

    if (droppedLead.pipelineStage === stage) {
      publishWorkspaceFeedback("Lead já se encontra nesta fase.");
      setDraggingLeadId(null);
      return;
    }

    await moveLead(droppedLeadId, stage);
    setDraggingLeadId(null);
  }

  async function scheduleFollowUp(leadId: string, followUpAt: string) {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;

    await handleQuickWorkflowAction(
      lead,
      {
        followUpAt,
      },
      "Seguimento agendado com sucesso."
    );
  }

  function refreshDashboardInsights(sourceLeads: Lead[] = leads, showFeedback = true) {
    const priority = selectPriorityLead(sourceLeads);
    setAiInsights([
      priority
        ? `Lead prioritário: ${priority.name} com score IA ${priority.aiScore}.`
        : "Sem lead prioritário definido.",
      `Leads a aquecer: ${selectHeatingLeads(sourceLeads).length}. Leads a arrefecer: ${selectCoolingLeads(sourceLeads).length}.`,
      `Ação recomendada agora: ${selectRecommendedNextAction(priority)}.`,
    ]);
    if (showFeedback) {
      publishWorkspaceFeedback("Insights do dashboard atualizados.");
    }
  }

  function activateAutomation(automationId: string) {
    setCrmAutomations((current) =>
      current.map((item) => (item.id === automationId ? { ...item, status: "ativa", lastRun: "Agora" } : item))
    );
    publishWorkspaceFeedback("Automação ativada.");
  }

  function pauseAutomation(automationId: string) {
    setCrmAutomations((current) =>
      current.map((item) => (item.id === automationId ? { ...item, status: "pausada" } : item))
    );
    publishWorkspaceFeedback("Automação pausada.");
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

  function handleAdminUserDraftChange(userId: string, patch: Partial<AdminUserDraft>) {
    setAdminUserDrafts((current) => ({
      ...current,
      [userId]: {
        ...current[userId],
        ...patch,
      },
    }));
  }

  async function handleAdminUserCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdminBusy(true);
    setError("");

    try {
      const created = await createAdminUser(toAdminUserCreatePayload(newUserDraft));
      const nextUsers = [...adminUsers, created].sort((left, right) => left.name.localeCompare(right.name));

      startTransition(() => {
        setAdminUsers(nextUsers);
        setAdminUserDrafts((current) => ({
          ...current,
          [created.id]: buildAdminUserDraft(created),
        }));
        setNewUserDraft(createEmptyAdminUserDraft());
      });
    } catch (adminError) {
      setError(adminError instanceof Error ? adminError.message : "Falha ao criar utilizador");
    } finally {
      setAdminBusy(false);
    }
  }

  async function handleAdminUserSave(userId: string) {
    const draft = adminUserDrafts[userId];

    if (!draft) {
      return;
    }

    setSavingAdminUserId(userId);
    setError("");

    try {
      const updated = await updateAdminUser(userId, toAdminUserUpdatePayload(draft));
      const nextUsers = adminUsers
        .map((user) => (user.id === userId ? updated : user))
        .sort((left, right) => left.name.localeCompare(right.name));

      startTransition(() => {
        setAdminUsers(nextUsers);
        setAdminUserDrafts((current) => ({
          ...current,
          [userId]: buildAdminUserDraft(updated),
        }));
      });
    } catch (adminError) {
      setError(adminError instanceof Error ? adminError.message : "Falha ao guardar utilizador");
    } finally {
      setSavingAdminUserId("");
    }
  }

  async function handleAdminUserDelete(userId: string) {
    setSavingAdminUserId(userId);
    setError("");

    try {
      await deleteAdminUser(userId);
      const nextUsers = adminUsers.filter((user) => user.id !== userId);

      startTransition(() => {
        setAdminUsers(nextUsers);
        setAdminUserDrafts((current) => {
          const nextDrafts = { ...current };
          delete nextDrafts[userId];
          return nextDrafts;
        });
      });
    } catch (adminError) {
      setError(adminError instanceof Error ? adminError.message : "Falha ao remover utilizador");
    } finally {
      setSavingAdminUserId("");
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
  const availableOfficeNames = Array.from(
    new Set([
      ...offices.map((office) => office.name),
      ...adminUsers.map((user) => user.officeName),
      ...members.map((member) => member.officeName),
    ])
  ).sort();
  const availableTeamNames = Array.from(
    new Set([
      ...members.map((member) => member.teamName),
      ...adminUsers.map((user) => user.teamName),
    ])
  ).sort();
  const marketInsights = buildMarketInsights(leads);
  const strategistOpportunities = strategistRadar?.opportunities || [];
  const sourceMix = buildSourceMix(leads);
  const topMarket = marketInsights[0];
  const topStrategistOpportunity = strategistOpportunities[0] || null;
  const publicHotLeads = publicStats?.quente ?? 0;
  const publicTotalLeads = publicStats?.total ?? 0;
  const publicUrgent = publicStats?.urgent_actions ?? 0;
  const canAccessAdmin = session?.user.role === "admin";
  const canReassignOwners = session?.user.role !== "consultant";
  const canSwitchPlan = !session;
  const canManageLeads = session?.user.role !== "consultant";
  const activeAdminUserCount = adminUsers.filter((user) => user.isActive).length;
  const planAllowsAI = Boolean(activePlan?.advancedAI);
  const planAllowsAutoContact = Boolean(activePlan?.autoContact);
  const planAllowsMultiLocation = Boolean(activePlan?.multiLocation);
  const planAllowsMultiLanguage = Boolean(activePlan?.multiLanguage);
  const dominantSource = sourceMix[0]?.[0] || "Manual";
  const coverageLabel = activePlan?.includedMarkets.join(" · ") || "Portugal · Espanha";
  const marketingAiLabel = aiMode === "hybrid" ? "Agente IA ativo" : "Motor inteligente ativo";
  const resolvedAgentLabel = localizeAgentLabel(activePlan?.agentLabel || marketingAiLabel);
  const salesWhatsAppDemoUrl = buildSalesWhatsAppUrl(
    "Ola, quero agendar uma demonstração do ImoLead AI Pro e perceber o plano mais indicado para a minha operação."
  );
  const salesWhatsAppProposalUrl = buildSalesWhatsAppUrl(
    "Ola, quero receber uma proposta comercial do ImoLead AI Pro para a minha operação."
  );
  const hotLeadRatio =
    dashboardStats.total > 0 ? Math.round((dashboardStats.quente / dashboardStats.total) * 100) : 0;
  const routingMix = [
    { label: "Prioritária", value: dashboardStats.flagship_queue, tone: "flagship" },
    { label: "Crescimento", value: dashboardStats.growth_queue, tone: "growth" },
    { label: "Nutrição", value: dashboardStats.nurture_queue, tone: "nurture" },
  ];
  const dominantDeskLabel =
    routingMix.slice().sort((left, right) => right.value - left.value)[0]?.label || "Crescimento";
  const strategistModeLabel =
    strategistRadar?.mode === "hybrid" ? "Estrategista AI ativo" : "Estrategista heurístico";
  const strategistHeadline =
    strategistRadar?.headline ||
    (topStrategistOpportunity
      ? `${topStrategistOpportunity.location} lidera o radar com score ${topStrategistOpportunity.opportunityScore}.`
      : topMarket
        ? `${topMarket.market} lidera o radar atual.`
        : "Sem mercado lider neste momento.");
  const strategistSummary =
    strategistRadar?.summary ||
    (topStrategistOpportunity
      ? `${topStrategistOpportunity.location} concentra ${topStrategistOpportunity.totalLeads} leads, ${topStrategistOpportunity.hotLeadCount} quentes e fontes ${topStrategistOpportunity.topSources.slice(0, 2).join(" e ") || "principais"}.`
      : "Radar pronto para ler o primeiro lote de leads assim que entrarem no workspace.");
  const strategistActions =
    strategistRadar?.strategicActions?.length
      ? strategistRadar.strategicActions
      : [
          "Proteger follow-ups e owners na frente com mais urgência.",
          "Reforcar a captação nas fontes com melhor rendimento.",
          "Escalar a mesa certa consoante o plano ativo.",
        ];
  const commandSignals = [
    {
      label: "Mercado em foco",
      value: topStrategistOpportunity?.location || topMarket?.market || "Sem destaque",
      detail: topStrategistOpportunity
        ? `${topStrategistOpportunity.totalLeads} leads ativas com score ${topStrategistOpportunity.opportunityScore}`
        : topMarket
          ? `${topMarket.totalLeads} leads ativos com score médio ${topMarket.averageAiScore}`
          : "Carteira a aguardar novo sinal comercial",
    },
    {
      label: "Equipa dominante",
      value: dominantDeskLabel,
      detail: `${dashboardStats.active_teams} desks operacionais e ${dashboardStats.active_offices} lojas ativas`,
    },
    {
      label: "Cobertura atual",
      value: coverageLabel,
      detail: topStrategistOpportunity
        ? `Fontes ${topStrategistOpportunity.topSources.slice(0, 2).join(" e ") || dominantSource} com ${topStrategistOpportunity.officeCount} lojas em cobertura`
        : `Fonte lider ${dominantSource} e ${dashboardStats.european_markets} mercados em carteira`,
    },
  ];
  const landingFeatureCards = [
    {
      eyebrow: "Prospecção",
      title: "Captação e triagem com sinal comercial imediato",
      description:
        "O sistema organiza leads, calcula prioridade e separa equipas de prioridade, crescimento e nutrição sem depender de folhas dispersas.",
    },
    {
      eyebrow: "Automação",
      title: "WhatsApp, agenda e follow-up no mesmo fluxo",
      description:
        "A operação sai do modo manual e passa a trabalhar com cadência, SLA, contexto do lead e próxima melhor ação.",
    },
    {
      eyebrow: "Mercado",
      title: "Relatórios de mercado pensados para rede imobiliária",
      description:
        "Portugal primeiro, Ibéria a seguir e base pronta para equipas multi-loja com leitura por mercado, origem e owner.",
    },
    {
      eyebrow: "Governance",
      title: "Planos, equipas e agente AI controlados pelo workspace",
      description:
        "Cada plano define cobertura geográfica, profundidade do agente, mensagens e capacidade comercial do workspace.",
    },
    {
      eyebrow: "Pipeline",
      title: "Distribuição operacional por owner, loja e fase",
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
      title: "Classificação do agente",
      detail: `Score médio ${dashboardStats.average_ai_score} com roteamento para ${dominantDeskLabel}.`,
    },
    {
      step: "03",
      title: "Resposta operacional",
      detail: `${dashboardStats.urgent_actions} ações urgentes e ${dashboardStats.overdue_followups} follow-ups em atraso visíveis no cockpit.`,
    },
  ];
  const landingTestimonials = [
    {
      quote:
        "Isto não soa a CRM horizontal. Soa a operação comercial com prioridade, routing e cadência visíveis.",
      author: "Direcao Comercial",
      role: "Rede imobiliária em piloto",
    },
    {
      quote:
        "Quando a equipa ve agente, radar e follow-up no mesmo cockpit, a adesao deixa de depender de improviso.",
      author: "Gestão de Expansao",
      role: "Mesa Ibéria",
    },
    {
      quote:
        "A diferenca esta em mostrar o que a plataforma faz logo na demo, sem slides a compensar falta de produto.",
      author: "Operação / Produto",
      role: "ImoLead AI Pro",
    },
  ];
  const landingBenefitBullets = [
    "Landing comercial que transmite confiança antes do primeiro clique.",
    "Cockpit interno com leads, pipeline, equipas, mercado e ADM no mesmo workspace.",
    "Planos com agente por nível, relatórios e cobertura geográfica coerente.",
    "Arquitetura pronta para apresentar Portugal hoje e Europa como próxima fase credível.",
  ];
  const landingFaqs = [
    {
      question: "Isto e um CRM generico?",
      answer:
        "Não. É uma camada operacional para imobiliário com triagem, routing, radar de mercado e execução comercial.",
    },
    {
      question: "Serve so para Portugal?",
      answer:
        "Portugal é o mercado de entrada. A estrutura já nasce preparada para a Ibéria, idiomas e crescimento europeu.",
    },
    {
      question: "O agente AI muda por plano?",
      answer:
        "Sim. O plano define cobertura geográfica, nível do agente, relatórios e capacidade operacional entregue ao cliente.",
    },
  ];
  const planGateCopy = {
    ai: planAllowsAI ? "IA avançada ativa neste plano." : "IA avançada indisponível neste plano.",
    autoContact: planAllowsAutoContact
      ? "Auto-contacto ativo neste plano."
      : "Auto-contacto indisponível neste plano.",
    multiLocation: planAllowsMultiLocation
      ? "Multi-loja ativa neste plano."
      : "Multi-loja indisponível neste plano.",
    multiLanguage: planAllowsMultiLanguage
      ? "Multi-idioma ativo neste plano."
      : "Multi-idioma indisponível neste plano.",
  };
  const planPermissionSummary = plans
    .map((plan) => ({
      id: plan.id,
      name: plan.publicName,
      basePlanId: plan.basePlanId,
      users: plan.includedUsers,
      leads: plan.leadLimit >= 999999 ? "Ilimitado" : `${plan.leadLimit}`,
      ai: plan.advancedAI ? "Sim" : "Não",
      autoContact: plan.autoContact ? "Sim" : "Não",
      multiLocation: plan.multiLocation ? "Sim" : "Não",
      multiLanguage: plan.multiLanguage ? "Sim" : "Não",
      messages: plan.maxMessagesPerMonth >= 999999 ? "Ilimitadas" : `${plan.maxMessagesPerMonth}/mês`,
      support: plan.supportLabel,
      reports: plan.reportsLabel,
      agent: plan.agentLabel,
    }))
    .sort((left, right) => left.basePlanId.localeCompare(right.basePlanId));
  const workspacePermissionMatrix = adminUsers.map((user) => {
    const plan = plans.find((entry) => entry.basePlanId === user.planId) || activePlan || plans[0];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      emailVerifiedAt: user.emailVerifiedAt || null,
      phoneVerifiedAt: user.phoneVerifiedAt || null,
      role: user.role,
      officeName: user.officeName,
      teamName: user.teamName,
      planName: user.planName || plan?.publicName || "Sem plano",
      isActive: user.isActive,
      permissions: {
        canAdmin: user.role === "admin",
        canManagePlans: user.role === "admin",
        canManageLeads: user.role !== "consultant",
        canUseAI: Boolean(plan?.advancedAI),
        canAutoContact: Boolean(plan?.autoContact),
        canWorkMultiLocation: Boolean(plan?.multiLocation),
        canWorkMultiLanguage: Boolean(plan?.multiLanguage),
        maxLeads: plan?.leadLimit >= 999999 ? "Ilimitado" : `${plan?.leadLimit || 0}`,
        includedUsers: `${plan?.includedUsers || 0}`,
      },
    };
  });

  function getAccountVerificationLabel(user: Pick<WorkspaceUser, "emailVerifiedAt">) {
    return user.emailVerifiedAt ? "Email confirmado" : "Email pendente";
  }
  const visibleNavItems = (canAccessAdmin ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.id !== "admin")).filter(
    (item) => {
      if (!activePlan) {
        return true;
      }

      if (item.id === "automation" && !planAllowsAutoContact) {
        return false;
      }

      if (item.id === "reports" && !planAllowsAI) {
        return false;
      }

      if (item.id === "teams" && !planAllowsMultiLocation) {
        return false;
      }

      return true;
    }
  );

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

  function focusPublicAnchor(anchorId: string, inputId?: string) {
    if (typeof window === "undefined") {
      return;
    }

    window.setTimeout(() => {
      const anchorElement = document.getElementById(anchorId);
      anchorElement?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      if (inputId) {
        window.setTimeout(() => {
          const input = document.getElementById(inputId) as HTMLInputElement | null;
          input?.focus();
          input?.select?.();
        }, 80);
      }
    }, 120);
  }

  function openDirectLogin(planId: PlanType = activePlanId) {
    openLandingLogin(
      planId,
      "Entrada direta no workspace",
      "Levamos-te diretamente ao formulario de autenticação para entrar sem desvio.",
      getSuggestedDemoEntry(planId)
    );
    focusPublicAnchor("landing-login", "login-email");
  }

  function openDirectTrial(planId: PlanType = "basic") {
    setActivePlanId(planId);
    updateLandingGuidance(
      "Criação de conta com trial protegido",
      enrichGuidance(
        "Levamos-te diretamente ao formulario do trial para ativares a entrada inicial sem navegar pela landing.",
        planId
      )
    );
    navigatePublicPage("createAccount", "landing-trial");
    focusPublicAnchor("landing-trial", "trial-name");
  }

  function focusCheckoutField(inputId: string) {
    focusPublicAnchor("landing-pricing", inputId);
  }

  function handlePublicNavigation(event: MouseEvent<HTMLAnchorElement>, page: PublicPageId) {
    event.preventDefault();

    if (isAuthPage(page)) {
      openDirectLogin();
      return;
    }

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
    navigatePublicPage("login", "landing-login");
  }

  function selectDemoProfile(entry: DemoAccessEntry) {
    if (!PUBLIC_DEMO_ENABLED) {
      openLandingLogin(
        getPlanForDemoEntry(entry),
        "Demo assistida recomendada",
        "A demo pública está desativada em produção. Usa credenciais reais ou pede uma sessão assistida para percorrer o fluxo completo."
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
      setCheckoutFeedbackTitle("Dados de ativação");
      setCheckoutFeedback("Indica o nome da pessoa ou da equipa que vai ativar o plano.");
      setCheckoutFeedbackTone("error");
      setCheckoutFeedbackKind("idle");
      focusCheckoutField("checkout-name");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setCheckoutFeedbackTitle("Dados de ativação");
      setCheckoutFeedback("Indica um email valido para abrir o checkout.");
      setCheckoutFeedbackTone("error");
      setCheckoutFeedbackKind("idle");
      focusCheckoutField("checkout-email");
      return;
    }

    setCheckoutSubmittingPlanId(plan.basePlanId);
    setCheckoutFeedbackTitle("Checkout Stripe");
    setCheckoutFeedback("");
    setCheckoutFeedbackKind("progress");
    setCheckoutFeedbackTone("info");

    try {
      const result = await createPaymentCheckoutSession({
        planId: plan.basePlanId,
        billingInterval: billingMode,
        customerName: normalizedName,
        customerEmail: normalizedEmail,
      });

      setCheckoutFeedbackTitle("Checkout pronto");
      setCheckoutFeedbackTone("success");
      setCheckoutFeedback(
        `O ${plan.publicName} ficou preparado para checkout no Stripe. Estamos a redirecionar para uma subscrição segura por cartão.`
      );
      setCheckoutFeedbackKind("progress");

      if (typeof window !== "undefined") {
        window.location.assign(result.checkoutUrl);
      }
    } catch (checkoutError) {
      setCheckoutFeedbackTitle("Falha no checkout");
      setCheckoutFeedbackTone("error");
      setCheckoutFeedback(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Não foi possível abrir o checkout neste momento."
      );
      setCheckoutFeedbackKind("idle");
    } finally {
      setCheckoutSubmittingPlanId("");
    }
  }

  async function handleOpenCustomerPortal() {
    setPortalSubmitting(true);
    setCheckoutFeedbackTitle("Portal de subscrição");
    setCheckoutFeedbackTone("info");
    setCheckoutFeedbackKind("portal");
    setCheckoutFeedback("Estamos a preparar o portal seguro para veres faturas, pagamento e o plano ativo.");

    try {
      const result = await createCustomerPortalSession();

      if (typeof window !== "undefined") {
        window.location.assign(result.portalUrl);
      }
    } catch (portalError) {
      setCheckoutFeedbackTitle("Portal indisponível");
      setCheckoutFeedbackTone("error");
      setCheckoutFeedbackKind("portal");
      setCheckoutFeedback(
        portalError instanceof Error
          ? portalError.message
          : "Não foi possível abrir o portal de subscrição neste momento."
      );
    } finally {
      setPortalSubmitting(false);
    }
  }

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
  const resolvedCommunicationLabel = localizeAgentLabel(communicationLead?.agentLabel || resolvedAgentLabel);
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
  const leadsWithEmailCount = leads.filter((lead) => Boolean(extractEmailFromContact(lead.contact))).length;
  const leadsWithWhatsAppCount = leads.filter((lead) =>
    Boolean(extractPhoneFromContact(lead.contact))
  ).length;
  const automationFocusLeads = [...leads]
    .filter(
      (lead) =>
        Boolean(extractEmailFromContact(lead.contact)) ||
        Boolean(extractPhoneFromContact(lead.contact)) ||
        Boolean(lead.followUpAt)
    )
    .sort((left, right) => {
      const leftDue = left.followUpAt ? new Date(left.followUpAt).getTime() : Number.MAX_SAFE_INTEGER;
      const rightDue = right.followUpAt
        ? new Date(right.followUpAt).getTime()
        : Number.MAX_SAFE_INTEGER;

      if (leftDue !== rightDue) {
        return leftDue - rightDue;
      }

      return right.aiScore - left.aiScore;
    })
    .slice(0, 6);
  const strategistRadarHighlight =
    strategistRadar?.summary ||
    (topMarket
      ? `${topMarket.market} lidera o radar com ${topMarket.totalLeads} leads, score médio ${topMarket.averageAiScore} e ${topMarket.overdueFollowUps} follow-ups atrasados.`
      : "Radar pronto para ler o primeiro lote de leads assim que entrarem no workspace.");
  const strategistRadarSources =
    topStrategistOpportunity?.topSources?.slice(0, 3).join(" · ") ||
    dominantSource;
  const radarHighlight = topMarket
    ? `${topMarket.market} lidera o radar com ${topMarket.totalLeads} leads, score médio ${topMarket.averageAiScore} e ${topMarket.overdueFollowUps} follow-ups atrasados.`
    : "Radar pronto para ler o primeiro lote de leads assim que entrarem no workspace.";
  const topRadarSources = topMarket?.topSources?.slice(0, 3).join(" · ") || dominantSource;

  const viewMeta =
    visibleNavItems.find((item) => item.id === activeView) || visibleNavItems[0];

  const sidebarNav = [
    {
      id: "dashboard",
      label: "Dashboard",
      hint: "Cockpit",
      icon: LayoutDashboard,
      view: "dashboard" as ViewId,
    },
    {
      id: "pipeline",
      label: "Leads",
      hint: "Prioridade",
      icon: ListChecks,
      view: "pipeline" as ViewId,
    },
    {
      id: "ai-panel",
      label: "Lead prioritário",
      hint: "Agora",
      icon: Bot,
      view: "dashboard" as ViewId,
      anchor: "agent-panel",
    },
    {
      id: "automation",
      label: "Automação",
      hint: "Cadência",
      icon: Workflow,
      view: "automation" as ViewId,
    },
    {
      id: "pricing",
      label: "Planos",
      hint: "Escala",
      icon: BadgePercent,
      view: "pricing" as ViewId,
    },
  ];

  const filteredSidebarNav = sidebarNav.filter((item) => {
    if (item.id === "automation" && !planAllowsAutoContact) {
      return false;
    }

    if (item.id === "pricing" && !canSwitchPlan) {
      return false;
    }

    return true;
  });

  const secondaryNav = visibleNavItems
    .filter((item) => !["dashboard", "pipeline", "automation", "pricing"].includes(item.id))
    .map((item) => ({
      ...item,
      icon: item.id === "reports" ? BarChart3 : item.id === "teams" ? Users : ShieldCheck,
    }));

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
            {(activePlan?.agentLabel || "AI Copiloto") + " · mercados ativos: "}
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
            Localização
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
            Preço pedido
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
            área m2
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
            placeholder="Motivação do vendedor, urgência, contexto da carteira"
            rows={4}
          />
        </label>

        <button className="primary-button" type="submit" disabled={submitting || !canManageLeads}>
          {submitting
            ? "A analisar..."
            : canManageLeads
              ? "Criar e distribuir lead"
              : "Sem permissão para criar leads"}
        </button>
        {!canManageLeads ? (
          <p className="feedback">O perfil atual apenas pode consultar. Fala com um admin para criar leads.</p>
        ) : null}
      </form>
    );
  }

  function renderDashboardView() {
    return (
      <div className="page-stack">
        <section className="hero-panel shell-panel command-panel">
          <div className="hero-copy command-copy">
            <p className="eyebrow">ImoLead AI Pro Enterprise</p>
            <h2>Agente AI, radar de mercado e comunicação prontos no mesmo cockpit.</h2>
            <p className="hero-text">
              O workspace passa a mostrar quem o agente vai atacar, onde o radar esta a aquecer
              e que mensagem sai por email ou WhatsApp para a equipa agir no momento certo.
            </p>

            <div className="hero-actions hero-actions-grid">
              <div className="status-chip">{apiState}</div>
              <div className="status-chip muted">
                AI {aiMode === "hybrid" ? "externa + heurística" : "heurística"}
              </div>
              <div className="status-chip muted">
                {dashboardStats.average_ai_score} score médio AI
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
              <span>Radar estrategista</span>
              <strong>{strategistHeadline}</strong>
              <p>{strategistSummary}</p>
            </article>

            <div className="command-surface-grid">
              <article className="command-surface-card">
                <span>Estrategista</span>
                <strong>{strategistModeLabel}</strong>
                <p>{strategistActions[0] || "Sem ação sugerida nesta fase."}</p>
              </article>

              <article className="command-surface-card">
                <span>Fonte dominante</span>
                <strong>{strategistRadarSources}</strong>
                <p>Fontes que mais alimentam a frente comercial priorizada agora.</p>
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
                <strong>{resolvedCommunicationLabel}</strong>
                <p>
                  {strategistActions[1] ||
                    (activePlan
                      ? `${activePlan.publicName} com ${activePlan.reportsLabel.toLowerCase()} e cadência operacional pronta.`
                      : "Workspace pronto para ativar o agente comercial.")}
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
            <span>Equipa prioritária</span>
            <strong>{dashboardStats.flagship_queue}</strong>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="shell-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Ataque prioritário</p>
                <h3>Leads quentes a proteger</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => navigateTo("pipeline")}>
                Abrir leads
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
                    Score médio {market.averageAiScore} · ticket médio{" "}
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
    const marketRadarCards =
      strategistOpportunities.length > 0
        ? strategistOpportunities.slice(0, 3).map((opportunity) => ({
            id: `${opportunity.market}-${opportunity.location}`,
            title: opportunity.location,
            value: `Score ${opportunity.opportunityScore}`,
            detail: `${opportunity.totalLeads} leads · ticket médio ${formatCurrency(opportunity.averagePrice)}`,
            extra: `${opportunity.topSources.slice(0, 2).join(" / ") || "Manual"} · ${opportunity.demandLevel}`,
          }))
        : marketInsights.slice(0, 3).map((market) => ({
            id: market.market,
            title: market.market,
            value: `${market.totalLeads} leads`,
            detail: `Score médio ${market.averageAiScore} · ticket médio ${formatCurrency(market.averagePrice)}`,
            extra: `${market.topSources.slice(0, 2).join(" / ") || "Manual"} · ${market.officeCount} lojas`,
          }));

    const communicationMailtoFallback = `mailto:${SALES_CONTACT_EMAIL}?subject=${encodeURIComponent(
      communicationLead
        ? `Apoio operacional para ${communicationLead.name}`
        : "Apoio operacional ImoLead AI Pro"
    )}&body=${encodeURIComponent(
      communicationLead
        ? `Precisamos validar o melhor canal para ${communicationLead.name} em ${communicationLead.location}. Ação sugerida: ${communicationLead.recommendedAction}.`
        : "Preciso de apoio da equipa ImoLead AI Pro para operacionalizar a próxima ação comercial."
    )}`;

    const communicationWhatsAppFallback = buildSalesWhatsAppUrl(
      communicationLead
        ? `Ola, preciso de apoio para operacionalizar ${communicationLead.name} em ${communicationLead.location}. Ação sugerida: ${communicationLead.recommendedAction}.`
        : "Ola, preciso de apoio para operacionalizar o próximo passo comercial no cockpit."
    );

    const communicationEmailLaunchUrl = communicationEmail
      ? communicationMailto
      : communicationMailtoFallback;
    const communicationWhatsAppLaunchUrl = communicationPhone
      ? communicationWhatsAppUrl
      : communicationWhatsAppFallback;
    const agentExecutionMessage =
      communicationLead?.recommendedAction ||
      strategistActions[0] ||
      "Priorizar o primeiro contacto no canal com maior probabilidade de resposta.";
    const agentExecutionWindow = communicationLead
      ? `Executar nas próximas ${communicationLead.slaHours}h para aproveitar a janela de conversão.`
      : "Executar no próximo ciclo comercial para manter a cadência do workspace.";
    const aiConversionScore = communicationLead
      ? Math.max(communicationLead.aiScore, 42)
      : Math.max(dashboardStats.average_ai_score, 38);
    const nextActionLeadCount = automationFocusLeads.length;
    const agentDecisionSignals = [
      {
        label: "Conversão prevista",
        value: `${aiConversionScore}%`,
        detail: communicationLead
          ? `${communicationLead.name} e a melhor aposta para acelerar hoje.`
          : "A IA esta a priorizar os primeiros movimentos comerciais.",
      },
      {
        label: "Janela de contacto",
        value: communicationLead ? `${communicationLead.slaHours}h` : "Hoje",
        detail: communicationLead
          ? communicationLead.outreachChannel
          : "Ajustada por mercado, owner e urgência operacional.",
      },
      {
        label: "Ações prontas",
        value: `${nextActionLeadCount}`,
        detail: `${leadsWithEmailCount} emails e ${leadsWithWhatsAppCount} WhatsApp preparados para disparo.`,
      },
      {
        label: "Cobertura ativa",
        value: coverageLabel,
        detail: `${dashboardStats.active_offices} lojas ativas com radar e cadência ligados.`,
      },
    ];
    const executionQueue = Array.from(
      new Map(
        [...topHotLeads.slice(0, 3), ...followUpQueue.slice(0, 3)].map((lead) => [lead.id, lead])
      ).values()
    ).slice(0, 4);
    const agentPlaybooks = strategistActions.slice(0, 4);
    const agentInsightBadges = [
      activePlan?.publicName || session?.user.planName || "Workspace",
      resolvedAgentLabel,
      strategistModeLabel,
    ];
    void [
      agentExecutionMessage,
      agentExecutionWindow,
      agentDecisionSignals,
      executionQueue,
      agentPlaybooks,
      agentInsightBadges,
    ];

    return (
      <div className="page-stack dashboard-page-stack">
        <section className="shell-panel dashboard-overview-panel">
          <div className="section-head dashboard-overview-head">
            <div>
              <p className="eyebrow">Control deck</p>
              <h3>{strategistHeadline}</h3>
              <p className="dashboard-overview-copy">{strategistSummary}</p>
            </div>

            <div className="dashboard-inline-actions">
              <button className="primary-button" type="button" onClick={() => navigateTo("automation")}>
                Abrir automação
              </button>
              <button className="ghost-button" type="button" onClick={() => navigateTo("pipeline")}>
                Abrir leads
              </button>
              <button className="ghost-button" type="button" onClick={() => navigateTo("reports")}>
                Ver radar
              </button>
              {canAccessAdmin ? (
                <button className="ghost-button" type="button" onClick={() => navigateTo("admin")}>
                  Abrir ADM
                </button>
              ) : null}
            </div>
          </div>

          {workspaceFeedback ? <p className="feedback success">{workspaceFeedback}</p> : null}
          {error ? <p className="feedback error">{error}</p> : null}

          <div className="dashboard-glance-grid">
            <article className="dashboard-glance-card active">
              <span>Plano</span>
              <strong>{session?.user.planName || activePlan?.publicName || "Workspace"}</strong>
              <p>{resolvedAgentLabel}</p>
            </article>
            <article className="dashboard-glance-card">
              <span>Estado AI</span>
              <strong>{aiMode === "hybrid" ? "Hybrid" : "Heurístico"}</strong>
              <p>{dashboardStats.average_ai_score} score médio</p>
            </article>
            <article className="dashboard-glance-card">
              <span>Pipeline</span>
              <strong>{dashboardStats.total} leads</strong>
              <p>{dashboardStats.overdue_followups} follow-ups em atraso</p>
            </article>
            <article className="dashboard-glance-card">
              <span>Radar</span>
              <strong>{topStrategistOpportunity?.location || topMarket?.market || "Portugal"}</strong>
              <p>{strategistModeLabel}</p>
            </article>
            <article className="dashboard-glance-card">
              <span>Equipa dominante</span>
              <strong>{dominantDeskLabel}</strong>
              <p>{dashboardStats.active_offices} lojas ativas</p>
            </article>
          </div>

          <div className="dashboard-playbook-grid">
            {strategistActions.slice(0, 3).map((action, index) => (
              <article className="dashboard-playbook-card" key={action}>
                <span>Ação {index + 1}</span>
                <strong>{action}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-compact-grid dashboard-compact-grid-primary">
          <article className="shell-panel dashboard-priority-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Ataque prioritário</p>
                <h3>Quem merece ação já</h3>
              </div>
              <span className="status-chip muted">{topHotLeads.length} leads quentes</span>
            </div>

            {communicationLead ? (
              <article className="dashboard-priority-hero">
                <span>Lead em foco</span>
                <strong>{communicationLead.name}</strong>
                <p>
                  {communicationLead.location} · {communicationLead.officeName} · AI {communicationLead.aiScore}
                </p>
                <p>{communicationLead.recommendedAction}</p>
              </article>
            ) : (
              <p className="feedback">Sem lead prioritário nesta fase.</p>
            )}

            <div className="dashboard-lead-list">
              {topHotLeads.slice(0, 3).map((lead) => (
                <article className="dashboard-list-card" key={lead.id}>
                  <div>
                    <strong>{lead.name}</strong>
                    <p>{lead.location} · {lead.assignedOwner}</p>
                  </div>
                  <div className="dashboard-list-meta dashboard-compact-meta">
                    <span>AI {lead.aiScore}</span>
                    <span>{formatCurrency(lead.price, lead.currencyCode)}</span>
                  </div>
                </article>
              ))}
            </div>

            {communicationLead ? (
              <div className="dashboard-action-row">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() =>
                    handleOpenExternal(
                      communicationEmailLaunchUrl,
                      "Não foi possível abrir o email neste momento."
                    )
                  }
                >
                  {communicationEmail ? "Abrir email" : "Email da equipa"}
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() =>
                    handleOpenExternal(
                      communicationWhatsAppLaunchUrl,
                      "Não foi possível abrir o WhatsApp neste momento."
                    )
                  }
                >
                  {communicationPhone ? "Abrir WhatsApp" : "WhatsApp da equipa"}
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  disabled={!canManageLeads}
                  onClick={() =>
                    void handleQuickWorkflowAction(
                      communicationLead,
                      {
                        pipelineStage: "contactado",
                        nextStep: "Validar resposta e preparar qualificação",
                        lastContactAt: new Date().toISOString(),
                        followUpAt: createNextFollowUp(24),
                      },
                      "Lead marcado como contactado e follow-up preparado."
                    )
                  }
                >
                  {canManageLeads ? "Marcar contactado" : "Sem permissão"}
                </button>
              </div>
            ) : null}
          </article>

          <article className="shell-panel dashboard-radar-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Radar do mercado</p>
                <h3>Leitura curta e comercial</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => navigateTo("reports")}>
                Ver mercado
              </button>
            </div>

            <div className="dashboard-radar-list">
              {marketRadarCards.map((card) => (
                <article className="dashboard-list-card" key={card.id}>
                  <div>
                    <span>{card.title}</span>
                    <strong>{card.value}</strong>
                    <p>{card.detail}</p>
                  </div>
                  <div className="dashboard-compact-meta">
                    <span>{card.extra}</span>
                  </div>
                </article>
              ))}
            </div>

            <article className="dashboard-note-card accent">
              <span>Radar em foco</span>
              <strong>{strategistRadarSources}</strong>
              <p>{strategistRadarHighlight}</p>
            </article>
          </article>

          <article className="shell-panel dashboard-ops-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Cadência</p>
                <h3>Operação do workspace</h3>
              </div>
            </div>

            <div className="dashboard-mini-stat-grid">
              <article className="dashboard-mini-stat">
                <span>Heat</span>
                <strong>{hotLeadRatio}%</strong>
              </article>
              <article className="dashboard-mini-stat">
                <span>Fonte</span>
                <strong>{dominantSource}</strong>
              </article>
              <article className="dashboard-mini-stat">
                <span>DB</span>
                <strong>{databaseConfigured ? "Online" : "Fallback"}</strong>
              </article>
            </div>

            <div className="routing-mix dashboard-routing-compact">
              {routingMix.map((item) => (
                <div className={`routing-row ${item.tone}`} key={item.label}>
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <article className="dashboard-note-card">
              <span>Agente ativo</span>
              <strong>{resolvedCommunicationLabel}</strong>
              <p>
                {activePlan
                  ? `${activePlan.publicName} com ${activePlan.reportsLabel.toLowerCase()} e cobertura ${coverageLabel}.`
                  : "Plano ativo por definir para desbloquear a camada completa do agente."}
              </p>
            </article>
          </article>
        </section>

        <section className="dashboard-compact-grid dashboard-compact-grid-secondary">
          <article className="shell-panel dashboard-communication-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Centro de comunicação</p>
                <h3>Mensagens prontas a sair</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => navigateTo("automation")}>
                Abrir automação
              </button>
            </div>

            {planAllowsAutoContact && communicationLead ? (
              <div className="dashboard-communication-grid">
                <article className="dashboard-note-card dashboard-compact-note-card">
                  <span>Email pronto</span>
                  <strong>{communicationEmail || SALES_CONTACT_EMAIL}</strong>
                  <p>{communicationEmailBody}</p>
                  <div className="dashboard-action-row">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() =>
                        handleOpenExternal(
                          communicationEmailLaunchUrl,
                          "Não foi possível abrir o email neste momento."
                        )
                      }
                    >
                      {communicationEmail ? "Abrir email" : "Email da equipa"}
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
                </article>

                <article className="dashboard-note-card dashboard-compact-note-card">
                  <span>WhatsApp pronto</span>
                  <strong>{communicationPhone ? `+${communicationPhone}` : SALES_WHATSAPP_LABEL}</strong>
                  <p>{communicationWhatsAppBody}</p>
                  <div className="dashboard-action-row">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() =>
                        handleOpenExternal(
                          communicationWhatsAppLaunchUrl,
                          "Não foi possível abrir o WhatsApp neste momento."
                        )
                      }
                    >
                      {communicationPhone ? "Abrir WhatsApp" : "WhatsApp da equipa"}
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
                </article>
              </div>
            ) : planAllowsAutoContact ? (
              <p className="feedback">Sem leads para gerar comunicação nesta fase.</p>
            ) : (
              <p className="feedback">O plano ativo não inclui auto-contacto. Faz upgrade para desbloquear esta mesa.</p>
            )}
          </article>

          <article className="shell-panel dashboard-followup-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Agenda comercial</p>
                <h3>Proximos follow-ups</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => navigateTo("pipeline")}>
                Abrir pipeline
              </button>
            </div>

            {planAllowsMultiLocation ? (
              <div className="dashboard-followup-list">
                {followUpQueue.length === 0 ? <p className="feedback">Sem follow-ups agendados.</p> : null}
                {followUpQueue.slice(0, 4).map((lead) => (
                  <article className="dashboard-list-card" key={lead.id}>
                    <div>
                      <strong>{lead.name}</strong>
                      <p>{lead.nextStep}</p>
                    </div>
                    <div className="dashboard-list-meta dashboard-compact-meta">
                      <span>{lead.assignedOwner}</span>
                      <span>{formatDate(lead.followUpAt)}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="feedback">Este plano não inclui multi-loja para esta mesa de seguimento.</p>
            )}
          </article>

          {planAllowsAI ? (
            <article className="shell-panel dashboard-agent-panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Agente AI</p>
                  <h3>Capacidades ativas</h3>
                </div>
                <button className="ghost-button" type="button" onClick={() => navigateTo("pricing")}>
                  Ver planos
                </button>
              </div>

              <div className="dashboard-capability-list">
                {activeAgentCapabilities.length === 0 ? (
                  <article className="dashboard-note-card">
                    <span>Capacidade</span>
                    <strong>Agente em preparação</strong>
                    <p>Ativa um plano comercial para desbloquear guidance, radar e outreach.</p>
                  </article>
                ) : (
                  activeAgentCapabilities.map((capability) => (
                    <article className="dashboard-note-card" key={capability}>
                      <span>Capacidade</span>
                      <strong>{capability}</strong>
                      <p>Ligado ao plano ativo e a leitura comercial do workspace.</p>
                    </article>
                  ))
                )}
              </div>
            </article>
          ) : (
            <article className="shell-panel dashboard-agent-panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Agente AI</p>
                  <h3>Bloqueado pelo plano ativo</h3>
                </div>
                <button className="ghost-button" type="button" onClick={() => navigateTo("pricing")}>
                  Fazer upgrade
                </button>
              </div>
              <div className="dashboard-note-card">
                <span>Restrição</span>
                <strong>IA avançada indisponível</strong>
                <p>{planGateCopy.ai}</p>
              </div>
            </article>
          )}
        </section>
      </div>
    );
  }

  void renderOperationalDashboardView;
  void renderDecisionDashboardView;

  function renderDecisionDashboardView() {
    const marketRadarCards =
      strategistOpportunities.length > 0
        ? strategistOpportunities.slice(0, 3).map((opportunity) => ({
            id: `${opportunity.market}-${opportunity.location}`,
            title: opportunity.location,
            value: `Score ${opportunity.opportunityScore}`,
            detail: `${opportunity.totalLeads} leads · ticket médio ${formatCurrency(opportunity.averagePrice)}`,
            extra: `${opportunity.topSources.slice(0, 2).join(" / ") || "Manual"} · ${opportunity.demandLevel}`,
          }))
        : marketInsights.slice(0, 3).map((market) => ({
            id: market.market,
            title: market.market,
            value: `${market.totalLeads} leads`,
            detail: `Score médio ${market.averageAiScore} · ticket médio ${formatCurrency(market.averagePrice)}`,
            extra: `${market.topSources.slice(0, 2).join(" / ") || "Manual"} · ${market.officeCount} lojas`,
          }));

    const communicationMailtoFallback = `mailto:${SALES_CONTACT_EMAIL}?subject=${encodeURIComponent(
      communicationLead
        ? `Apoio operacional para ${communicationLead.name}`
        : "Apoio operacional ImoLead AI Pro"
    )}&body=${encodeURIComponent(
      communicationLead
        ? `Precisamos validar o melhor canal para ${communicationLead.name} em ${communicationLead.location}. Ação sugerida: ${communicationLead.recommendedAction}.`
        : "Preciso de apoio da equipa ImoLead AI Pro para operacionalizar a próxima ação comercial."
    )}`;

    const communicationWhatsAppFallback = buildSalesWhatsAppUrl(
      communicationLead
        ? `Ola, preciso de apoio para operacionalizar ${communicationLead.name} em ${communicationLead.location}. Ação sugerida: ${communicationLead.recommendedAction}.`
        : "Ola, preciso de apoio para operacionalizar o próximo passo comercial no cockpit."
    );

    const communicationEmailLaunchUrl = communicationEmail
      ? communicationMailto
      : communicationMailtoFallback;
    const communicationWhatsAppLaunchUrl = communicationPhone
      ? communicationWhatsAppUrl
      : communicationWhatsAppFallback;
    const agentExecutionMessage =
      communicationLead?.recommendedAction ||
      strategistActions[0] ||
      "Priorizar o primeiro contacto no canal com maior probabilidade de resposta.";
    const agentExecutionWindow = communicationLead
      ? `Executar nas próximas ${communicationLead.slaHours}h para aproveitar a janela de conversão.`
      : "Executar no próximo ciclo comercial para manter a cadência do workspace.";
    const aiConversionScore = communicationLead
      ? Math.max(communicationLead.aiScore, 42)
      : Math.max(dashboardStats.average_ai_score, 38);
    const nextActionLeadCount = automationFocusLeads.length;
    const agentDecisionSignals = [
      {
        label: "Conversão prevista",
        value: `${aiConversionScore}%`,
        detail: communicationLead
          ? `${communicationLead.name} e a melhor aposta para acelerar hoje.`
          : "A IA esta a priorizar os primeiros movimentos comerciais.",
      },
      {
        label: "Janela de contacto",
        value: communicationLead ? `${communicationLead.slaHours}h` : "Hoje",
        detail: communicationLead
          ? communicationLead.outreachChannel
          : "Ajustada por mercado, owner e urgência operacional.",
      },
      {
        label: "Ações prontas",
        value: `${nextActionLeadCount}`,
        detail: `${leadsWithEmailCount} emails e ${leadsWithWhatsAppCount} WhatsApp preparados para disparo.`,
      },
      {
        label: "Cobertura ativa",
        value: coverageLabel,
        detail: `${dashboardStats.active_offices} lojas ativas com radar e cadência ligados.`,
      },
    ];
    const executionQueue = Array.from(
      new Map(
        [...topHotLeads.slice(0, 3), ...followUpQueue.slice(0, 3)].map((lead) => [lead.id, lead])
      ).values()
    ).slice(0, 4);
    const agentPlaybooks = strategistActions.slice(0, 4);
    const agentInsightBadges = [
      activePlan?.publicName || session?.user.planName || "Workspace",
      resolvedAgentLabel,
      strategistModeLabel,
    ];
    const compactLeadQueue = executionQueue.slice(0, 3);
    const compactFollowUps = followUpQueue.slice(0, 3);
    const emailPreview = truncateText(communicationEmailBody.replace(/\s+/g, " ").trim(), 160);
    const whatsappPreview = truncateText(
      communicationWhatsAppBody.replace(/\s+/g, " ").trim(),
      144
    );

    return (
      <div className="page-stack dashboard-page-stack">
        <section className="shell-panel dashboard-ai-surface dashboard-hero-shell">
          <div className="dashboard-ai-grid">
            <article className="dashboard-ai-core">
              <div className="dashboard-ai-head">
                <div>
                  <p className="eyebrow">Agente imobiliário inteligente</p>
                  <h3>{strategistHeadline}</h3>
                  <p className="dashboard-overview-copy">{strategistSummary}</p>
                </div>
                <div className="dashboard-badge-row">
                  {agentInsightBadges.map((badge) => (
                    <span className="dashboard-glow-chip" key={badge}>
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {workspaceFeedback ? <p className="feedback success">{workspaceFeedback}</p> : null}
              {error ? <p className="feedback error">{error}</p> : null}

              <article className="dashboard-ai-command-card">
                <span>Recomendação em tempo real</span>
                <strong>{agentExecutionMessage}</strong>
                <p>{agentExecutionWindow}</p>
              </article>

              <div className="dashboard-ai-signal-grid">
                {agentDecisionSignals.map((signal) => (
                  <article className="dashboard-ai-signal-card" key={signal.label}>
                    <span>{signal.label}</span>
                    <strong>{signal.value}</strong>
                    <p>{signal.detail}</p>
                  </article>
                ))}
              </div>

              <div className="dashboard-inline-actions">
                {communicationLead ? (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() =>
                      void handleQuickWorkflowAction(
                        communicationLead,
                        {
                          pipelineStage: "contactado",
                          nextStep: "Validar resposta e preparar qualificação assistida",
                          lastContactAt: new Date().toISOString(),
                          followUpAt: createNextFollowUp(24),
                        },
                        "Ação recomendada executada com follow-up preparado."
                      )
                    }
                  >
                    Executar agora
                  </button>
                ) : null}
                <button className="ghost-button" type="button" onClick={() => navigateTo("automation")}>
                  Centro de comunicação
                </button>
                <button className="ghost-button" type="button" onClick={() => navigateTo("reports")}>
                  Abrir radar
                </button>
                <button className="ghost-button" type="button" onClick={() => navigateTo("pipeline")}>
                  Abrir leads
                </button>
                {canAccessAdmin ? (
                  <button className="ghost-button" type="button" onClick={() => navigateTo("admin")}>
                    Abrir ADM
                  </button>
                ) : null}
              </div>
            </article>

            <aside className="dashboard-ai-rail">
              <article className="dashboard-rail-card dashboard-rail-card-focus">
                <span>Lead prioritária agora</span>
                <strong>{communicationLead?.name || "Sem lead em foco"}</strong>
                <p>
                  {communicationLead
                    ? `${communicationLead.location} · ${communicationLead.officeName} · ${communicationLead.outreachChannel}`
                    : "A carteira ainda esta a aquecer e o agente assume o primeiro lote util assim que entra."}
                </p>
                <div className="dashboard-rail-metrics">
                  <div>
                    <small>AI</small>
                    <strong>{communicationLead?.aiScore || dashboardStats.average_ai_score}</strong>
                  </div>
                  <div>
                    <small>SLA</small>
                    <strong>{communicationLead ? `${communicationLead.slaHours}h` : "n/a"}</strong>
                  </div>
                  <div>
                    <small>Equipa</small>
                    <strong>{communicationLead?.routingBucket || dominantDeskLabel}</strong>
                  </div>
                </div>
              </article>

              <article className="dashboard-rail-card">
                <span>Playbook do agente</span>
                <div className="dashboard-playbook-stack">
                  {agentPlaybooks.map((action, index) => (
                    <article className="dashboard-playbook-card" key={action}>
                      <small>Ação {index + 1}</small>
                      <strong>{action}</strong>
                    </article>
                  ))}
                </div>
              </article>
            </aside>
          </div>
        </section>

        <section className="dashboard-command-grid dashboard-executive-grid">
          <article className="shell-panel dashboard-panel-compact">
            <div className="section-head">
              <div>
                <p className="eyebrow">Leads em comando</p>
                <h3>Prioridade, contexto e próxima ação</h3>
              </div>
              <span className="status-chip muted">{compactLeadQueue.length} leads em foco</span>
            </div>

            <div className="dashboard-lead-list">
              {compactLeadQueue.length === 0 ? <p className="feedback">Sem leads em foco nesta fase.</p> : null}
              {compactLeadQueue.map((lead) => (
                <article className="dashboard-list-card dashboard-compact-item" key={lead.id}>
                  <div>
                    <strong>{lead.name}</strong>
                    <p>{lead.location} · {lead.assignedOwner} · {getStageLabel(lead.pipelineStage)}</p>
                  </div>
                  <div className="dashboard-list-meta">
                    <span>AI {lead.aiScore}</span>
                    <span>{lead.slaHours}h</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="dashboard-inline-actions">
              <button className="ghost-button" type="button" onClick={() => navigateTo("pipeline")}>
                Ver todas as leads
              </button>
            </div>
          </article>

          <article className="shell-panel dashboard-panel-compact">
            <div className="section-head">
              <div>
                <p className="eyebrow">Radar do mercado</p>
                <h3>Zonas quentes e oportunidade pratica</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => navigateTo("reports")}>
                Ver mercado
              </button>
            </div>

            <div className="dashboard-radar-list">
              {marketRadarCards.map((card) => (
                <article className="dashboard-list-card dashboard-compact-item" key={card.id}>
                  <div>
                    <span>{card.title}</span>
                    <strong>{card.value}</strong>
                    <p>{card.detail}</p>
                  </div>
                  <small>{card.extra}</small>
                </article>
              ))}
            </div>

            <article className="dashboard-note-card accent">
              <span>Radar em foco</span>
              <strong>{strategistRadarSources}</strong>
              <p>{strategistRadarHighlight}</p>
            </article>
          </article>

          <article className="shell-panel dashboard-panel-compact">
            <div className="section-head">
              <div>
                <p className="eyebrow">Centro de comunicação</p>
                <h3>Email e WhatsApp sem sair do cockpit</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => navigateTo("automation")}>
                Abrir automação
              </button>
            </div>

            {communicationLead ? (
              <div className="dashboard-communication-grid">
                <article className="dashboard-note-card">
                  <span>Email pronto</span>
                  <strong>{communicationEmail || SALES_CONTACT_EMAIL}</strong>
                  <p>{emailPreview}</p>
                  <div className="dashboard-action-row">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() =>
                        handleOpenExternal(
                          communicationEmailLaunchUrl,
                          "Não foi possível abrir o email neste momento."
                        )
                      }
                    >
                      {communicationEmail ? "Abrir email" : "Email da equipa"}
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
                </article>

                <article className="dashboard-note-card">
                  <span>WhatsApp pronto</span>
                  <strong>{communicationPhone ? `+${communicationPhone}` : SALES_WHATSAPP_LABEL}</strong>
                  <p>{whatsappPreview}</p>
                  <div className="dashboard-action-row">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() =>
                        handleOpenExternal(
                          communicationWhatsAppLaunchUrl,
                          "Não foi possível abrir o WhatsApp neste momento."
                        )
                      }
                    >
                      {communicationPhone ? "Abrir WhatsApp" : "WhatsApp da equipa"}
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
                </article>
              </div>
            ) : (
              <p className="feedback">Sem leads para gerar comunicação nesta fase.</p>
            )}
          </article>

          <article className="shell-panel dashboard-panel-compact">
            <div className="section-head">
              <div>
                <p className="eyebrow">Cadência e governanca</p>
                <h3>Follow-up, desks e ritmo comercial</h3>
              </div>
            </div>

            <div className="dashboard-mini-stat-grid">
              <article className="dashboard-mini-stat">
                <span>Heat</span>
                <strong>{hotLeadRatio}%</strong>
              </article>
              <article className="dashboard-mini-stat">
                <span>Fonte</span>
                <strong>{dominantSource}</strong>
              </article>
              <article className="dashboard-mini-stat">
                <span>DB</span>
                <strong>{databaseConfigured ? "Online" : "Fallback"}</strong>
              </article>
            </div>

            <div className="routing-mix dashboard-routing-compact">
              {routingMix.map((item) => (
                <div className={`routing-row ${item.tone}`} key={item.label}>
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="dashboard-followup-list">
              {compactFollowUps.length === 0 ? <p className="feedback">Sem follow-ups agendados.</p> : null}
              {compactFollowUps.map((lead) => (
                <article className="dashboard-list-card dashboard-compact-item" key={lead.id}>
                  <div>
                    <strong>{lead.name}</strong>
                    <p>{lead.nextStep}</p>
                  </div>
                  <div className="dashboard-list-meta">
                    <span>{lead.assignedOwner}</span>
                    <span>{formatDate(lead.followUpAt)}</span>
                  </div>
                </article>
              ))}
            </div>

            <article className="dashboard-note-card">
              <span>Agente ativo</span>
              <strong>{resolvedCommunicationLabel}</strong>
              <p>
                {activePlan
                  ? `${activePlan.publicName} com ${activePlan.reportsLabel.toLowerCase()} e cobertura ${coverageLabel}.`
                  : "Plano ativo por definir para desbloquear a camada completa do agente."}
              </p>
            </article>
          </article>
        </section>
      </div>
    );
  }

  function renderAutomationView() {
    const automationCards = automationFocusLeads.slice(0, 5);
    const activeAutomationsCount = crmAutomations.filter((item) => item.status === "ativa").length;
    const pausedAutomationsCount = crmAutomations.filter((item) => item.status === "pausada").length;
    const draftAutomationsCount = crmAutomations.filter((item) => item.status === "rascunho").length;
    const automationSummary = [
      { label: "Automações ativas", value: String(activeAutomationsCount), detail: "em produção" },
      { label: "Pausadas", value: String(pausedAutomationsCount), detail: "pendentes de decisão" },
      { label: "Rascunhos", value: String(draftAutomationsCount), detail: "a validar" },
      { label: "Leads acionáveis", value: String(automationCards.length), detail: "a acompanhar" },
      { label: "Radar dominante", value: topMarket?.market || "Portugal", detail: topRadarSources },
    ];
    const automationRecommendations: Array<{
      title: string;
      objective: string;
      state: "ativa" | "pausada" | "rascunho";
      trigger: string;
      lastRun: string;
      nextStep: string;
    }> = [
      {
        title: "Follow-up automático de leads sem resposta",
        objective: "Evitar que leads quentes arrefeçam sem resposta.",
        state: "ativa",
        trigger: "24h sem resposta",
        lastRun: followUpQueue[0]?.followUpAt ? formatDate(followUpQueue[0].followUpAt) : "Sem execução recente",
        nextStep: "Rever script e confirmar resposta",
      },
      {
        title: "Alerta para leads quentes sem contacto",
        objective: "Sinalizar oportunidades críticas antes de perder timing.",
        state: "ativa",
        trigger: "Score IA elevado",
        lastRun: topHotLeads[0]?.lastContactAt ? formatDate(topHotLeads[0].lastContactAt) : "Sem execução recente",
        nextStep: "Abrir WhatsApp e agir já",
      },
      {
        title: "Envio de proposta após qualificação",
        objective: "Enviar proposta assim que o lead passa a fase certa.",
        state: "rascunho",
        trigger: "Entrada em qualificação",
        lastRun: "Ainda não executada",
        nextStep: "Validar modelo de proposta",
      },
      {
        title: "Lembrete de visita agendada",
        objective: "Reduzir faltas e reforçar presença.",
        state: "pausada",
        trigger: "Visita marcada",
        lastRun: followUpQueue[0]?.followUpAt ? formatDate(followUpQueue[0].followUpAt) : "Sem execução recente",
        nextStep: "Reativar quando houver visitas",
      },
      {
        title: "Reativação de leads frios",
        objective: "Trazer de volta oportunidades paradas.",
        state: "ativa",
        trigger: "30 dias sem contacto",
        lastRun: "Hoje",
        nextStep: "Enviar mensagem de reativação",
      },
    ];
    const recentExecutions = [
      {
        label: "Follow-up enviado",
        detail: followUpQueue[0] ? `${followUpQueue[0].name} · ${followUpQueue[0].nextStep}` : "Sem follow-up recente",
      },
      {
        label: "Lead priorizado",
        detail: topHotLeads[0] ? `${topHotLeads[0].name} · IA ${topHotLeads[0].aiScore}` : "Sem lead prioritário",
      },
      {
        label: "Pipeline sincronizada",
        detail: `${dashboardStats.total} leads monitorizadas`,
      },
    ];

    return (
      <div className="page-stack">
        <section className="hero-panel shell-panel command-panel">
          <div className="hero-copy command-copy">
            <p className="eyebrow">Workspace interno</p>
            <h2>Automações</h2>
            <p className="hero-text">
              Central operacional para follow-ups, propostas e reativações, consistente com o dashboard e a pipeline.
            </p>

            <div className="hero-actions hero-actions-grid">
              <div className="status-chip">{resolvedAgentLabel}</div>
              <div className="status-chip muted">{dashboardStats.urgent_actions} ações urgentes</div>
              <div className="status-chip muted">{followUpQueue.length} follow-ups ativos</div>
              <div className="status-chip muted">{dashboardStats.overdue_followups} em atraso</div>
            </div>
          </div>

          <div className="hero-visual command-surface">
            <article className="command-surface-card command-surface-primary">
              <span>Resumo das automações</span>
              <strong>{automationSummary.length} métricas operacionais ativas</strong>
              <p>
                {activeAgentCapabilities.length > 0
                  ? activeAgentCapabilities.join(" · ")
                  : "Fallback ativo até existirem automações conectadas ao backend."}
              </p>
            </article>

            <AutomationOverview totals={automationSummary} />
          </div>
        </section>

        {workspaceFeedback ? <p className="feedback success">{workspaceFeedback}</p> : null}

        <section className="dashboard-grid">
          <article className="shell-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Automações ativas</p>
                <h3>Fluxos prontos para produção</h3>
              </div>
              <div className="flex gap-2">
                <button className="ghost-button" type="button" onClick={() => navigateTo("dashboard")}>
                  Dashboard
                </button>
                <button className="ghost-button" type="button" onClick={() => navigateTo("pipeline")}>
                  Pipeline
                </button>
              </div>
            </div>

            <div className="automation-list">
              {automationCards.length === 0 ? (
                <EmptyState
                  title="Sem automações acionáveis"
                  description="Ainda não existem leads com trigger imediato para automação nesta conta."
                  ctaLabel="Ver pipeline"
                  onCta={() => navigateTo("pipeline")}
                />
              ) : null}

              {automationCards.map((lead) => {
                const email = extractEmailFromContact(lead.contact);
                const phone = extractPhoneFromContact(lead.contact);
                const mailto = email
                  ? `mailto:${email}?subject=${encodeURIComponent(buildLeadEmailSubject(lead))}&body=${encodeURIComponent(buildLeadEmailBody(lead))}`
                  : buildSalesSupportMailto(
                      SALES_CONTACT_EMAIL,
                      `Apoio operacional para ${lead.name}`,
                      `Precisamos operacionalizar ${lead.name} em ${lead.location}. Ação sugerida: ${lead.recommendedAction}.`
                    );
                const whatsappUrl = phone
                  ? `https://wa.me/${phone}?text=${encodeURIComponent(buildLeadWhatsAppMessage(lead))}`
                  : buildSalesWhatsAppUrl(
                      `Olá, preciso de apoio para operacionalizar ${lead.name} em ${lead.location}. Ação sugerida: ${lead.recommendedAction}.`
                    );

                return (
                  <article className="automation-card" key={lead.id}>
                    <div className="automation-card-head">
                      <div>
                        <strong>{lead.name}</strong>
                        <p>
                          {lead.location} · {lead.officeName} · {getStageLabel(lead.pipelineStage)}
                        </p>
                      </div>
                      <div className="automation-meta">
                        <span>IA {lead.aiScore}</span>
                        <span>{getBucketLabel(lead.routingBucket)}</span>
                        <span>{formatCurrency(lead.price, lead.currencyCode)}</span>
                      </div>
                    </div>

                    <p className="automation-copy">{lead.recommendedAction}</p>

                    <div className="automation-pill-row">
                      <span>Estado {lead.status}</span>
                      <span>Trigger {lead.nextStep || "pendente"}</span>
                      <span>Última execução {lead.lastContactAt ? formatDate(lead.lastContactAt) : "sem registo"}</span>
                      <span>Próximo passo {lead.followUpAt ? formatDate(lead.followUpAt) : "não agendado"}</span>
                    </div>

                    <div className="automation-action-row">
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() =>
                          handleOpenExternal(
                            mailto,
                            "Não foi possível abrir o email neste momento."
                          )
                        }
                      >
                        {email ? "Abrir email" : "Email da equipa"}
                      </button>
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() =>
                          handleOpenExternal(
                            whatsappUrl,
                            "Não foi possível abrir o WhatsApp neste momento."
                          )
                        }
                      >
                        {phone ? "Abrir WhatsApp" : "WhatsApp da equipa"}
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() =>
                          void handleCopyText(
                            lead.outreachMessage || buildLeadWhatsAppMessage(lead),
                            "Script copiado para a área de transferência."
                          )
                        }
                      >
                        Ver histórico
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        disabled={savingLeadId === lead.id || !canManageLeads}
                        onClick={() =>
                          void handleQuickWorkflowAction(
                            lead,
                            {
                              nextStep: "Follow-up automático agendado pelo cockpit",
                              followUpAt: createNextFollowUp(24),
                            },
                            "Follow-up agendado para as próximas 24h."
                          )
                        }
                      >
                        Agendar seguimento
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        disabled={savingLeadId === lead.id}
                        onClick={() =>
                          void handleQuickWorkflowAction(
                            lead,
                            {
                              pipelineStage: "contactado",
                              nextStep: "Validar resposta e preparar qualificação",
                              lastContactAt: new Date().toISOString(),
                              followUpAt: createNextFollowUp(24),
                            },
                            "Lead marcado como contactado e follow-up preparado."
                          )
                        }
                      >
                        {canManageLeads ? "Atualizar estado" : "Sem permissão"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </article>

          <article className="shell-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Recomendações da IA</p>
                <h3>O que a IA quer que faças agora</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => navigateTo("pipeline")}>
                Lead prioritário
              </button>
            </div>

            <div className="automation-list">
              {automationRecommendations.map((item) => (
                <AutomationCard
                  key={item.title}
                  name={item.title}
                  objective={item.objective}
                  status={item.state}
                  trigger={item.trigger}
                  lastRun={item.lastRun}
                  nextStep={item.nextStep}
                  primaryLabel="Editar"
                  secondaryLabel="Duplicar"
                  onPrimaryAction={() => navigateTo("pipeline")}
                  onSecondaryAction={() => navigateTo("dashboard")}
                />
              ))}
            </div>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="shell-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Últimas execuções</p>
                <h3>Registo recente do workspace</h3>
              </div>
            </div>
            <div className="space-y-3">
              {recentExecutions.map((item) => (
                <div className="dashboard-note-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.detail}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="shell-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Aprovações pendentes</p>
                <h3>Itens que precisam de decisão da equipa</h3>
              </div>
              <button className="ghost-button" type="button" onClick={() => refreshDashboardInsights()}>
                Atualizar insights
              </button>
            </div>
            <div className="space-y-3">
              {crmAutomations
                .filter((item) => item.status !== "ativa")
                .map((item) => (
                  <div className="dashboard-note-card" key={item.id}>
                    <span>{item.name}</span>
                    <strong>{item.objective}</strong>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ActionButton onClick={() => activateAutomation(item.id)}>Ativar automação</ActionButton>
                      <ActionButton onClick={() => pauseAutomation(item.id)}>Pausar automação</ActionButton>
                    </div>
                  </div>
                ))}
              {crmAutomations.filter((item) => item.status !== "ativa").length === 0 ? (
                <p className="feedback">Sem aprovações pendentes nesta fase.</p>
              ) : null}
            </div>
          </article>

          <article className="shell-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Ações rápidas</p>
                <h3>Operar sem perder contexto</h3>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="primary-button" type="button" onClick={() => navigateTo("pipeline")}>
                Criar automação
              </button>
              <button className="ghost-button" type="button" onClick={() => navigateTo("dashboard")}>
                Ver dashboard
              </button>
              <button className="ghost-button" type="button" onClick={() => navigateTo("pipeline")}>
                Ver histórico
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() =>
                  void handleCopyText(
                    automationCards[0]?.outreachMessage || "Sem script disponível.",
                    "Script copiado para a área de transferência."
                  )
                }
              >
                Editar
              </button>
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
                <p className="eyebrow">Negócios</p>
                <h3>Novo lead na pipeline</h3>
              </div>
            </div>
            {renderPipelineForm()}
          </aside>

          <section className="shell-panel board-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Pipeline</p>
                <h3>Pipeline com foco em decisão e execução</h3>
              </div>
              <div className="flex gap-2">
                <button className="ghost-button" type="button" onClick={() => navigateTo("dashboard")}>
                  Ver dashboard
                </button>
                <button className="ghost-button" type="button" onClick={() => navigateTo("automation")}>
                  Abrir automações
                </button>
              </div>
            </div>

            <div className="toolbar-grid">
              <input
                className="search-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filtrar por cidade, lead, equipa, etapa ou ação"
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
            {loading ? <LoadingSkeleton rows={4} /> : null}
            {workspaceFeedback ? <p className="feedback success">{workspaceFeedback}</p> : null}

            {!loading && visibleLeads.length === 0 ? (
              <EmptyState
                title="Sem leads para este filtro"
                description="Ajuste os filtros ou adicione novos leads para voltar a ver oportunidades nesta fase."
                ctaLabel="Criar lead"
                onCta={() => setSearch("")}
              />
            ) : null}

            <div className="kanban-board">
              {stageColumns.map((column) => (
                <section
                  className={`kanban-column${dropStageId === column.id ? " is-drop-target" : ""}`}
                  key={column.id}
                  onDragOver={(event) => handleStageDragOver(event, column.id)}
                  onDragLeave={(event) => handleStageDragLeave(event, column.id)}
                  onDrop={(event) => {
                    void handleStageDrop(event, column.id);
                  }}
                >
                  <header className="kanban-header">
                    <div>
                      <span>{column.label}</span>
                      <strong>{column.leads.length}</strong>
                    </div>
                    <small>{column.averageScore} IA média</small>
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
                        <article
                          className={`pipeline-card${draggingLeadId === lead.id ? " is-dragging" : ""}`}
                          key={lead.id}
                          draggable
                          onDragStart={(event) => handleLeadDragStart(event, lead.id)}
                          onDragEnd={handleLeadDragEnd}
                          aria-grabbed={draggingLeadId === lead.id}
                        >
                          <div className="pipeline-card-head">
                            <div>
                              <strong>{lead.name}</strong>
                              <p>{lead.property || "Carteira sem título"}</p>
                            </div>
                            <StatusBadge status={lead.status} />
                          </div>

                          <div className="pipeline-card-meta">
                            <span>{lead.location}</span>
                            <span>{formatCurrency(lead.price, lead.currencyCode)}</span>
                          </div>

                          <div className="mini-tags">
                            <ScoreBadge score={lead.aiScore} />
                            <span>{getBucketLabel(lead.routingBucket)}</span>
                            <span>{lead.officeName}</span>
                            <span>{lead.planName}</span>
                          </div>

                          <p className="pipeline-action">{lead.recommendedAction}</p>
                          <p className="pipeline-reasoning">{lead.reasoning}</p>
                          <div className="automation-pill-row">
                            <span>Momentum {getLeadMomentum(lead)}</span>
                            <span>Risco de perda {getLeadRiskLevel(lead)}</span>
                            <span>Janela ideal de contacto {getContactWindowLabel(lead.slaHours)}</span>
                            <span>Valor potencial {formatCurrency(lead.price, lead.currencyCode)}</span>
                          </div>

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
                              Próximo passo
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
                              Último contacto
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

                          <div className="automation-action-row">
                            <ActionButton onClick={() => setFocusLead(lead.id)}>Focar este lead</ActionButton>
                            <ActionButton
                              onClick={() =>
                                handleOpenExternal(
                                  extractPhoneFromContact(lead.contact)
                                    ? `https://wa.me/${extractPhoneFromContact(lead.contact)}?text=${encodeURIComponent(buildLeadWhatsAppMessage(lead))}`
                                    : buildSalesWhatsAppUrl(`Olá, preciso de apoio para ${lead.name}.`),
                                  "Não foi possível abrir o WhatsApp neste momento."
                                )
                              }
                            >
                              Abrir WhatsApp
                            </ActionButton>
                            <ActionButton
                              onClick={() =>
                                void scheduleFollowUp(lead.id, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
                              }
                            >
                              Agendar seguimento
                            </ActionButton>
                            <ActionButton onClick={() => void moveLead(lead.id, getNextPipelineStage(lead.pipelineStage))}>
                              Mover lead na pipeline
                            </ActionButton>
                            <ActionButton
                              onClick={() =>
                                updateLeadStatus(
                                  lead.id,
                                  lead.status === "quente" ? "morno" : lead.status === "morno" ? "frio" : "quente"
                                )
                              }
                            >
                              Atualizar estado
                            </ActionButton>
                            <ActionButton onClick={focusAgentPanel}>Ver lead</ActionButton>
                          </div>

                          <button
                            className="secondary-button"
                            type="button"
                            disabled={savingLeadId === lead.id || !canManageLeads}
                            onClick={() => void handleWorkflowSave(lead.id)}
                          >
                            {savingLeadId === lead.id
                              ? "A guardar..."
                              : canManageLeads
                                ? "Atualizar workflow"
                                : "Sem permissão"}
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
            <span>Línguas operacionais</span>
            <strong>{languages.length}</strong>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="shell-panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Cobertura</p>
                <h3>Mercados e línguas</h3>
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
                  <p>Distribuição real entre equipas de prioridade, crescimento e nutrição.</p>
                </div>
              </article>
              <article className="stack-item">
                <div>
                  <strong>{dashboardStats.contacted_today} leads contactados hoje</strong>
                  <p>Indicador rápido de atividade comercial diária.</p>
                </div>
              </article>
              <article className="stack-item">
                <div>
                  <strong>{dashboardStats.urgent_actions} ações urgentes</strong>
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
              <h3>Base pronta para Portugal e expansão europeia</h3>
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
            <h3>{strategistHeadline}</h3>
            <p className="hero-text">
              {strategistSummary}
            </p>
          </div>

          <div className="signal-grid">
            <article className="signal-card">
              <span>Foco imediato</span>
              <strong>
                {topStrategistOpportunity?.location || topMarket?.market || "Sem foco"}
              </strong>
              <p>{strategistActions[0] || "Sem ação prioritária neste momento."}</p>
            </article>
            <article className="signal-card">
              <span>Estrategista</span>
              <strong>{strategistModeLabel}</strong>
              <p>{strategistActions[1] || "A aguardar sinais mais fortes da carteira."}</p>
            </article>
            <article className="signal-card">
              <span>Fonte lider</span>
              <strong>{strategistRadarSources || "Sem dados"}</strong>
              <p>{strategistActions[2] || "Canal dominante na carteira atual."}</p>
            </article>
          </div>
        </section>

        <section className="report-grid">
          {strategistOpportunities.length > 0
            ? strategistOpportunities.map((opportunity) => (
                <article className="report-card" key={`${opportunity.market}-${opportunity.location}`}>
                  <span>{opportunity.location}</span>
                  <strong>Score {opportunity.opportunityScore}</strong>
                  <p>{opportunity.totalLeads} leads na frente atual</p>
                  <p>Ticket médio {formatCurrency(opportunity.averagePrice)}</p>
                  <p>{opportunity.officeCount} lojas com cobertura</p>
                  <p>{opportunity.hotLeadCount} leads quentes em prioridade</p>
                  <p>{opportunity.recommendation}</p>
                  <div className="mini-tags">
                    <span>{opportunity.market}</span>
                    <span>
                      {opportunity.demandLevel === "high"
                        ? "Procura alta"
                        : opportunity.demandLevel === "medium"
                          ? "Procura média"
                          : "Procura baixa"}
                    </span>
                    {opportunity.topSources.map((source) => (
                      <span key={source}>{source}</span>
                    ))}
                  </div>
                </article>
              ))
            : marketInsights.map((insight) => (
                <article className="report-card" key={insight.market}>
                  <span>{insight.market}</span>
                  <strong>{insight.totalLeads} leads</strong>
                  <p>Score médio {insight.averageAiScore}</p>
                  <p>Ticket médio {formatCurrency(insight.averagePrice)}</p>
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
              <p className="eyebrow">Cadência por plano</p>
              <h3>Relatórios de mercado incluídos</h3>
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
              <h3>Planos pensados para Portugal e escaláveis para Europa</h3>
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

          <div className="billing-management-panel billing-management-panel-inline">
            <div>
              <p className="eyebrow">Billing e ativação</p>
              <h3>Checkout por cartão, trial controlado e gestão de subscrição no portal seguro</h3>
              <p className="pricing-note">
                O {activePlan?.publicName || "plano ativo"} usa checkout Stripe para ativação e o
                portal de billing para faturas, método de pagamento e gestão da subscrição.
              </p>
            </div>

            <div className="billing-management-actions">
              {session ? (
                <button
                  className="ghost-button"
                  type="button"
                  disabled={portalSubmitting}
                  onClick={() => void handleOpenCustomerPortal()}
                >
                  {portalSubmitting ? "A abrir portal..." : "Gerir subscrição"}
                </button>
              ) : (
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() =>
                    openLandingLogin(
                      activePlanId,
                      "Entrada preparada para ativar o plano certo",
                      "Abrimos a entrada protegida para validares o contexto comercial antes do checkout."
                    )
                  }
                >
                  Entrar para ativar
                </button>
              )}
            </div>
          </div>

          {checkoutFeedback ? (
            <div
              data-feedback-kind={checkoutFeedbackKind}
              className={
                checkoutFeedbackTone === "success"
                  ? "form-helper success"
                  : checkoutFeedbackTone === "info"
                    ? "form-helper info"
                    : "form-helper"
              }
            >
              <strong>{checkoutFeedbackTitle}</strong>
              <span>{checkoutFeedback}</span>
            </div>
          ) : null}

          <div className="pricing-grid">
            {plans.map((plan) => {
              const isFeatured = plan.basePlanId === "pro";
              const price =
                billingMode === "month"
                  ? formatCurrency(plan.monthlyPrice)
                  : formatCurrency(plan.yearlyPrice, "EUR", true);
              const period = billingMode === "month" ? "/mês" : "/ano";
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
                    Capacidade operacional mensal, não promessa de captação garantida.
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
                            : `Começar trial de ${getTrialDaysForPlan(plan.basePlanId)} dias`
                          : plan.basePlanId === activePlanId
                            ? "Plano ativo no workspace"
                            : "Usar neste workspace"}
                    </button>
                  </div>

                  {billingMode === "year" ? (
                    <p className="pricing-note">
                      Equivale a {equivalentMonthly}/mês com desconto anual fixo de{" "}
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
                    <p className="pricing-section-title">Mercados incluídos</p>
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
          Nome público
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
            placeholder="Rede multi-loja com operação ibérica"
          />
        </label>

        <label>
          Preço mensal
          <input
            type="number"
            min="0"
            step="0.01"
            value={draft.monthlyPrice}
            onChange={(event) => onChange({ monthlyPrice: event.target.value })}
          />
        </label>

        <label>
          Preço anual
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
          Capacidade leads/mês
          <input
            type="number"
            min="0"
            value={draft.leadLimit}
            onChange={(event) => onChange({ leadLimit: event.target.value })}
          />
        </label>

        <label>
          Utilizadores incluídos
          <input
            type="number"
            min="1"
            value={draft.includedUsers}
            onChange={(event) => onChange({ includedUsers: event.target.value })}
          />
        </label>

        <label>
          Utilizador extra /mês
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
          Max messages/mês
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
          Label de relatórios
          <input
            value={draft.reportsLabel}
            onChange={(event) => onChange({ reportsLabel: event.target.value })}
            placeholder="Relatório executivo semanal"
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
            placeholder="Suporte prioritário e onboarding"
          />
        </label>

        <label className="admin-span">
          Países incluídos
          <textarea
            rows={3}
            value={draft.includedCountryCodes}
            onChange={(event) => onChange({ includedCountryCodes: event.target.value })}
            placeholder={"PT\nES\nFR"}
          />
        </label>

        <label className="admin-span">
          Mercados incluídos
          <textarea
            rows={3}
            value={draft.includedMarkets}
            onChange={(event) => onChange({ includedMarkets: event.target.value })}
            placeholder={"Portugal\nIbéria\nEuropa"}
          />
        </label>

        <label className="admin-span">
          Relatórios de mercado
          <textarea
            rows={4}
            value={draft.marketReports}
            onChange={(event) => onChange({ marketReports: event.target.value })}
            placeholder={"Relatório semanal por cidade\nRadar executivo europeu"}
          />
        </label>

        <label className="admin-span">
          Capacidades do agente
          <textarea
            rows={4}
            value={draft.agentCapabilities}
            onChange={(event) => onChange({ agentCapabilities: event.target.value })}
            placeholder={"Routing por loja\nAutomação assistida\nGovernance"}
          />
        </label>

        <label className="admin-span">
          Features
          <textarea
            rows={5}
            value={draft.features}
            onChange={(event) => onChange({ features: event.target.value })}
            placeholder={
              "Capacidade até 250 leads geridas/analisadas por mês\n7 utilizadores incluídos\nUtilizador extra: 17€/mês ou 163,20€/ano"
            }
          />
        </label>

        <div className="admin-span">
          <div className="section-head">
            <div>
              <p className="eyebrow">Permissões do plano</p>
              <h4>Altera o que este plano desbloqueia</h4>
            </div>
          </div>
          <p className="hero-text">
            Estas variáveis controlam o que cada utilizador vê e pode fazer quando está associado a
            este plano.
          </p>
        </div>

        <div className="admin-boolean-grid admin-span">
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={draft.advancedAI}
              onChange={(event) => onChange({ advancedAI: event.target.checked })}
            />
            <span>IA avançada</span>
          </label>
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={draft.autoContact}
              onChange={(event) => onChange({ autoContact: event.target.checked })}
            />
            <span>Auto-contacto</span>
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
            <span>Multi-loja</span>
          </label>
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={draft.multiLanguage}
              onChange={(event) => onChange({ multiLanguage: event.target.checked })}
            />
            <span>Multi-idioma</span>
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
            <span>Público</span>
          </label>
        </div>
      </div>
    );
  }

  function renderAdminUserFields(
    draft: AdminUserDraft,
    onChange: (patch: Partial<AdminUserDraft>) => void,
    options?: { includePassword?: boolean }
  ) {
    const includePassword = options?.includePassword !== false;

    return (
      <div className="admin-form-grid">
        <label>
          Nome
          <input
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="Nome completo"
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={draft.email}
            onChange={(event) => onChange({ email: event.target.value })}
            placeholder="equipa@agencia.pt"
          />
        </label>

        <label>
          Telefone
          <input
            type="tel"
            value={draft.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
            placeholder="+351 912 345 678"
          />
        </label>

        {includePassword ? (
          <label>
            Password
            <input
              type="text"
              value={draft.password}
              onChange={(event) => onChange({ password: event.target.value })}
              placeholder="Minimo 8 caracteres"
            />
          </label>
        ) : (
          <label>
            Nova password
            <input
              type="text"
              value={draft.password}
              onChange={(event) => onChange({ password: event.target.value })}
              placeholder="Deixa vazio para manter"
            />
          </label>
        )}

        <label>
          Perfil
          <select
            value={draft.role}
            onChange={(event) => onChange({ role: event.target.value as WorkspaceRole })}
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="consultant">Consultor</option>
          </select>
        </label>

        <label>
          Office
          <select
            value={draft.officeName}
            onChange={(event) => onChange({ officeName: event.target.value })}
          >
            {availableOfficeNames.map((officeName) => (
              <option key={officeName} value={officeName}>
                {officeName}
              </option>
            ))}
          </select>
        </label>

        <label>
          Equipa
          <select
            value={draft.teamName}
            onChange={(event) => onChange({ teamName: event.target.value })}
          >
            {availableTeamNames.map((teamName) => (
              <option key={teamName} value={teamName}>
                {teamName}
              </option>
            ))}
          </select>
        </label>

        <label>
          Idioma
          <select
            value={draft.preferredLanguage}
            onChange={(event) => onChange({ preferredLanguage: event.target.value })}
          >
            {Array.from(new Set(["pt-PT", "es-ES", "fr-FR", "it-IT", ...languages])).map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </label>

        <label>
          Plano
          <select
            value={draft.planId}
            onChange={(event) => onChange({ planId: event.target.value as PlanType })}
          >
            {plans.map((plan) => (
              <option key={plan.basePlanId} value={plan.basePlanId}>
                {plan.publicName}
              </option>
            ))}
          </select>
        </label>

        <div className="admin-boolean-grid admin-span">
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) => onChange({ isActive: event.target.checked })}
            />
            <span>{draft.isActive ? "Acesso ativo" : "Acesso bloqueado"}</span>
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
            <h3>Controlo real de planos, acessos e cobranca</h3>
            <p className="hero-text">
              Esta vista deixa de ser decorativa: aqui controlas membros, perfis, bloqueios,
              planos e o caminho para billing sem depender de ajustes no codigo.
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
              <p>Planos visíveis neste momento no pricing público.</p>
            </article>
            <article className="signal-card">
              <span>Membros ativos</span>
              <strong>{activeAdminUserCount}</strong>
              <p>Acessos atualmente libertos para operar no workspace.</p>
            </article>
            <article className="signal-card">
              <span>Billing</span>
              <strong>{portalSubmitting ? "A abrir..." : "Stripe portal"}</strong>
              <p>Método de pagamento, faturas e subscrição entram no portal seguro.</p>
            </article>
            <article className="signal-card">
              <span>Integrações</span>
              <strong>
                {[
                  adminSystemStatus?.ai ? "AI" : null,
                  adminSystemStatus?.stripe ? "Stripe" : null,
                  adminSystemStatus?.whatsapp ? "WhatsApp" : null,
                  adminSystemStatus?.googleCalendar ? "Calendar" : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "A ligar"}
              </strong>
              <p>
                Email {adminSystemStatus?.email ? "ativo" : "pendente"}, base{" "}
                {adminSystemStatus?.database ? "ativa" : "pendente"}.
              </p>
            </article>
            <article className="signal-card">
              <span>Agenda</span>
              <strong>
                {calendarConnectionStatus?.connected
                  ? "Google Calendar ligado"
                  : calendarConnectionStatus?.configured
                    ? "Pronto para ligar"
                    : "Configurar Google"}
              </strong>
              <p>
                {calendarConnectionStatus?.connected
                  ? "Seguimentos podem criar eventos automaticamente no calendário do utilizador."
                  : "Liga a agenda para o agente criar reuniões e follow-ups sem passos extra."}
              </p>
              <button
                className="secondary-button"
                type="button"
                onClick={() => void handleConnectGoogleCalendar()}
                disabled={calendarConnecting || !session}
              >
                {calendarConnecting ? "A ligar..." : "Ligar Google Calendar"}
              </button>
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

            <div className="admin-plan-actions">
              <button
                className="secondary-button"
                type="button"
                disabled={portalSubmitting}
                onClick={() => void handleOpenCustomerPortal()}
              >
                {portalSubmitting ? "A abrir portal..." : "Gerir subscrição"}
              </button>
            </div>
          </article>

          <article className="shell-panel admin-plan-card">
            <div className="section-head">
              <div>
                <p className="eyebrow">Variáveis de acesso</p>
                <h3>Permissões por plano e por utilizador</h3>
              </div>
            </div>

            <div className="signal-grid">
              {planPermissionSummary.map((plan) => (
                <article className="signal-card" key={plan.id}>
                  <span>{plan.name}</span>
                  <strong>{plan.basePlanId.toUpperCase()}</strong>
                  <p>
                    {plan.users} utilizadores · {plan.leads} leads · {plan.messages}
                  </p>
                  <p>
                    AI {plan.ai} · Auto-contacto {plan.autoContact} · Multi-loja {plan.multiLocation}
                  </p>
                  <p>
                    Multi-idioma {plan.multiLanguage} · {plan.support} · {plan.reports}
                  </p>
                  <p>Agente: {plan.agent}</p>
                </article>
              ))}
            </div>

            <div className="admin-permission-list">
              {workspacePermissionMatrix.map((user) => (
                <article className="admin-permission-card" key={user.id}>
                  <div className="admin-permission-head">
                    <div>
                      <strong>{user.name}</strong>
                      <p>{user.email}</p>
                    </div>
                    <span>{user.role.toUpperCase()}</span>
                  </div>

                  <div className="mini-tags">
                    <span>{user.planName}</span>
                    <span>{user.officeName}</span>
                    <span>{user.teamName}</span>
                    <span>{user.isActive ? "Ativo" : "Bloqueado"}</span>
                    <span className={user.emailVerifiedAt ? "status-pill success" : "status-pill muted"}>
                      {getAccountVerificationLabel(user)}
                    </span>
                    {user.phone ? <span>Telefone registado</span> : null}
                  </div>

                  <div className="admin-permission-grid">
                    <article>
                      <span>Admin</span>
                      <strong>{user.permissions.canAdmin ? "Sim" : "Não"}</strong>
                    </article>
                    <article>
                      <span>Planos</span>
                      <strong>{user.permissions.canManagePlans ? "Sim" : "Não"}</strong>
                    </article>
                    <article>
                      <span>Leads</span>
                      <strong>{user.permissions.canManageLeads ? "Sim" : "Não"}</strong>
                    </article>
                    <article>
                      <span>AI</span>
                      <strong>{user.permissions.canUseAI ? "Sim" : "Não"}</strong>
                    </article>
                    <article>
                      <span>Auto-contacto</span>
                      <strong>{user.permissions.canAutoContact ? "Sim" : "Não"}</strong>
                    </article>
                    <article>
                      <span>Multi-loja</span>
                      <strong>{user.permissions.canWorkMultiLocation ? "Sim" : "Não"}</strong>
                    </article>
                    <article>
                      <span>Multi-idioma</span>
                      <strong>{user.permissions.canWorkMultiLanguage ? "Sim" : "Não"}</strong>
                    </article>
                    <article>
                      <span>Limite leads</span>
                      <strong>{user.permissions.maxLeads}</strong>
                    </article>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <section className="admin-plan-stack">
            <article className="shell-panel admin-plan-card">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Equipa e acessos</p>
                  <h3>Criar novo membro</h3>
                </div>
              </div>

              <form className="admin-plan-form" onSubmit={handleAdminUserCreate}>
                {renderAdminUserFields(newUserDraft, (patch) =>
                  setNewUserDraft((current) => ({
                    ...current,
                    ...patch,
                  }))
                )}

                <button className="primary-button" type="submit" disabled={adminBusy}>
                  {adminBusy ? "A criar..." : "Criar membro"}
                </button>
              </form>
            </article>

            {adminUsers.map((user) => {
              const draft = adminUserDrafts[user.id] || buildAdminUserDraft(user);

              return (
                <article className="shell-panel admin-plan-card" key={user.id}>
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">{user.role.toUpperCase()}</p>
                      <h3>{user.name}</h3>
                    </div>

                  <div className="mini-tags">
                    <span>{user.officeName}</span>
                    <span>{user.teamName}</span>
                    <span>{user.isActive ? "Ativo" : "Bloqueado"}</span>
                    <span className={user.emailVerifiedAt ? "status-pill success" : "status-pill muted"}>
                      {getAccountVerificationLabel(user)}
                    </span>
                    {user.phone ? <span>Telefone registado</span> : null}
                  </div>
                  </div>

                  <div className="admin-plan-form">
                    {renderAdminUserFields(
                      draft,
                      (patch) => handleAdminUserDraftChange(user.id, patch),
                      { includePassword: false }
                    )}
                  </div>

                  <div className="admin-plan-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      disabled={savingAdminUserId === user.id}
                      onClick={() => void handleAdminUserSave(user.id)}
                    >
                      {savingAdminUserId === user.id ? "A guardar..." : "Guardar membro"}
                    </button>

                    <button
                      className="ghost-button"
                      type="button"
                      disabled={savingAdminUserId === user.id}
                      onClick={() =>
                        handleAdminUserDraftChange(user.id, {
                          isActive: !draft.isActive,
                        })
                      }
                    >
                      {draft.isActive ? "Preparar bloqueio" : "Preparar libertação"}
                    </button>

                    <button
                      className="ghost-button"
                      type="button"
                      disabled={savingAdminUserId === user.id || user.id === session?.user.id}
                      onClick={() => void handleAdminUserDelete(user.id)}
                    >
                      Remover membro
                    </button>
                  </div>
                </article>
              );
            })}

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
                      <span>{plan.isPublic ? "Público" : "Privado"}</span>
                    </div>
                  </div>

                  <div className="admin-plan-form">
                    {renderAdminPlanFields(draft, (patch) =>
                      handleAdminDraftChange(plan.id, patch)
                    )}
                  </div>

                  <div className="signal-grid">
                    <article className="signal-card">
                      <span>IA</span>
                      <strong>{draft.advancedAI ? "Ativa" : "Inativa"}</strong>
                      <p>Permite recomendações e classificação avançada.</p>
                    </article>
                    <article className="signal-card">
                      <span>Auto-contacto</span>
                      <strong>{draft.autoContact ? "Ativo" : "Inativo"}</strong>
                      <p>Permite cadências automáticas e follow-up assistido.</p>
                    </article>
                    <article className="signal-card">
                      <span>Utilizadores</span>
                      <strong>{draft.includedUsers}</strong>
                      <p>Licenças incluídas no plano ativo.</p>
                    </article>
                    <article className="signal-card">
                      <span>Limite de leads</span>
                      <strong>{draft.leadLimit}</strong>
                      <p>Capacidade comercial visível para a equipa.</p>
                    </article>
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
                  <span>Automação inteligente para profissionais imobiliários</span>
                </div>
              </div>

              <div className="marketing-nav-links">
                <a href="#landing-features">Funcionalidades</a>
                <a href="#landing-pricing">Preços</a>
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
                      "Criação de conta orientada para conversão",
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
                <p className="eyebrow">Control tower para redes imobiliárias</p>
                <h1>Automatize a prospecção imobiliária com IA.</h1>
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
                        "Demonstração preparada para impacto imediato",
                        "Levamos-te diretamente para a experiência que melhor mostra como a plataforma acelera follow-up, priorização e controlo comercial."
                      )
                    }
                  >
                    Começar agora
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() =>
                      openLandingPricing(
                        "pro",
                        "Pricing com o plano mais vendavel em foco",
                        "O Pro fica em destaque porque é o ponto certo para a maioria das equipas imobiliárias em Portugal."
                      )
                    }
                  >
                    Ver demonstração
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
                  <img src={mobileHomeHeroImg} alt="Vista mobile da home pública" />
                </div>

                <div className="marketing-float-card marketing-float-main">
                  <span>Equipa dominante</span>
                  <strong>{dominantDeskLabel}</strong>
                  <p>{dashboardStats.urgent_actions} ações urgentes sob monitorização.</p>
                </div>

                <div className="marketing-float-card marketing-float-side">
                  <span>Mercado em foco</span>
                  <strong>{topMarket?.market || "Portugal"}</strong>
                  <p>
                    {topMarket
                      ? `${topMarket.totalLeads} leads com score médio ${topMarket.averageAiScore}`
                      : "Operação pronta para captar o primeiro lote de leads."}
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
                <p className="eyebrow">Produto em ação</p>
                <h3>As telas reais sustentam a promessa comercial</h3>
              </div>
            </div>

            <div className="marketing-showcase-grid">
              <article className="marketing-showcase-card featured">
                <div className="marketing-showcase-copy">
                  <span>Funcionalidades</span>
                  <strong>Blocos claros para explicar valor sem parecer software generico</strong>
                  <p>
                    Captação, classificação, mensagens, agenda e relatórios apresentados de forma
                    simples, vendavel e orientada ao mercado.
                  </p>
                </div>
                <img src={featuresSectionImg} alt="Secao real de funcionalidades do produto" />
              </article>

              <article className="marketing-showcase-card">
                <div className="marketing-showcase-copy">
                  <span>Administração</span>
                  <strong>Painel protegido e pronto para controlo real do negócio</strong>
                  <p>Governance, acessos e operação com cara de plataforma, não de protótipo.</p>
                </div>
                <img src={adminSectionImg} alt="Entrada real do painel administrativo" />
              </article>

              <article className="marketing-showcase-card">
                <div className="marketing-showcase-copy">
                  <span>Mobile</span>
                  <strong>Experiência preparada para demonstração no telemóvel</strong>
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
                <h3>Captação, classificação, mensagens e controlo num unico sistema</h3>
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
                  <h3>Da captação ao follow-up numa experiência unica</h3>
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
                    <span>Equipa</span>
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
                  <h3>Precisamos de parecer categoria nova, não software repetido</h3>
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
                      "Já escolhemos um perfil demo compatível com este plano para reduzires atrito e entrares direto na experiência certa."
                    )
                  }
                >
                  Pedir demonstração
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() =>
                    openLandingPricing(
                      activePlanId,
                      "Rever a oferta antes de decidir",
                      "Mantemos o plano atual em foco para comparares sem perder o contexto do que já viste."
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
                const suffix = isYear ? "/ano" : "/mês";
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
                      Capacidade operacional mensal, não volume garantido de leads captadas.
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
                            `${plan.publicName} pronto para demonstração`,
                            `Preparamos o perfil demo mais adequado para mostrar como o ${plan.publicName} facilita a operação logo nos primeiros minutos.`
                          );
                        }}
                      >
                        {getTrialDaysForPlan(plan.basePlanId) > 0
                          ? plan.basePlanId === activePlanId
                            ? `Trial de ${getTrialDaysForPlan(plan.basePlanId)} dias pronto`
                            : `Começar trial de ${getTrialDaysForPlan(plan.basePlanId)} dias`
                          : plan.basePlanId === activePlanId
                            ? "Demo pronta para este plano"
                            : "Quero ver este plano em ação"}
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
              <h3>Vender isto deve parecer uma demonstração, não uma promessa vaga</h3>
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
                <p>Base pronta para Portugal agora e Europa nas próximas fases.</p>
              </article>
              <article className="marketing-final-card">
                <span>Contacto RGPD</span>
                <strong>{privacyContactEmail}</strong>
                <p>Versão de política ativa {policyVersion} com consentimento explícito no trial.</p>
              </article>
            </div>
          </section>
        </div>

        <aside className="auth-panel shell-panel marketing-auth-panel" id="landing-login">
          <div className="section-head">
            <div>
              <p className="eyebrow">Autenticação</p>
              <h3>Entrar no workspace</h3>
            </div>
          </div>

          <div className="auth-panel-note">
            <span>{PUBLIC_DEMO_ENABLED ? "Entrada guiada" : "Acesso protegido"}</span>
            <p>
              {PUBLIC_DEMO_ENABLED
                ? "Usa um dos perfis demo para validar escopo, desks, agente por plano e controlo por perfil."
                : "A demo pública fica desativada em produção. O login abaixo serve para utilizadores reais e demonstrações assistidas."}
            </p>
          </div>

          <div className="auth-guidance-card">
            <span>Próximo passo recomendado</span>
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
                    "A equipa prepara a demonstração com o plano certo, sem expor credenciais demo na frente pública."
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
                  "Voltamos a oferta mantendo o plano atual ativo para comparação imediata."
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
                reutilização do período inicial. Antes de reservar, confirmas privacidade,
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
                    dos meus dados para contacto comercial e operação do trial.
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
                    Aceito os <a href="#legal-terms">Termos de Utilização</a> e compreendo que os
                    planos representam capacidade operacional, não volume garantido de leads.
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
                  Versão de política {policyVersion}. Contacto de privacidade: {privacyContactEmail}.
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
            {authBooting ? <p className="feedback">A validar sessão existente...</p> : null}

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
              <span>Demo pública desativada</span>
              <strong>As credenciais demo não ficam expostas na frente pública.</strong>
              <p>
                Mantemos a experiência comercial ativa, mas a demonstração entra por validação
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
              <strong>Versão {policyVersion}</strong>
              <p>{compliance?.dataUseSummary || LEGAL_SECTIONS[0].summary}</p>
            </article>
            <article className="auth-legal-card">
              <span>Contacto RGPD</span>
              <strong>{privacyContactEmail}</strong>
              <p>
                Direitos de acesso, retificação, apagamento e oposição tratados por este contacto.
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
            <span>Automação inteligente para profissionais imobiliários</span>
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
          <button className="ghost-button" type="button" onClick={() => openDirectLogin()}>
            Entrar
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => openDirectTrial("basic")}
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
              O produto liga captação, triagem e resposta comercial sem depender de folhas soltas,
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
            <strong>Planos com progressão clara, trial protegido e margem para crescer</strong>
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
              {featuredPlan?.reportsLabel || "Relatórios executivos prontos para decisores."}{" "}
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
            <strong>Contacto real, linguagem clara e compliance visível antes da reuniao</strong>
          </div>

          <div className="public-stage-cluster">
            <article className="public-stage-card public-stage-card-accent">
              <span>Email ADM</span>
              <strong>carlospsantos19820@gmail.com</strong>
              <p>Conta principal para controlo total do workspace, planos e operação comercial.</p>
            </article>

            <article className="public-stage-card">
              <span>Contacto RGPD</span>
              <strong>{privacyContactEmail}</strong>
              <p>Canal ativo para privacidade, pedidos de eliminação, direitos do titular e auditoria.</p>
            </article>

            <article className="public-stage-card">
              <span>Mercados</span>
              <strong>{coverageLabel}</strong>
              <p>Portugal como entrada, Ibéria como próximo passo e base pronta para Europa.</p>
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

    if (page === "verifyEmail") {
      return (
        <div className="public-stage public-stage-login">
          <div className="public-stage-head">
            <span>Confirmação de email</span>
            <strong>Validando acesso e preparando a conta</strong>
          </div>

          <article className="public-stage-card public-stage-card-accent public-stage-card-large">
            <span>Estado atual</span>
            <strong>Se o email foi confirmado, já podes entrar na conta.</strong>
            <p>{authNotice || "A verificação é tratada automaticamente quando abres o link do email."}</p>
            <div className="public-stage-pill-row">
              <span>Email protegido</span>
              <span>Trial e login ativos</span>
            </div>
          </article>

          <div className="public-stage-cluster public-stage-cluster-compact">
            <article className="public-stage-card">
              <span>Próximo passo</span>
              <strong>Aceder ao login</strong>
              <p>Usa email ou telefone e entra na conta com o novo fluxo de acesso.</p>
            </article>
            <article className="public-stage-card">
              <span>Recuperação</span>
              <strong>Pedido de password</strong>
              <p>Se precisares, pede um link novo de recuperação pela própria app.</p>
            </article>
          </div>
        </div>
      );
    }

    if (page === "resetPassword") {
      return (
        <div className="public-stage public-stage-login">
          <div className="public-stage-head">
            <span>Nova password</span>
            <strong>Redefine o acesso com segurança</strong>
          </div>

          <article className="public-stage-card public-stage-card-accent public-stage-card-large">
            <form className="public-auth-form" onSubmit={handlePasswordReset}>
              <label className="public-form-field">
                <span>Token de recuperação</span>
                <input
                  id="reset-token"
                  value={passwordResetForm.token}
                  onChange={(event) =>
                    setPasswordResetForm((current) => ({ ...current, token: event.target.value }))
                  }
                  placeholder="Token do email"
                  autoComplete="off"
                />
              </label>

              <label className="public-form-field">
                <span>Nova password</span>
                <input
                  id="reset-password"
                  type="password"
                  value={passwordResetForm.password}
                  onChange={(event) =>
                    setPasswordResetForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Nova password"
                  autoComplete="new-password"
                />
              </label>

              <label className="public-form-field">
                <span>Confirmar password</span>
                <input
                  id="reset-password-confirm"
                  type="password"
                  value={passwordResetForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordResetForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  placeholder="Confirmar password"
                  autoComplete="new-password"
                />
              </label>

              {passwordResetFeedback ? (
                <div
                  className={`public-feedback ${
                    passwordResetTone === "success" ? "success" : passwordResetTone === "error" ? "error" : ""
                  }`}
                >
                  {passwordResetFeedback}
                </div>
              ) : null}

              <div className="public-auth-actions">
                <button className="primary-button" type="submit" disabled={passwordResetSubmitting}>
                  {passwordResetSubmitting ? "A guardar..." : "Atualizar password"}
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => navigatePublicPage("login")}
                >
                  Voltar ao login
                </button>
              </div>
            </form>
          </article>
        </div>
      );
    }

    if (page === "login") {
      return (
        <div className="public-stage public-stage-login">
          <div className="public-stage-head">
            <span>Acesso protegido</span>
            <strong>Entrar com contexto, trial controlado e demonstração assistida</strong>
          </div>

          <article className="public-stage-card public-stage-card-accent public-stage-card-large">
            <span>Workspace preparado</span>
            <strong>{featuredPlan?.publicName || "ImoLead Pro"} pronto para entrada comercial</strong>
            <p>
              O acesso abre no plano certo, com o agente certo e sem expor uma demo pública solta
              na frente comercial.
            </p>
            <div className="public-stage-pill-row">
              <span>{PUBLIC_DEMO_ENABLED ? "Demo pública ativa" : "Demo assistida"}</span>
              {activePlanTrialDays > 0 ? <span>{activePlanTrialDays} dias trial</span> : null}
              <span>{featuredPlan?.agentLabel || marketingAiLabel}</span>
            </div>
          </article>

          <div className="public-stage-cluster public-stage-cluster-compact">
            <article className="public-stage-card">
              <span>Validação</span>
              <strong>Email e telefone únicos no trial</strong>
              <p>Reduz reutilização e protege o plano de entrada antes da conversão para Pro.</p>
            </article>
            <article className="public-stage-card">
              <span>Governance</span>
              <strong>Perfis, lojas e equipas já condicionam o acesso</strong>
              <p>Admin, manager e consultant entram com contexto operacional e escopo real.</p>
            </article>
            <article className="public-stage-card">
              <span>Próxima ação</span>
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
          <strong>Menos ruído visual. Mais sinal de negócio logo na primeira dobra.</strong>
        </div>

        <article className="public-stage-card public-stage-card-accent public-stage-card-large">
          <span>Mercado em foco</span>
          <strong>{topMarket?.market || "Portugal"} lidera a operação atual</strong>
          <p>
            {topMarket
              ? `${topMarket.totalLeads} leads ativas, score médio ${topMarket.averageAiScore} e ${dashboardStats.urgent_actions} ações urgentes visíveis.`
              : publicTotalLeads > 0
                ? `${publicTotalLeads} leads ativas públicas, ${publicHotLeads} quentes, ${publicUrgent} urgentes em SLA curto.`
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
              <button
                className="whatsapp-button subtle"
                type="button"
                onClick={() =>
                  handleOpenExternal(
                    salesWhatsAppDemoUrl,
                    "Não foi possível abrir o WhatsApp comercial neste momento."
                  )
                }
              >
                Falar no WhatsApp
              </button>
            </div>

            <div className="public-hero-chips">
              <div className="status-chip">Mercado {topMarket?.market || "Portugal"}</div>
              <div className="status-chip muted">
                {publicTotalLeads > 0
                  ? `${publicTotalLeads} leads ativas · ${publicHotLeads} quentes`
                  : activePlan?.publicName || "ImoLead Pro"}
              </div>
              <div className="status-chip muted">
                {publicUrgent > 0 ? `${publicUrgent} ações urgentes hoje` : "Pronto para demo guiada"}
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
            <p className="hero-text">
              Os CTAs estão sincronizados: demo guiada para ver fluxo completo, checkout seguro para quem já decidiu.
            </p>
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
                <p className="eyebrow">Ativação imediata</p>
                <h3>Prepara o checkout Stripe com os dados certos antes de escolher o plano</h3>
              </div>
            </div>

            <div className="payment-activation-grid">
              <label>
                Nome
                <input
                  id="checkout-name"
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
                  id="checkout-email"
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
                  compatível com subscrições. Para venda imediata, o checkout robusto hoje e por
                  cartão.
                </p>

                <div className="mini-tags">
                  <span>Stripe Checkout</span>
                  <span>Subscrição segura</span>
                  <span>{billingMode === "year" ? "Modo anual ativo" : "Modo mensal ativo"}</span>
                </div>
              </div>
            </div>

            {checkoutFeedback ? (
              <div
                data-feedback-kind={checkoutFeedbackKind}
                className={
                  checkoutFeedbackTone === "success"
                    ? "form-helper success"
                    : checkoutFeedbackTone === "info"
                      ? "form-helper info"
                      : "form-helper"
                }
              >
                <strong>{checkoutFeedbackTitle}</strong>
                <span>{checkoutFeedback}</span>
              </div>
            ) : null}

            {session ? (
              <div className="billing-management-panel">
                <div>
                  <p className="eyebrow">Subscrição ativa</p>
                  <h3>Gerir pagamento, faturas e evolução do plano sem sair da operação</h3>
                  <p className="pricing-note">
                    O portal seguro da Stripe concentra método de pagamento, faturas e alterações
                    de billing. Mantemos o cockpit focado na operação e o billing no fluxo certo.
                  </p>
                </div>

                <div className="billing-management-actions">
                  <button
                    className="ghost-button"
                    type="button"
                    disabled={portalSubmitting}
                    onClick={() => void handleOpenCustomerPortal()}
                  >
                    {portalSubmitting ? "A abrir portal..." : "Gerir subscrição"}
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        ) : null}

          <div className="pricing-grid marketing-pricing-grid">
            {plans.map((plan) => {
              const isYear = billingMode === "year";
              const price = isYear ? plan.yearlyPrice : plan.monthlyPrice;
              const suffix = isYear ? "/ano" : "/mês";
              const featured = plan.basePlanId === "pro";
              const secondaryAction =
                plan.basePlanId === "custom"
                  ? () =>
                      handleOpenExternal(
                        salesWhatsAppProposalUrl,
                        "Não foi possível abrir o WhatsApp comercial neste momento."
                      )
                  : () => navigatePublicPage("pricing", "landing-pricing");
              const secondaryLabel =
                plan.basePlanId === "custom" ? "WhatsApp comercial" : "Ver checkout";
            const journeyLabel =
              plan.basePlanId === "basic"
                ? "Entrada sugerida: trial protegido com validação e caminho claro de upgrade."
                : plan.basePlanId === "pro"
                  ? "Entrada sugerida: demonstração de equipa com pipeline, owners e desks em ação."
                  : "Entrada sugerida: leitura executiva com governance, ADM e expansão multi-loja.";

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
                  {formatCurrency(plan.monthlyPrice, "EUR", plan.monthlyPrice % 1 !== 0)}/mês ou{" "}
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
                  Capacidade operacional mensal, não volume garantido de leads captadas.
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
                            `${plan.publicName} pronto para demonstração`,
                            `Preparamos o perfil demo mais adequado para mostrar como o ${plan.publicName} facilita a operação logo nos primeiros minutos.`
                          )
                    }
                  >
                    {enableCheckout
                      ? checkoutSubmittingPlanId === plan.basePlanId
                        ? "A abrir checkout..."
                        : getTrialDaysForPlan(plan.basePlanId) > 0
                          ? `Ativar com ${getTrialDaysForPlan(plan.basePlanId)} dias de trial`
                          : "Abrir checkout seguro"
                      : getTrialDaysForPlan(plan.basePlanId) > 0
                        ? plan.basePlanId === activePlanId
                          ? `Trial de ${getTrialDaysForPlan(plan.basePlanId)} dias pronto`
                          : `Começar trial de ${getTrialDaysForPlan(plan.basePlanId)} dias`
                        : plan.basePlanId === activePlanId
                          ? "Demo pronta para este plano"
                          : "Quero ver este plano em ação"}
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
              <p className="eyebrow">Sinais de valor</p>
              <h3>O que um decisor entende em menos de um minuto</h3>
            </div>
          </div>

          <div className="marketing-proof-signal-grid">
            <article className="marketing-proof-signal-card">
              <span>Radar do mercado</span>
              <strong>{topMarket?.market || "Portugal"}</strong>
              <p>{radarHighlight}</p>
            </article>
            <article className="marketing-proof-signal-card">
              <span>Agente ativo</span>
              <strong>{resolvedAgentLabel}</strong>
              <p>{activePlan?.reportsLabel || "Relatórios e guidance operacional ligados ao plano ativo."}</p>
            </article>
            <article className="marketing-proof-signal-card">
              <span>Cadência comercial</span>
              <strong>{publicUrgent || dashboardStats.urgent_actions} ações urgentes</strong>
              <p>
                {publicTotalLeads > 0
                  ? `${publicTotalLeads} leads públicas · ${publicHotLeads} quentes`
                  : `${followUpQueue.length} follow-ups ativos e prioridade por desk/owner.`}
              </p>
            </article>
          </div>

          <div className="marketing-testimonial-list compact">
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
              <p className="eyebrow">Objeções</p>
              <h3>Respostas curtas para não perder a conversa no detalhe</h3>
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
              <a className="legal-link" href={section.linkHref} target="_blank" rel="noreferrer">
                {section.linkLabel}
              </a>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderFinalCtaSection() {
    return (
      <section className="shell-panel marketing-final-cta" id="landing-contact">
        <div className="marketing-final-copy">
          <p className="eyebrow">Fecho comercial</p>
          <h3>Próximo passo claro: demo guiada ou checkout seguro.</h3>
          <p className="hero-text">
            Nada de confusão: escolhe demo executiva (ADM) ou vai direto para o checkout Stripe; os dois caminhos estão sempre visíveis.
          </p>

          <ul className="marketing-benefit-list">
            <li>Mostrar o agente certo por plano, sem esconder limites nem promessas vagas.</li>
            <li>Provar radar de mercado, desks e follow-up com contexto comercial real.</li>
            <li>Fechar a conversa com proposta, contacto direto e compliance visível.</li>
          </ul>

          <div className="marketing-final-actions">
            <button
              className="whatsapp-button"
              type="button"
              onClick={() =>
                handleOpenExternal(
                  salesWhatsAppDemoUrl,
                  "Não foi possível abrir o WhatsApp comercial neste momento."
                )
              }
            >
              Falar no WhatsApp
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                openLandingLogin(
                  "custom",
                  "Demo enterprise preparada para decisores",
                  "Abrimos a conta ADM para mostrares governance, automação, planos e leitura executiva."
                )
              }
            >
              Abrir demo executiva
            </button>
          </div>

          <div className="legal-links-row">
            <a href="#legal-terms">Termos de Utilização</a>
            <a href="#legal-privacy">Política de Privacidade</a>
            <a href="#legal-security">Segurança &amp; RGPD</a>
          </div>
        </div>

        <div className="marketing-final-grid">
          <article className="marketing-final-card">
            <span>WhatsApp comercial</span>
            <strong>{SALES_WHATSAPP_LABEL}</strong>
            <p>Canal mais rápido para demo, proposta e alinhamento comercial sem atrito.</p>
          </article>
          <article className="marketing-final-card">
            <span>Contacto comercial</span>
            <strong>{SALES_CONTACT_EMAIL}</strong>
            <p>Canal direto para demonstração executiva, proposta e configuração enterprise.</p>
          </article>
          <article className="marketing-final-card">
            <span>Plano em foco</span>
            <strong>{activePlan?.publicName || "ImoLead Pro"}</strong>
            <p>{resolvedAgentLabel} com progressão clara para Enterprise.</p>
          </article>
          <article className="marketing-final-card">
            <span>Mercados</span>
            <strong>{coverageLabel}</strong>
            <p>Portugal como entrada, Ibéria como expansão natural e Europa como próximo passo.</p>
          </article>
          <article className="marketing-final-card">
            <span>Compliance</span>
            <strong>{privacyContactEmail}</strong>
            <p>Politica {policyVersion} com trial protegido, consentimento explicito e contacto RGPD.</p>
          </article>
        </div>
      </section>
    );
  }

  function renderLoginEntryHero() {
    const featuredPlan = activePlan || plans.find((plan) => plan.basePlanId === "pro") || plans[0] || null;
    const isCreateAccountView = publicPage === "createAccount";

    return (
      <section className="shell-panel public-login-intro">
        {renderPublicNav()}

        <div className="public-login-intro-grid">
          <div className="public-login-copy">
            <p className="eyebrow">Acesso protegido</p>
            <h1>{isCreateAccountView ? "Criar conta — trial gratuito de 15 dias." : "Entrar no workspace com acesso protegido."}</h1>
            <p className="public-login-lead">
              {isCreateAccountView
                ? "Preencha o formulário, confirme os consentimentos e reserve o trial protegido."
                : "Use os seus dados para entrar e continuar a operar sem desvio."}
            </p>
            <p className="hero-text">
              {isCreateAccountView
                ? "O trial fica limitado a 1 email e 1 telefone."
                : "A demonstração pública fica fechada. Esta entrada serve contas reais e sessões assistidas."}
            </p>

            <div className="marketing-cta-row">
              <button
                className="primary-button"
                type="button"
                onClick={() => navigatePublicPage(isCreateAccountView ? "login" : "createAccount")}
              >
                {isCreateAccountView ? "Já tem conta? Entrar" : "Criar conta"}
              </button>
              <button
                className="whatsapp-button"
                type="button"
                onClick={() =>
                  handleOpenExternal(
                    salesWhatsAppDemoUrl,
                    "Não foi possível abrir o WhatsApp comercial neste momento."
                  )
                }
              >
                Falar no WhatsApp
              </button>
            </div>

            <div className="public-hero-chips">
              <div className="status-chip">{activePlan?.publicName || "ImoLead Pro"}</div>
              <div className="status-chip muted">
                {isCreateAccountView ? "Trial gratuito" : PUBLIC_DEMO_ENABLED ? "Demo pública ativa" : "Demo assistida"}
              </div>
              <div className="status-chip muted">{featuredPlan?.agentLabel || marketingAiLabel}</div>
            </div>
          </div>

          <div className="public-login-stage-panel">
            <article className="public-login-stage-card public-login-stage-card-wide">
              <span>Contexto ativo</span>
              <strong>{activePlan?.publicName || "ImoLead Pro"} com {featuredPlan?.agentLabel || marketingAiLabel}</strong>
              <p>
                O acesso fica ligado ao plano, ao agente e ao mercado certos. A entrada deixa de
                parecer técnica e passa a parecer parte da venda.
              </p>
              <div className="mini-tags">
                <span>{coverageLabel}</span>
                {activePlanTrialDays > 0 ? <span>{activePlanTrialDays} dias trial</span> : <span>Checkout imediato</span>}
                <span>{featuredPlan?.agentLabel || marketingAiLabel}</span>
              </div>
            </article>

            <div className="public-login-stage-grid">
              <article className="public-login-stage-card">
                <span>Trial protegido</span>
                <strong>Email e telefone únicos controlam a oferta inicial</strong>
                <p>Reduz abuso, filtra curiosos e mantém o Starter credível antes da subida para Pro.</p>
              </article>

              <article className="public-login-stage-card">
                <span>Perfis e desks</span>
                <strong>Admin, manager e consultant entram com escopo real</strong>
                <p>O acesso respeita carteira, loja e equipa sem transformar a demonstração em caos.</p>
              </article>

              <article className="public-login-stage-card">
                <span>Próximo passo</span>
                <strong>{landingGuidance.title}</strong>
                <p>{landingGuidance.detail}</p>
              </article>

              <article className="public-login-stage-card">
                <span>Contacto comercial</span>
                <strong>{SALES_WHATSAPP_LABEL}</strong>
                <p>{SALES_CONTACT_EMAIL} para proposta, demonstração assistida e ativação enterprise.</p>
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
            <p className="eyebrow">Autenticação</p>
            <h3>Entrar no workspace</h3>
          </div>
        </div>

        <div className="auth-panel-note">
          <span>{PUBLIC_DEMO_ENABLED ? "Entrada guiada" : "Acesso protegido"}</span>
          <p>
            {PUBLIC_DEMO_ENABLED
              ? "Usa um dos perfis demo para validar escopo, desks, agente por plano e controlo por perfil."
              : "A demo pública fica desativada em produção. O login abaixo serve para utilizadores reais e demonstrações assistidas."}
          </p>
        </div>

        <div className="auth-guidance-card">
          <span>Plano ativo</span>
          <strong>{activePlan?.publicName || "ImoLead Pro"} selecionado para este acesso</strong>
          <p>{landingGuidance.detail}</p>

          <div className="mini-tags">
            <span>{activePlan?.publicName || "ImoLead Pro"}</span>
            {activePlanTrialDays > 0 ? <span>{activePlanTrialDays} dias trial</span> : null}
            <span>{resolvedAgentLabel}</span>
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
              className="whatsapp-button"
              type="button"
              onClick={() =>
                handleOpenExternal(
                  salesWhatsAppDemoUrl,
                  "Não foi possível abrir o WhatsApp comercial neste momento."
                )
              }
            >
              Falar no WhatsApp
            </button>
          )}
          <button
            className="ghost-button"
            type="button"
            onClick={() =>
              openLandingPricing(
                activePlanId,
                "Revisao rapida do plano selecionado",
                "Voltamos a oferta mantendo o plano atual ativo para comparação imediata."
              )
            }
          >
            Rever planos
          </button>
        </div>

        <form className="lead-form auth-form" onSubmit={handleLogin}>
          <label>
            Email ou telefone
            <input
              id="login-email"
              type="text"
              value={loginForm.email}
              onChange={(event) =>
                setLoginForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder={PUBLIC_DEMO_ENABLED ? DEMO_ACCESS[0].email : "equipa@agencia.pt ou +351..."}
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
          {authBooting ? <p className="feedback">A validar sessão existente...</p> : null}
          {authNotice ? <p className="feedback success">{authNotice}</p> : null}

          <button className="primary-button" type="submit" disabled={authSubmitting || authBooting}>
            {authSubmitting ? "A entrar..." : "Entrar no workspace"}
          </button>

          <div className="auth-helper-actions auth-helper-actions-stack">
            <button
              className="ghost-button"
              type="button"
              onClick={handleRequestPasswordReset}
              disabled={authSubmitting || authBooting}
            >
              Esqueci a password
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={handleRequestVerificationEmail}
              disabled={authSubmitting || authBooting}
            >
              Reenviar verificação
            </button>
          </div>
        </form>

        {activePlanTrialDays > 0 ? (
          <section className="trial-card" id="landing-trial">
            <div className="section-head">
              <div>
                <p className="eyebrow">Trial protegido</p>
                <h3>Ativar 15 dias no Starter</h3>
              </div>
            </div>

            <p className="trial-copy">
              O trial fica limitado a um unico email e um unico telefone, para evitar reutilização
              do período inicial. Antes de reservar, confirmas privacidade, termos e uso de IA.
            </p>

            <form className="lead-form trial-form" onSubmit={handleTrialRequest}>
              <label>
                Nome
                <input
                  id="trial-name"
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
                  e o tratamento dos meus dados para contacto comercial e operação do trial.
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
                    Termos de Utilização
                  </a>{" "}
                  e compreendo que os planos representam capacidade operacional, não volume garantido
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
                Versão de política {policyVersion}. Contacto de privacidade: {privacyContactEmail}.
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
            <span>Demo pública desativada</span>
            <strong>As credenciais demo não ficam expostas na frente pública.</strong>
            <p>
              Mantemos a experiência comercial ativa, mas a demonstração entra por validação humana
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
            <strong>Versão {policyVersion}</strong>
            <p>{compliance?.dataUseSummary || LEGAL_SECTIONS[0].summary}</p>
          </article>
          <article className="auth-legal-card">
            <span>Contacto RGPD</span>
            <strong>{privacyContactEmail}</strong>
            <p>Direitos de acesso, retificação, apagamento e oposição tratados por este contacto.</p>
          </article>
        </div>
      </aside>
    );
  }

  function renderHomePage() {
    const homeHighlights = landingFeatureCards.slice(0, 3);
    const homeSignals = [
      {
        label: "Mercado em foco",
        value: topMarket?.market || "Portugal",
        detail: topMarket
          ? `${topMarket.totalLeads} leads ativas e score médio ${topMarket.averageAiScore}.`
          : "Entrada comercial pronta para captar o primeiro lote de leads.",
      },
      {
        label: "Automação",
        value: `${followUpQueue.length} follow-ups`,
        detail:
          followUpQueue.length > 0
            ? "Cadência preparada com prioridade e próxima ação visível."
            : "Cadência pronta para disparar a partir da primeira entrada.",
      },
      {
        label: "Cobertura",
        value: coverageLabel,
        detail: "Portugal como base, com estrutura preparada para crescer sem recomeçar.",
      },
    ];

    return (
      <>
        <section className="public-home-hero">
          {renderPublicNav()}

          <div className="public-home-hero-grid">
            <div className="public-home-copy">
              <p className="eyebrow">Automação inteligente para imobiliário em Portugal</p>
              <h1>Automatize a prospeção imobiliária com IA.</h1>
              <p className="hero-text">
                O ImoLead AI Pro encontra, qualifica e organiza leads com mais velocidade, mais
                contexto e menos trabalho manual para a equipa comercial.
              </p>

              <div className="marketing-cta-row">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() =>
                    openLandingLogin(
                      "pro",
                      "Demonstração preparada para impacto imediato",
                      "Levamos-te diretamente para a experiência que melhor mostra como a plataforma acelera follow-up, priorização e controlo comercial."
                    )
                  }
                >
                  Começar agora
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => navigatePublicPage("features")}
                >
                  Ver funcionalidades
                </button>
                <button
                  className="whatsapp-button subtle"
                  type="button"
                  onClick={() =>
                    handleOpenExternal(
                      salesWhatsAppDemoUrl,
                      "Não foi possível abrir o WhatsApp comercial neste momento."
                    )
                  }
                >
                  Falar no WhatsApp
                </button>
              </div>

              <div className="public-home-chips">
                <div className="status-chip">Mercado {topMarket?.market || "Portugal"}</div>
                <div className="status-chip muted">
                  {publicTotalLeads > 0
                    ? `${publicTotalLeads} leads ativas · ${publicHotLeads} quentes`
                    : activePlan?.publicName || "ImoLead Pro"}
                </div>
                <div className="status-chip muted">
                  {publicUrgent > 0 ? `${publicUrgent} ações urgentes hoje` : "Pronto para demo guiada"}
                </div>
              </div>
            </div>

            <aside className="public-home-summary">
              <article className="public-home-summary-card public-home-summary-card-featured">
                <span>Entrada comercial viva</span>
                <strong>{topMarket?.market || "Portugal"} lidera a operação atual</strong>
                <p>
                  {topMarket
                    ? `${topMarket.totalLeads} leads ativas, score médio ${topMarket.averageAiScore} e ${dashboardStats.urgent_actions} ações urgentes visíveis.`
                    : publicTotalLeads > 0
                      ? `${publicTotalLeads} leads ativas públicas, ${publicHotLeads} quentes e ${publicUrgent} urgentes em SLA curto.`
                      : "Workspace pronto para captar, classificar e distribuir o primeiro lote de leads com critério comercial."}
                </p>

                <div className="mini-tags">
                  <span>{coverageLabel}</span>
                  <span>{activePlan?.publicName || "ImoLead Pro"}</span>
                  <span>{resolvedAgentLabel}</span>
                </div>
              </article>

              <div className="public-home-summary-grid">
                {homeSignals.map((signal) => (
                  <article className="public-home-summary-tile" key={signal.label}>
                    <span>{signal.label}</span>
                    <strong>{signal.value}</strong>
                    <p>{signal.detail}</p>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="marketing-section public-home-highlights">
          <div className="section-head">
            <div>
              <p className="eyebrow">O essencial</p>
              <h3>Menos ruído na primeira dobra. Mais clareza para vender.</h3>
            </div>
          </div>

          <div className="marketing-feature-grid home-feature-grid">
            {homeHighlights.map((feature) => (
              <article className="marketing-feature-card" key={feature.title}>
                <span>{feature.eyebrow}</span>
                <strong>{feature.title}</strong>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-section public-home-proof">
          <article className="shell-panel marketing-results-copy">
            <div className="section-head">
              <div>
                <p className="eyebrow">Sinal de valor</p>
                <h3>O que o cliente percebe antes de falar com a equipa</h3>
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
                    "Entrar agora e ver o ganho de tempo na prática",
                    "Já escolhemos um perfil demo compatível com este plano para reduzires atrito e entrares direto na experiência certa."
                  )
                }
              >
                Pedir demonstração
              </button>
              <button className="ghost-button" type="button" onClick={() => navigatePublicPage("pricing")}>
                Rever oferta
              </button>
              <button
                className="whatsapp-button"
                type="button"
                onClick={() =>
                  handleOpenExternal(
                    salesWhatsAppDemoUrl,
                    "Não foi possível abrir o WhatsApp comercial neste momento."
                  )
                }
              >
                WhatsApp comercial
              </button>
            </div>
          </article>
        </section>

        {renderFinalCtaSection()}
        {renderLegalSection()}
      </>
    );
  }

  function renderFeaturesPage() {
    return (
      <>
        {renderPageHero({
          eyebrow: "Tudo o que precisa para automatizar",
          title: "Captação, classificação, mensagens e controlo num unico sistema.",
          text:
            "Hero mostra prova viva (leads ativas, SLA, mercados). CTA principal = demo guiada; CTA secundario = rever planos.",
          stage: "features",
          primaryLabel: "Ver planos",
          secondaryLabel: "Pedir demo",
          onPrimaryClick: () =>
            openLandingPricing(
              "pro",
              "Oferta comercial pronta para comparação",
              "A pagina de precos abre com o plano Pro em foco para uma leitura mais rapida."
            ),
          onSecondaryClick: () =>
            openLandingLogin(
              "pro",
              "Demonstração orientada ao valor do produto",
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
                <h3>Da captação ao follow-up numa experiência unica</h3>
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
                  <span>Equipa</span>
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
          eyebrow: "Planos transparentes e flexíveis",
          title: "Starter para testar, Pro para escalar, Enterprise para governar.",
          text:
            "CTA primário abre demo guiada no plano selecionado; CTA secundário abre checkout seguro ou WhatsApp para Enterprise.",
          stage: "pricing",
          primaryLabel: "Ver demo guiada",
          secondaryLabel: "Checkout seguro",
          onPrimaryClick: () =>
            openLandingLogin(
              activePlanId,
              "Plano atual pronto para demonstração",
              "Abrimos a pagina de entrada com o plano selecionado e a guidance certa."
            ),
          onSecondaryClick: () =>
            navigatePublicPage("pricing", "landing-pricing"),
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
          title: "Fechar a conversa com contacto real, governance e politicas visíveis.",
          text:
            "Esta pagina concentra fecho comercial, contacto RGPD, oferta enterprise e os documentos que sustentam a operação pública.",
          stage: "contact",
          primaryLabel: "Falar no WhatsApp",
          secondaryLabel: "Abrir demo enterprise",
          onPrimaryClick: () =>
            handleOpenExternal(
              salesWhatsAppDemoUrl,
              "Não foi possível abrir o WhatsApp comercial neste momento."
            ),
          onSecondaryClick: () =>
            openLandingLogin(
              "custom",
              "Demo enterprise preparada para impressionar decisores",
              "Mostramos governance, planos, equipas e leitura executiva com a conta ADM."
            ),
        })}
        <section className="marketing-section public-contact-grid">
          <article className="public-contact-card public-contact-card-featured">
            <span>WhatsApp comercial</span>
            <strong>{SALES_WHATSAPP_LABEL}</strong>
            <p>Canal rápido para marcar demo, alinhar proposta e acelerar a conversa comercial.</p>
          </article>
          <article className="public-contact-card">
            <span>Contacto comercial</span>
            <strong>{SALES_CONTACT_EMAIL}</strong>
            <p>Canal direto para proposta, demonstração orientada e configuração enterprise.</p>
          </article>
          <article className="public-contact-card">
            <span>Privacidade</span>
            <strong>{privacyContactEmail}</strong>
            <p>Tratamento de dados, direitos do titular e processos RGPD com contacto explicito.</p>
          </article>
          <article className="public-contact-card">
            <span>Versão legal</span>
            <strong>{policyVersion}</strong>
            <p>Politicas visíveis, trial com consentimento e uso de IA explicado sem esconder riscos.</p>
          </article>
        </section>
        {renderFinalCtaSection()}
        {renderLegalSection()}
      </>
    );
  }

  function renderPublicSite() {
    const marketingIdentityClass = USE_ORIGINAL_MARKETING_VISUAL_IDENTITY ? " marketing-identity-original" : "";

    if (isAuthPage(publicPage)) {
      return (
        <main className={`auth-shell marketing-auth-shell public-login-shell${marketingIdentityClass}`}>
          <div className="marketing-main public-login-main">
            {renderLoginEntryHero()}
          </div>

          {renderAuthPanel()}
        </main>
      );
    }

    return (
      <main className={`public-marketing-shell${marketingIdentityClass}`}>
        <div className="marketing-main public-marketing-main">
          {publicPage === "contact"
            ? renderContactPage()
            : (
              <>
                {publicPage === "features"
                  ? renderFeaturesPage()
                  : publicPage === "pricing"
                    ? renderPricingPage()
                    : renderHomePage()}
                {renderFinalCtaSection()}
                {renderLegalSection()}
              </>
            )}
        </div>
        <div className="cta-bar">
          <div>
            <p className="eyebrow">Pronto para agir</p>
            <strong>Demo guiada ou checkout seguro em 1 clique.</strong>
          </div>
          <div className="cta-bar-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                openLandingLogin(
                  activePlanId,
                  "Entrar agora com demo guiada",
                  "Leva-te direto ao plano e perfil demo certos."
                )
              }
            >
              Ver demo agora
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => navigatePublicPage("pricing", "landing-pricing")}
            >
              Abrir checkout
            </button>
          </div>
        </div>
      </main>
    );
  }

  function renderActiveView() {
    if (activeView === "dashboard") {
      return (
        <Dashboard
          stats={dashboardStats}
          topHotLeads={topHotLeads}
          followUpQueue={followUpQueue}
          allLeads={leads}
          isLoading={loading}
          error={error}
          onRetry={loadWorkspace}
          onOpenPipeline={() => navigateTo("pipeline")}
          onOpenAutomation={() => navigateTo("automation")}
          onOpenReports={() => navigateTo("reports")}
          onFocusLead={focusAgentPanel}
          onOpenWhatsApp={() => navigateTo("automation")}
          onOpenProposal={() => navigateTo("pipeline")}
          onScheduleFollowUp={() => navigateTo("automation")}
          onImportCsv={handleImportCsvLeads}
          onSyncApi={handleSyncLeadsFromApi}
        />
      );
    }

    if (activeView === "pipeline") {
      return renderPipelineView();
    }

    if (activeView === "automation") {
      return renderAutomationView();
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

    return (
      <Dashboard
        stats={dashboardStats}
        topHotLeads={topHotLeads}
        followUpQueue={followUpQueue}
        allLeads={leads}
        isLoading={loading}
        error={error}
        onRetry={loadWorkspace}
        onOpenPipeline={() => navigateTo("pipeline")}
        onOpenAutomation={() => navigateTo("automation")}
        onOpenReports={() => navigateTo("reports")}
        onFocusLead={focusAgentPanel}
        onOpenWhatsApp={() => navigateTo("automation")}
        onOpenProposal={() => navigateTo("pipeline")}
        onScheduleFollowUp={() => navigateTo("automation")}
        onImportCsv={handleImportCsvLeads}
        onSyncApi={handleSyncLeadsFromApi}
      />
    );
  }

  if (!session) {
    return renderLoginView();
  }

  const crmStoreSelectors = createCrmStoreSelectors(leads, dashboardStats);
  const crmStoreValue = {
    leads,
    pipelineStages: STAGE_ORDER,
    tasks: crmTasks,
    aiInsights,
    automations: crmAutomations,
    focusLeadId,
    recommendations: aiInsights,
    stats: dashboardStats,
    moveLead: (leadId: string, stage: PipelineStage) => {
      void moveLead(leadId, stage);
    },
    updateLeadStatus,
    setFocusLead,
    completeTask,
    scheduleFollowUp: (leadId: string, followUpAt: string) => {
      void scheduleFollowUp(leadId, followUpAt);
    },
    refreshDashboardInsights,
    activateAutomation,
    pauseAutomation,
    ...crmStoreSelectors,
  };

  const activeContent = renderActiveView();
  const appIdentityClass = " app-identity-original";
  const shellToneClass = "bg-[#f7efe4] text-[#132237]";
  const shellSidebarClass = "hidden lg:flex w-72 flex-col border-r border-[#1322371a] bg-white/90 backdrop-blur-2xl px-4 py-6 space-y-6";
  const shellHeaderClass = "sticky top-0 z-20 h-16 flex items-center justify-between px-4 md:px-6 border-b border-[#1322371a] bg-white/90 backdrop-blur-xl";
  const shellMainClass = "flex-1 overflow-y-auto bg-gradient-to-br from-[#fffaf4] via-[#f7faff] to-[#efe4d3]";
  const shellCardClass = "rounded-2xl border border-[#1322371a] bg-white/90 p-4 space-y-3";
  const shellCardLabelClass = "text-xs text-[#5c6b80] uppercase tracking-wide";
  const shellCardTextClass = "text-sm font-semibold text-[#132237]";
  const shellMutedTextClass = "text-xs text-[#5c6b80]";
  const shellNavButtonBase = "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-150";
  const shellNavButtonClass = (isActive: boolean) =>
    `${shellNavButtonBase} ${
      isActive
        ? "bg-[#fffaf4] border border-[#13223724] text-[#132237] shadow-lg shadow-[#15213014]"
        : "border border-[#1322371a] bg-white/75 hover:border-[#174dbb52] hover:bg-white text-[#132237]"
    }`;
  const shellIconWrapClass = (isActive: boolean) =>
    `h-9 w-9 rounded-lg flex items-center justify-center ${
      isActive ? "bg-[#174dbb] text-white" : "bg-[#eef3f9] text-[#5a6b81]"
    }`;
  const shellTopBadgeClass = "px-2 py-1 text-xs rounded-full bg-[#174dbb1f] text-[#174dbb] border border-[#174dbb52]";

  return (
    <CrmStoreContext.Provider value={crmStoreValue}>
    <div className={`min-h-screen flex ${shellToneClass}${appIdentityClass}`}>
      <div className="version-badge" title={BUILD_META.title}>
        {BUILD_META.label}
      </div>
      <aside className={shellSidebarClass}>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#174dbb] to-[#235fda] flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-[#174dbb33]">
            IL
          </div>
          <div className="leading-tight">
            <p className={shellMutedTextClass}>ImoLead AI Pro</p>
            <p className={shellCardTextClass}>Agente imobiliário inteligente</p>
          </div>
        </div>

        <nav className="space-y-1">
          {filteredSidebarNav.map((item) => {
            const isActive = item.view === activeView;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => (item.anchor ? focusAgentPanel() : navigateTo(item.view))}
                className={shellNavButtonClass(isActive)}
              >
                <div className={shellIconWrapClass(isActive)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{item.label}</span>
                  <span className="text-xs text-[#5c6b80]">{item.hint}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {secondaryNav.length > 0 ? (
          <div className="pt-4 mt-2 border-t border-[#1322371a] space-y-1">
            <p className="text-xs uppercase text-[#7f6f5c] px-1">Operação</p>
            {secondaryNav.map((item) => {
              const isActive = item.id === activeView;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id as ViewId)}
                  className={`${shellNavButtonBase} ${
                    isActive
                      ? "bg-[#fffaf4] border border-[#174dbb52] text-[#132237] shadow-lg shadow-[#15213014]"
                      : "border border-[#1322371a] bg-white/75 hover:border-[#174dbb52] hover:bg-white text-[#132237]"
                  }`}
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isActive ? "bg-[#174dbb] text-white" : "bg-[#eef3f9] text-[#5a6b81]"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className="text-xs text-[#5c6b80]">{item.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className={shellCardClass}>
          <div className="flex items-center justify-between">
            <div>
              <p className={shellCardLabelClass}>Plano</p>
              <p className={shellCardTextClass}>{session.user.planName}</p>
            </div>
            <span className={shellTopBadgeClass}>
              {resolvedAgentLabel}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-[#5c6b80]">
            <p>{activePlan?.includedMarkets.join(" · ") || coverageLabel}</p>
            <p>{dashboardStats.total} leads ativas</p>
            <p>{dashboardStats.overdue_followups} follow-ups</p>
            <p>{aiMode === "hybrid" ? "AI externa" : "AI heurística"}</p>
          </div>
        </div>

        <div className={shellCardClass}>
          <p className={shellCardLabelClass}>Workspace</p>
          <p className={shellCardTextClass}>{session.user.name}</p>
          <p className={shellMutedTextClass}>{session.user.email}</p>
          <p className={shellMutedTextClass}>
            {getRoleLabel(session.user.role)} · {session.user.officeName}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-[#5c6b80] transition-colors hover:text-[#132237]"
          >
            <LogOut className="h-4 w-4" />
            Terminar sessão
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className={shellHeaderClass}>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[#5c6b80]">
              <Sparkles className="h-4 w-4 text-[#174dbb]" />
              <span>{viewMeta.eyebrow}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg md:text-xl font-semibold text-[#132237]">{viewMeta.label}</h1>
              <p className="text-sm hidden md:block text-[#5c6b80]">{viewMeta.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative h-10 w-10 rounded-full border border-[#1322371a] bg-white/90 hover:border-[#174dbb52] hover:text-[#174dbb] transition-colors"
            >
              <Bell className="h-5 w-5 m-auto text-[#5a6b81]" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#174dbb]" />
            </button>
            <div className="flex items-center gap-3 rounded-full border border-[#1322371a] bg-white/90 px-3 py-2">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#174dbb] to-[#235fda] flex items-center justify-center text-sm font-bold text-white">
                {session.user.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className={shellCardTextClass}>{session.user.name}</p>
                <p className={shellMutedTextClass}>{getRoleLabel(session.user.role)}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="copilot-bar">
          <div>
            <p className="eyebrow">Copiloto</p>
            <strong>Próxima ação sugerida</strong>
            <span className="hero-text">
              {followUpQueue[0]
                ? `${followUpQueue[0].name} · ${followUpQueue[0].nextStep}`
                : "Nenhum follow-up pendente. Gere leads ou abra automações."}
            </span>
          </div>
          <div className="copilot-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => navigateTo("automation")}
            >
              Abrir automações
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={() => navigateTo("pipeline")}
            >
              Ver pipeline
            </button>
          </div>
        </div>

        <main className={shellMainClass}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-4">
            {loading && leads.length === 0 ? (
              <p className="text-sm text-[#5c6b80]">A carregar workspace...</p>
            ) : null}
            {error && !loading ? <p className="text-sm text-[#a43d2a]">{error}</p> : null}
            {!loading ? activeContent : null}
          </div>
        </main>
      </div>
    </div>
    </CrmStoreContext.Provider>
  );
}

export default App;
