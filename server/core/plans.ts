export type PlanType = "basic" | "pro" | "custom";
export type PlanStatus = "trial" | "active" | "inactive";
export type BillingInterval = "month" | "year";

export type PlanConfig = {
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

export const ANNUAL_DISCOUNT_PERCENT = 20;
export const DEFAULT_PLAN_ID: PlanType = "pro";

function yearlyPriceFromMonthly(monthlyPrice: number) {
  return Number((monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100)).toFixed(2));
}

export const PLAN_CONFIG: Record<PlanType, PlanConfig> = {
  basic: {
    id: "basic",
    publicName: "ImoLead Starter",
    recommendedFor: "Consultor individual ou pequena operacao local",
    includedCountryCodes: ["PT"],
    leadLimit: 120,
    advancedAI: false,
    autoContact: false,
    multiLocation: false,
    multiLanguage: false,
    maxMessagesPerMonth: 150,
    monthlyPrice: 47,
    yearlyPrice: yearlyPriceFromMonthly(47),
    annualDiscountPercent: ANNUAL_DISCOUNT_PERCENT,
    reportsLabel: "Relatorio de mercado local mensal",
    marketReports: [
      "Relatorio mensal por zona",
      "Resumo de oferta, procura e preco medio",
    ],
    includedMarkets: ["Portugal"],
    supportLabel: "Suporte por email",
    agentLabel: "AI Assistant",
    agentCapabilities: [
      "Triagem essencial e prioridade inicial",
      "Mensagens sugeridas para primeiro contacto",
      "Relatorio local mensal para a loja principal",
      "Sem automacao autonoma multi-equipa",
    ],
    features: [
      "Ate 120 leads por mes",
      "1 utilizador e 1 loja",
      "Pipeline e follow-up base",
      "Classificacao AI essencial",
      "Relatorio de mercado local mensal",
      "Suporte por email",
    ],
  },
  pro: {
    id: "pro",
    publicName: "ImoLead Pro",
    recommendedFor: "Agencia em crescimento com multi-owner e foco Iberia",
    includedCountryCodes: ["PT", "ES"],
    leadLimit: 600,
    advancedAI: true,
    autoContact: true,
    multiLocation: true,
    multiLanguage: true,
    maxMessagesPerMonth: 1200,
    monthlyPrice: 97,
    yearlyPrice: yearlyPriceFromMonthly(97),
    annualDiscountPercent: ANNUAL_DISCOUNT_PERCENT,
    reportsLabel: "Relatorios de mercado semanais",
    marketReports: [
      "Relatorio semanal por cidade e carteira",
      "Comparativo de fontes e desks",
      "Pulse report de mercado iberico",
    ],
    includedMarkets: ["Portugal", "Espanha"],
    supportLabel: "Suporte prioritario",
    agentLabel: "AI Copilot",
    agentCapabilities: [
      "Routing por owner, loja e prioridade comercial",
      "Playbooks assistidos para follow-up e recuperacao",
      "Relatorios semanais para Portugal e Espanha",
      "Operacao multilingue assistida",
    ],
    features: [
      "Ate 600 leads por mes",
      "Ate 7 utilizadores",
      "Multi-loja e multi-owner",
      "Automacao comercial e AI avancada",
      "Relatorios de mercado semanais",
      "Cobertura Portugal e Iberia",
      "Suporte prioritario",
    ],
  },
  custom: {
    id: "custom",
    publicName: "ImoLead Enterprise",
    recommendedFor: "Grande imobiliaria, rede multi-loja ou expansao europeia",
    includedCountryCodes: ["PT", "ES", "FR", "IT"],
    leadLimit: 999999,
    advancedAI: true,
    autoContact: true,
    multiLocation: true,
    multiLanguage: true,
    maxMessagesPerMonth: 999999,
    monthlyPrice: 297,
    yearlyPrice: yearlyPriceFromMonthly(297),
    annualDiscountPercent: ANNUAL_DISCOUNT_PERCENT,
    reportsLabel: "Relatorios executivos de mercado",
    marketReports: [
      "Relatorio executivo semanal",
      "Relatorio multi-mercado europeu",
      "Benchmark de equipas, lojas e SLAs",
    ],
    includedMarkets: ["Portugal", "Iberia", "Europa"],
    supportLabel: "Suporte prioritario e onboarding",
    agentLabel: "AI Orchestrator",
    agentCapabilities: [
      "Orquestracao multi-loja, multi-mercado e multi-idioma",
      "Prioridade comercial com desks internacionais e SLAs",
      "Relatorios executivos e radar europeu",
      "Base pronta para automacao e governance enterprise",
    ],
    features: [
      "Leads, mensagens e lojas sem limite pratico",
      "Permissoes enterprise e desks internacionais",
      "Operacao multilingue",
      "Relatorios executivos de mercado",
      "Cobertura Portugal, Iberia e Europa",
      "Suporte prioritario e onboarding",
    ],
  },
};

export function getPlanConfig(planId: PlanType) {
  return PLAN_CONFIG[planId];
}

export function isPlanType(value: string | undefined | null): value is PlanType {
  return value === "basic" || value === "pro" || value === "custom";
}

export function getDefaultPlanId() {
  const envPlan = process.env.DEFAULT_PLAN_ID;
  return isPlanType(envPlan) ? envPlan : DEFAULT_PLAN_ID;
}

export function resolvePlanId(planId?: string | null) {
  return isPlanType(planId) ? planId : getDefaultPlanId();
}

export function getPublicPlanName(planId: PlanType) {
  return PLAN_CONFIG[planId].publicName;
}

export function getPlanPresentation(planId: PlanType) {
  const plan = PLAN_CONFIG[planId];

  return {
    name: plan.publicName,
    leads:
      plan.leadLimit >= 999999 ? "Leads ilimitados" : `${plan.leadLimit} leads/mes`,
    reports: plan.reportsLabel,
    canScheduleVisits: plan.id !== "basic",
    hasAdvancedAI: plan.advancedAI,
    agentLabel: plan.agentLabel,
    annualDiscountPercent: plan.annualDiscountPercent,
    includedCountryCodes: plan.includedCountryCodes,
    includedMarkets: plan.includedMarkets,
    features: plan.features,
  };
}

export function isCountryCoveredByPlan(planId: PlanType, countryCode: string) {
  return PLAN_CONFIG[planId].includedCountryCodes.includes(countryCode);
}

export function getPlanUpgradeMessage(planId: PlanType, countryCode: string) {
  if (countryCode === "ES" && planId === "basic") {
    return "Espanha requer o plano ImoLead Pro ou Enterprise.";
  }

  if ((countryCode === "FR" || countryCode === "IT") && planId !== "custom") {
    return "Franca e Italia requerem o plano ImoLead Enterprise.";
  }

  if (countryCode !== "PT" && planId === "basic") {
    return "Operacoes fora de Portugal requerem o plano ImoLead Pro ou Enterprise.";
  }

  if (countryCode !== "PT" && countryCode !== "ES" && planId === "pro") {
    return "Este mercado requer o plano ImoLead Enterprise.";
  }

  return `Este mercado nao esta incluido no plano ${PLAN_CONFIG[planId].publicName}.`;
}

export function getPaymentPlanOptions() {
  return (Object.values(PLAN_CONFIG) as PlanConfig[]).flatMap((plan) => [
    {
      id: plan.id,
      planId: plan.id,
      name: plan.publicName,
      price: plan.monthlyPrice,
      currency: "EUR",
      interval: "month" as const,
      features: [
        ...plan.features,
        `Mercados incluidos: ${plan.includedMarkets.join(", ")}`,
      ],
    },
    {
      id: `${plan.id}-yearly`,
      planId: plan.id,
      name: `${plan.publicName} Anual`,
      price: plan.yearlyPrice,
      currency: "EUR",
      interval: "year" as const,
      features: [
        ...plan.features,
        `Desconto anual fixo de ${plan.annualDiscountPercent}%`,
        `Mercados incluidos: ${plan.includedMarkets.join(", ")}`,
      ],
    },
  ]);
}
