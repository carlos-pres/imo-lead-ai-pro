export type PlanType = "basic" | "pro" | "custom";
export type PlanStatus = "trial" | "active" | "inactive";
export type BillingInterval = "month" | "year";

export type PlanConfig = {
  id: PlanType;
  publicName: string;
  recommendedFor: string;
  trialDays: number;
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
};

export type CommercialPlan = {
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

export const ANNUAL_DISCOUNT_PERCENT = 20;
export const DEFAULT_PLAN_ID: PlanType = "pro";

function yearlyPriceFromMonthly(monthlyPrice: number) {
  return Number((monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100)).toFixed(2));
}

function formatPriceLabel(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function getLeadCapacityLabel(leadLimit: number) {
  return leadLimit >= 999999
    ? "Capacidade personalizada em regime fair use para leads geridas e analisadas"
    : `Capacidade ate ${leadLimit} leads geridas/analisadas por mes`;
}

function getExtraUsersLabel(plan: Pick<
  PlanConfig,
  "allowsExtraUsers" | "extraUserMonthlyPrice" | "extraUserYearlyPrice"
>) {
  if (!plan.allowsExtraUsers) {
    return "Sem utilizadores extra no Starter durante o trial e na operacao base";
  }

  return `Utilizador extra: ${formatPriceLabel(plan.extraUserMonthlyPrice)}/mes ou ${formatPriceLabel(plan.extraUserYearlyPrice)}/ano`;
}

export const PLAN_CONFIG: Record<PlanType, PlanConfig> = {
  basic: {
    id: "basic",
    publicName: "ImoLead Starter",
    recommendedFor: "Consultor individual ou pequena operacao local com trial inicial",
    trialDays: 15,
    includedCountryCodes: ["PT"],
    leadLimit: 50,
    includedUsers: 1,
    allowsExtraUsers: false,
    extraUserMonthlyPrice: 0,
    extraUserYearlyPrice: 0,
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
      "15 dias de trial para validar a operacao sem friccao",
      getLeadCapacityLabel(50),
      "1 utilizador incluido e 1 loja",
      getExtraUsersLabel({
        allowsExtraUsers: false,
        extraUserMonthlyPrice: 0,
        extraUserYearlyPrice: 0,
      }),
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
    trialDays: 0,
    includedCountryCodes: ["PT", "ES"],
    leadLimit: 250,
    includedUsers: 7,
    allowsExtraUsers: true,
    extraUserMonthlyPrice: 17,
    extraUserYearlyPrice: yearlyPriceFromMonthly(17),
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
      "Upgrade natural apos o trial Starter",
      getLeadCapacityLabel(250),
      "7 utilizadores incluidos",
      getExtraUsersLabel({
        allowsExtraUsers: true,
        extraUserMonthlyPrice: 17,
        extraUserYearlyPrice: yearlyPriceFromMonthly(17),
      }),
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
    trialDays: 0,
    includedCountryCodes: ["PT", "ES", "FR", "IT"],
    leadLimit: 999999,
    includedUsers: 25,
    allowsExtraUsers: true,
    extraUserMonthlyPrice: 27,
    extraUserYearlyPrice: yearlyPriceFromMonthly(27),
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
      "Camada seguinte para operacoes que ultrapassam o Pro",
      getLeadCapacityLabel(999999),
      "25 utilizadores incluidos",
      getExtraUsersLabel({
        allowsExtraUsers: true,
        extraUserMonthlyPrice: 27,
        extraUserYearlyPrice: yearlyPriceFromMonthly(27),
      }),
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

export function buildCommercialPlanSeedEntries() {
  return (Object.values(PLAN_CONFIG) as PlanConfig[]).map((plan, index) => ({
    id: `catalog-${plan.id}`,
    basePlanId: plan.id,
    slug:
      plan.id === "basic"
        ? "starter"
        : plan.id === "pro"
          ? "pro"
          : "enterprise",
    publicName: plan.publicName,
    recommendedFor: plan.recommendedFor,
    includedCountryCodes: [...plan.includedCountryCodes],
    leadLimit: plan.leadLimit,
    includedUsers: plan.includedUsers,
    allowsExtraUsers: plan.allowsExtraUsers,
    extraUserMonthlyPrice: plan.extraUserMonthlyPrice,
    extraUserYearlyPrice: plan.extraUserYearlyPrice,
    advancedAI: plan.advancedAI,
    autoContact: plan.autoContact,
    multiLocation: plan.multiLocation,
    multiLanguage: plan.multiLanguage,
    maxMessagesPerMonth: plan.maxMessagesPerMonth,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    annualDiscountPercent: plan.annualDiscountPercent,
    reportsLabel: plan.reportsLabel,
    marketReports: [...plan.marketReports],
    includedMarkets: [...plan.includedMarkets],
    supportLabel: plan.supportLabel,
    agentLabel: plan.agentLabel,
    agentCapabilities: [...plan.agentCapabilities],
    features: [...plan.features],
    isActive: true,
    isPublic: true,
    sortOrder: index + 1,
  })) satisfies CommercialPlan[];
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
    trialDays: plan.trialDays,
    leads: getLeadCapacityLabel(plan.leadLimit),
    includedUsers: plan.includedUsers,
    allowsExtraUsers: plan.allowsExtraUsers,
    extraUsers: getExtraUsersLabel(plan),
    reports: plan.reportsLabel,
    canScheduleVisits: plan.id !== "basic",
    hasAdvancedAI: plan.advancedAI,
    agentLabel: plan.agentLabel,
    annualDiscountPercent: plan.annualDiscountPercent,
    includedCountryCodes: plan.includedCountryCodes,
    includedMarkets: plan.includedMarkets,
    upgradeTargets: getPlanUpgradeTargets(plan.id),
    upgradeSummary: getPlanUpgradeSummary(plan.id),
    features: plan.features,
  };
}

export function getPlanTrialDays(planId: PlanType) {
  return PLAN_CONFIG[planId].trialDays;
}

export function getPlanUpgradeTargets(planId: PlanType) {
  if (planId === "basic") {
    return ["pro", "custom"] as PlanType[];
  }

  if (planId === "pro") {
    return ["custom"] as PlanType[];
  }

  return [] as PlanType[];
}

export function getPlanUpgradeSummary(planId: PlanType) {
  if (planId === "basic") {
    return "Inclui 15 dias de trial e indica sempre o Pro como evolucao natural, deixando o Enterprise para equipas multi-loja e expansao europeia.";
  }

  if (planId === "pro") {
    return "Pensado para equipas que saem do Starter e com caminho claro para o Enterprise quando precisarem de governance e escala europeia.";
  }

  return "Camada final para operacoes que ja validaram o fit e precisam de controlo total, governance e expansao.";
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
        ...(plan.trialDays > 0 ? [`${plan.trialDays} dias de trial incluidos`] : []),
        `${plan.includedUsers} utilizador${plan.includedUsers === 1 ? "" : "es"} incluido${plan.includedUsers === 1 ? "" : "s"}`,
        getExtraUsersLabel(plan),
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
        ...(plan.trialDays > 0 ? [`${plan.trialDays} dias de trial incluidos`] : []),
        `${plan.includedUsers} utilizador${plan.includedUsers === 1 ? "" : "es"} incluido${plan.includedUsers === 1 ? "" : "s"}`,
        getExtraUsersLabel(plan),
        ...plan.features,
        `Desconto anual fixo de ${plan.annualDiscountPercent}%`,
        `Mercados incluidos: ${plan.includedMarkets.join(", ")}`,
      ],
    },
  ]);
}
