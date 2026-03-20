import {
  evaluateLeadForAgency,
  type EnterpriseLeadInput,
  type LeadIntelligence,
} from "./enterpriseLeadAgent.js";

type LeadAgentResult = LeadIntelligence & {
  classification: LeadIntelligence["status"];
  strategy: {
    goal: string;
    tone: string;
    channel: string;
  };
  message: string;
};

function validateLead(lead: Partial<EnterpriseLeadInput>) {
  return Boolean(lead && lead.price && lead.property && lead.location && lead.name);
}

function defineStrategy(intelligence: LeadIntelligence) {
  if (intelligence.routingBucket === "flagship") {
    return {
      goal: "agendar qualificacao premium nas proximas 2 horas",
      tone: "consultivo e executivo",
      channel: "telefone e email",
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

function generateFirstContact(lead: EnterpriseLeadInput, result: LeadIntelligence) {
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

export async function runLeadAgent(lead: Partial<EnterpriseLeadInput>): Promise<LeadAgentResult> {
  console.log("[AI] enterprise lead agent started");

  if (!validateLead(lead)) {
    return {
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

  const intelligence = await evaluateLeadForAgency(normalizedLead);
  const strategy = defineStrategy(intelligence);

  return {
    ...intelligence,
    classification: intelligence.status,
    strategy,
    message: generateFirstContact(normalizedLead, intelligence),
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
