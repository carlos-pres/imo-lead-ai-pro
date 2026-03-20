import { analyzeLeadWithAI } from "../lib/openai.js";

export type LeadStatus = "quente" | "morno" | "frio";
export type RoutingBucket = "flagship" | "growth" | "nurture";

export type EnterpriseLeadInput = {
  name: string;
  property: string;
  location: string;
  price: number;
  area?: number | null;
  source?: string;
  contact?: string;
  notes?: string;
};

export type LeadIntelligence = {
  status: LeadStatus;
  aiScore: number;
  reasoning: string;
  recommendedAction: string;
  routingBucket: RoutingBucket;
  slaHours: number;
};

const premiumAreas = [
  "cascais",
  "estoril",
  "foz",
  "comporta",
  "algarve",
  "loule",
  "vilamoura",
];

const strongSources = ["casafari", "idealista"];
const mixedSources = ["olx", "facebook", "manual"];

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isPremiumLocation(location: string) {
  const normalized = location.toLowerCase();
  return premiumAreas.some((item) => normalized.includes(item));
}

function getLocationScore(location: string) {
  if (isPremiumLocation(location)) {
    return 20;
  }

  if (/(porto|lisboa|setubal|braga|coimbra|faro|aveiro)/i.test(location)) {
    return 13;
  }

  return 8;
}

function getSourceScore(source?: string) {
  const normalized = (source || "manual").toLowerCase();

  if (strongSources.some((item) => normalized.includes(item))) {
    return 16;
  }

  if (mixedSources.some((item) => normalized.includes(item))) {
    return 10;
  }

  return 8;
}

function getContactScore(contact?: string) {
  if (!contact) {
    return 0;
  }

  const hasEmail = contact.includes("@");
  const digits = contact.replace(/\D/g, "").length;
  const hasPhone = digits >= 9;

  if (hasEmail && hasPhone) {
    return 18;
  }

  if (hasEmail || hasPhone) {
    return 12;
  }

  return 6;
}

function getCompletenessScore(lead: EnterpriseLeadInput) {
  let score = 0;

  if (lead.property && lead.property.length >= 10) {
    score += 6;
  }

  if (lead.area && lead.area > 0) {
    score += 4;
  }

  if (lead.notes && lead.notes.length >= 20) {
    score += 5;
  }

  return score;
}

function getPriceScore(price: number, area?: number | null) {
  if (!price || price <= 0) {
    return 0;
  }

  if (area && area > 0) {
    const pricePerSquareMeter = price / area;

    if (pricePerSquareMeter <= 2800) {
      return 22;
    }

    if (pricePerSquareMeter <= 4200) {
      return 16;
    }

    if (pricePerSquareMeter <= 6000) {
      return 10;
    }

    return 4;
  }

  if (price <= 250000) {
    return 12;
  }

  if (price <= 600000) {
    return 16;
  }

  if (price <= 1200000) {
    return 13;
  }

  return 9;
}

function getEnterpriseBoost(lead: EnterpriseLeadInput) {
  let boost = 0;

  if (isPremiumLocation(lead.location)) {
    boost += 5;
  }

  if ((lead.source || "").toLowerCase().includes("casafari")) {
    boost += 4;
  }

  if (lead.price >= 650000) {
    boost += 3;
  }

  return boost;
}

function getStatusFromScore(score: number): LeadStatus {
  if (score >= 75) {
    return "quente";
  }

  if (score >= 45) {
    return "morno";
  }

  return "frio";
}

function getRoutingBucket(score: number): RoutingBucket {
  if (score >= 82) {
    return "flagship";
  }

  if (score >= 56) {
    return "growth";
  }

  return "nurture";
}

function getSlaHours(status: LeadStatus, routingBucket: RoutingBucket) {
  if (routingBucket === "flagship" || status === "quente") {
    return 2;
  }

  if (routingBucket === "growth" || status === "morno") {
    return 8;
  }

  return 24;
}

function buildRecommendedAction(status: LeadStatus, routingBucket: RoutingBucket) {
  if (routingBucket === "flagship") {
    return "Enviar para equipa premium e iniciar contacto consultivo imediato.";
  }

  if (status === "quente") {
    return "Contactar nas proximas 2 horas e qualificar para visita.";
  }

  if (status === "morno") {
    return "Colocar em cadencia de follow-up com proposta de valor local.";
  }

  return "Manter em nurture com enriquecimento de dados antes de novo contacto.";
}

function buildReasoning(
  lead: EnterpriseLeadInput,
  score: number,
  routingBucket: RoutingBucket
) {
  const locationSignal = isPremiumLocation(lead.location)
    ? "zona premium"
    : "zona de expansao";

  const sourceSignal = lead.source ? `fonte ${lead.source}` : "fonte manual";

  return `Lead com score ${score}, ${locationSignal} e ${sourceSignal}. Encaminhado para desk ${routingBucket}.`;
}

export function buildHeuristicLeadIntelligence(lead: EnterpriseLeadInput): LeadIntelligence {
  const score = clampScore(
    getLocationScore(lead.location) +
      getPriceScore(lead.price, lead.area) +
      getSourceScore(lead.source) +
      getContactScore(lead.contact) +
      getCompletenessScore(lead) +
      getEnterpriseBoost(lead)
  );

  const status = getStatusFromScore(score);
  const routingBucket = getRoutingBucket(score);

  return {
    status,
    aiScore: score,
    reasoning: buildReasoning(lead, score, routingBucket),
    recommendedAction: buildRecommendedAction(status, routingBucket),
    routingBucket,
    slaHours: getSlaHours(status, routingBucket),
  };
}

function mergeIntelligence(
  lead: EnterpriseLeadInput,
  heuristic: LeadIntelligence,
  aiScore: number,
  aiReasoning: string
): LeadIntelligence {
  const usesFallbackReasoning =
    !aiReasoning ||
    aiReasoning.includes("Ãƒ") ||
    aiReasoning.toLowerCase().includes("nao dispon") ||
    aiReasoning.toLowerCase().includes("nÃ£o dispon") ||
    aiReasoning.toLowerCase().includes("por defeito");

  if (usesFallbackReasoning) {
    return heuristic;
  }

  const mergedScore = clampScore(heuristic.aiScore * 0.55 + aiScore * 0.45);
  const status = getStatusFromScore(mergedScore);
  const routingBucket = getRoutingBucket(mergedScore);

  return {
    status,
    aiScore: mergedScore,
    reasoning: aiReasoning,
    recommendedAction: buildRecommendedAction(status, routingBucket),
    routingBucket,
    slaHours: getSlaHours(status, routingBucket),
  };
}

export async function evaluateLeadForAgency(lead: EnterpriseLeadInput): Promise<LeadIntelligence> {
  const heuristic = buildHeuristicLeadIntelligence(lead);

  try {
    const aiResult = await analyzeLeadWithAI({
      name: lead.name,
      property: lead.property,
      propertyType: lead.property,
      location: lead.location,
      price: String(lead.price),
      contact: lead.contact || "sem contacto direto",
      source: lead.source || "Manual",
    });

    return mergeIntelligence(
      lead,
      heuristic,
      aiResult.score,
      aiResult.reasoning
    );
  } catch {
    return heuristic;
  }
}
