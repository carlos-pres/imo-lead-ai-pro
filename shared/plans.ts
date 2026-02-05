export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanConfig {
  id: string;
  name: string;
  description: string;
  features: PlanFeature[];
  limits: {
    leadsPerMonth: number | null;
    reportsPerWeek: number;
    canScheduleVisits: boolean;
    hasAdvancedAI: boolean;
    hasCalendarIntegration: boolean;
    hasPersonalizedCards: boolean;
    hasSocialAutomation: boolean;
    hasExclusiveSupport: boolean;
    hasVideoProduction: boolean;
  };
  badge?: string;
  highlighted?: boolean;
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  basic: {
    id: "basic",
    name: "ImoLead Basic",
    description: "Ideal para agentes individuais que querem começar a automatizar leads",
    badge: "7 dias grátis",
    features: [
      { text: "Mais de 100 leads/mês", included: true },
      { text: "Pesquisa automática em sites imobiliários", included: true },
      { text: "Gestão de agenda integrada (Google Agenda)", included: true },
      { text: "Relatório semanal dos leads", included: true },
      { text: "Aliado digital estratégico", included: true },
      { text: "Pesquisa Casafari, Idealista, OLX", included: true },
      { text: "Suporte semanal", included: true },
      { text: "Estudo de mercado analítico (1x por semana)", included: true },
      { text: "Marcação de visitas pelo assistente", included: false },
      { text: "IA avançada", included: false },
      { text: "Leads ilimitados", included: false },
    ],
    limits: {
      leadsPerMonth: 100,
      reportsPerWeek: 1,
      canScheduleVisits: false,
      hasAdvancedAI: false,
      hasCalendarIntegration: true,
      hasPersonalizedCards: false,
      hasSocialAutomation: false,
      hasExclusiveSupport: false,
      hasVideoProduction: false,
    },
  },
  pro: {
    id: "pro",
    name: "ImoLead Pro",
    description: "Para profissionais que querem maximizar resultados com IA avançada",
    badge: "Mais Popular",
    highlighted: true,
    features: [
      { text: "Tudo do plano Basic", included: true },
      { text: "IA avançada com análise detalhada", included: true },
      { text: "Leads ilimitados", included: true },
      { text: "Relatórios 3x por semana", included: true },
      { text: "Cards personalizados digitais", included: true },
      { text: "Relatório mensal da evolução do agente", included: true },
      { text: "Agenda com marcação de visitas", included: true },
      { text: "Automação de mensagens WhatsApp/Email", included: true },
      { text: "Integração Casafari & Idealista premium", included: true },
      { text: "Suporte prioritário", included: true },
    ],
    limits: {
      leadsPerMonth: null,
      reportsPerWeek: 3,
      canScheduleVisits: true,
      hasAdvancedAI: true,
      hasCalendarIntegration: true,
      hasPersonalizedCards: true,
      hasSocialAutomation: false,
      hasExclusiveSupport: false,
      hasVideoProduction: false,
    },
  },
  custom: {
    id: "custom",
    name: "ImoLead Custom",
    description: "Solução personalizada para equipas e agências com necessidades específicas",
    badge: "Enterprise",
    features: [
      { text: "Tudo do plano Pro", included: true },
      { text: "Reuniões estratégicas individuais (com equipa)", included: true },
      { text: "3 vídeos imobiliários profissionais/mês", included: true },
      { text: "Acesso exclusivo com estudo de mercado", included: true },
      { text: "Automação integrada: Instagram, WhatsApp, TikTok", included: true },
      { text: "Relatório diário de acompanhamento leads", included: true },
      { text: "Material promocional digital", included: true },
      { text: "Configuração de credenciais automatizada", included: true },
      { text: "Gestor de conta dedicado", included: true },
      { text: "Suporte 24/7", included: true },
    ],
    limits: {
      leadsPerMonth: null,
      reportsPerWeek: 7,
      canScheduleVisits: true,
      hasAdvancedAI: true,
      hasCalendarIntegration: true,
      hasPersonalizedCards: true,
      hasSocialAutomation: true,
      hasExclusiveSupport: true,
      hasVideoProduction: true,
    },
  },
};

export function getPlanConfig(planId: string): PlanConfig | undefined {
  return PLAN_CONFIGS[planId.toLowerCase()];
}

export function canScheduleVisits(planId: string): boolean {
  const plan = getPlanConfig(planId);
  return plan?.limits.canScheduleVisits ?? false;
}

export function hasAdvancedAI(planId: string): boolean {
  const plan = getPlanConfig(planId);
  return plan?.limits.hasAdvancedAI ?? false;
}

export function getLeadLimit(planId: string): number | null {
  const plan = getPlanConfig(planId);
  return plan?.limits.leadsPerMonth ?? null;
}

export function getReportsPerWeek(planId: string): number {
  const plan = getPlanConfig(planId);
  return plan?.limits.reportsPerWeek ?? 1;
}

export function getReportFrequencyLabel(planId: string): string {
  const reportsPerWeek = getReportsPerWeek(planId);
  if (reportsPerWeek >= 7) return "Diário";
  if (reportsPerWeek >= 3) return "3x por semana";
  return "Semanal";
}

export const VISIT_RESTRICTION_MESSAGE = 
  "A marcação de visitas está disponível apenas nos planos Pro e Custom. " +
  "Para agendar visitas através do assistente IA, considere fazer upgrade do seu plano.";

export const ADVANCED_AI_RESTRICTION_MESSAGE = 
  "A IA avançada está disponível apenas nos planos Pro e Custom. " +
  "Faça upgrade para aceder a análises mais detalhadas e funcionalidades premium.";
