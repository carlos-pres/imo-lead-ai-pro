import {
  evaluateLeadForAgency,
  type EnterpriseLeadInput,
  type LeadIntelligence,
} from "./enterpriseLeadAgent.js";
import { getPlanConfig, resolvePlanId, type PlanType } from "../core/plans.js";

type LeadAgentResult = LeadIntelligence & {
  planId: PlanType;
  planName: string;
  agentLabel: string;
  autoContactEnabled: boolean;
  classification: LeadIntelligence["status"];
  strategy: {
    goal: string;
    tone: string;
    channel: string;
  };
  message: string;
};

type LeadAgentOptions = {
  planId?: PlanType;
};

function validateLead(lead: Partial<EnterpriseLeadInput>) {
  return Boolean(lead && lead.price && lead.property && lead.location && lead.name);
}

function getStatusFromScore(score: number): LeadIntelligence["status"] {
  if (score >= 75) {
    return "quente";
  }

  if (score >= 45) {
    return "morno";
  }

  return "frio";
}

function getRoutingBucketFromScore(score: number): LeadIntelligence["routingBucket"] {
  if (score >= 82) {
    return "flagship";
  }

  if (score >= 56) {
    return "growth";
  }

  return "nurture";
}

function getSlaHoursForPlan(planId: PlanType, intelligence: LeadIntelligence) {
  if (planId === "custom") {
    if (intelligence.routingBucket === "flagship" || intelligence.status === "quente") {
      return 1;
    }

    if (intelligence.routingBucket === "growth" || intelligence.status === "morno") {
      return 4;
    }

    return 12;
  }

  if (planId === "basic") {
    if (intelligence.status === "quente") {
      return 8;
    }

    if (intelligence.status === "morno") {
      return 16;
    }

    return 24;
  }

  return intelligence.slaHours;
}

function applyPlanPolicy(
  lead: EnterpriseLeadInput,
  intelligence: LeadIntelligence,
  planId: PlanType
) {
  if (planId === "basic") {
    const aiScore = Math.min(intelligence.aiScore, 78);
    const status = getStatusFromScore(aiScore);
    const routingBucket =
      intelligence.routingBucket === "flagship"
        ? "growth"
        : getRoutingBucketFromScore(Math.min(aiScore, 74));

    return {
      status,
      aiScore,
      reasoning: `${intelligence.reasoning} Operacao em modo Starter: triagem heuristica, foco local e sem automacao de outreach.`,
      recommendedAction:
        status === "quente"
          ? `Priorizar contacto manual em ${lead.location} e validar contexto antes de visita.`
          : status === "morno"
            ? "Manter follow-up manual e usar o relatorio local para qualificar a oportunidade."
            : "Conservar em nurture local com enriquecimento manual antes de nova abordagem.",
      routingBucket,
      slaHours: getSlaHoursForPlan("basic", {
        ...intelligence,
        status,
        routingBucket,
      }),
    } satisfies LeadIntelligence;
  }

  if (planId === "custom") {
    const aiScore = Math.min(100, intelligence.aiScore + 4);
    const status = getStatusFromScore(aiScore);
    const routingBucket =
      aiScore >= 78 ? "flagship" : getRoutingBucketFromScore(aiScore);

    return {
      status,
      aiScore,
      reasoning: `${intelligence.reasoning} Operacao em modo Enterprise com desks internacionais, governance e SLA executivo.`,
      recommendedAction:
        routingBucket === "flagship"
          ? "Escalar para desk flagship ou internacional com contacto executivo imediato."
          : intelligence.recommendedAction,
      routingBucket,
      slaHours: getSlaHoursForPlan("custom", {
        ...intelligence,
        status,
        routingBucket,
      }),
    } satisfies LeadIntelligence;
  }

  return {
    ...intelligence,
    reasoning: `${intelligence.reasoning} Operacao em modo Pro com AI avancada e playbooks de follow-up.`,
    slaHours: getSlaHoursForPlan("pro", intelligence),
  };
}

function defineStrategy(intelligence: LeadIntelligence, planId: PlanType) {
  if (planId === "basic") {
    if (intelligence.status === "quente") {
      return {
        goal: "fazer contacto manual e qualificar interesse ainda hoje",
        tone: "consultivo e direto",
        channel: "telefone ou email manual",
      };
    }

    if (intelligence.status === "morno") {
      return {
        goal: "descobrir timing e motivacao com follow-up manual",
        tone: "consultivo local",
        channel: "email",
      };
    }

    return {
      goal: "manter a relacao ativa com contexto de mercado local",
      tone: "informativo",
      channel: "email",
    };
  }

  if (intelligence.routingBucket === "flagship") {
    return {
      goal:
        planId === "custom"
          ? "agendar qualificacao executiva nas proximas 1 a 2 horas"
          : "agendar qualificacao premium nas proximas 2 horas",
      tone: planId === "custom" ? "executivo multidesk" : "consultivo e executivo",
      channel: planId === "custom" ? "telefone, email e desk internacional" : "telefone e email",
    };
  }

  if (intelligence.status === "quente") {
    return {
      goal: "converter em reuniao ou visita com rapidez",
      tone: "direto e profissional",
      channel: "telefone",
    };
  }

  if (intelligence.status === "morno") {
    return {
      goal: "descobrir timing e motivacao do proprietario",
      tone: "consultivo",
      channel: "whatsapp ou email",
    };
  }

  return {
    goal: "nutrir a relacao e recolher mais contexto",
    tone: "informativo",
    channel: "email",
  };
}

function generateFirstContact(
  lead: EnterpriseLeadInput,
  result: LeadIntelligence,
  planId: PlanType
) {
  if (planId === "basic") {
    return "Automacao de outreach disponivel a partir do plano ImoLead Pro. Use o resumo de mercado local como apoio ao contacto manual.";
  }

  if (result.routingBucket === "flagship") {
    return `Bom dia ${lead.name}, acompanho uma carteira premium com procura ativa em ${lead.location}. O seu imovel parece muito alinhado com esse perfil e gostava de perceber se faz sentido uma conversa curta ainda hoje.`;
  }

  if (result.status === "quente") {
    return `Ola ${lead.name}, vi o seu imovel em ${lead.location} e acredito que pode encaixar bem em compradores que estamos a acompanhar. Tem disponibilidade para uma conversa breve nas proximas horas?`;
  }

  if (result.status === "morno") {
    return `Ola ${lead.name}, reparei no seu imovel em ${lead.location} e gostaria de perceber melhor o momento da venda. Se fizer sentido, posso partilhar uma leitura rapida da procura atual na sua zona.`;
  }

  return `Ola ${lead.name}, vi o seu anuncio em ${lead.location}. Quando lhe for conveniente, posso partilhar alguns dados de mercado e perceber se vale a pena falarmos mais a frente.`;
}

export async function runLeadAgent(
  lead: Partial<EnterpriseLeadInput>,
  options?: LeadAgentOptions
): Promise<LeadAgentResult> {
  console.log("[AI] enterprise lead agent started");
  const planId = resolvePlanId(options?.planId);
  const plan = getPlanConfig(planId);

  if (!validateLead(lead)) {
    return {
      planId,
      planName: plan.publicName,
      agentLabel: plan.agentLabel,
      autoContactEnabled: plan.autoContact,
      classification: "frio",
      status: "frio",
      aiScore: 20,
      reasoning: "Lead com dados insuficientes para qualificacao automatica robusta.",
      recommendedAction: "Enriquecer dados antes de enviar para qualquer equipa comercial.",
      routingBucket: "nurture",
      slaHours: 24,
      strategy: {
        goal: "enriquecer dados do lead",
        tone: "operacional",
        channel: "interno",
      },
      message: "",
    };
  }

  const normalizedLead: EnterpriseLeadInput = {
    name: lead.name!,
    property: lead.property!,
    location: lead.location!,
    price: Number(lead.price),
    area: lead.area ?? null,
    source: lead.source,
    contact: lead.contact,
    notes: lead.notes,
  };

  const intelligence = applyPlanPolicy(
    normalizedLead,
    await evaluateLeadForAgency(normalizedLead, {
      allowExternalAI: plan.advancedAI,
      planId,
    }),
    planId
  );
  const strategy = defineStrategy(intelligence, planId);

  return {
    ...intelligence,
    planId,
    planName: plan.publicName,
    agentLabel: plan.agentLabel,
    autoContactEnabled: plan.autoContact,
    classification: intelligence.status,
    strategy,
    message: generateFirstContact(normalizedLead, intelligence, planId),
  };
}

async function testAgent() {
  const result = await runLeadAgent({
    name: "Lead Demo",
    property: "Apartamento T3 junto ao mar",
    price: 720000,
    location: "Cascais",
    source: "Casafari",
    contact: "lead.demo@example.com",
    notes: "Proprietario com abertura para avaliacao de proposta em curto prazo.",
  });

  console.log("----------- TESTE AGENTE -----------");
  console.log(result);
  console.log("------------------------------------");
}

if (process.argv[1] && process.argv[1].includes("agentService")) {
  void testAgent();
}
