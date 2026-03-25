import OpenAI from "openai";
import { getAllLeads, type WorkspaceScope } from "../storage.js";
import { getOpenAIDefaultModel } from "../lib/aiModelConfig.js";

type Lead = Awaited<ReturnType<typeof getAllLeads>>[number];

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export interface MarketOpportunity {
  location: string;
  market: string;
  propertyType: string;
  averagePrice: number;
  totalLeads: number;
  opportunityScore: number;
  demandLevel: "high" | "medium" | "low";
  recommendation: string;
  topSources: string[];
  hotLeadCount: number;
  officeCount: number;
}

export interface MarketStrategistSnapshot {
  generatedAt: string;
  mode: "hybrid" | "heuristic";
  headline: string;
  summary: string;
  strategicActions: string[];
  opportunities: MarketOpportunity[];
}

function groupLeadsByLocation(leads: Lead[]) {
  const grouped: Record<string, Lead[]> = {};

  for (const lead of leads) {
    if (!grouped[lead.location]) {
      grouped[lead.location] = [];
    }

    grouped[lead.location].push(lead);
  }

  return grouped;
}

function calculateAveragePrice(leads: Lead[]) {
  const prices = leads
    .map((l) => parseFloat(String(l.price)))
    .filter((p) => !isNaN(p));

  if (prices.length === 0) return 0;

  const total = prices.reduce((a, b) => a + b, 0);

  return Math.round(total / prices.length);
}

function calculateOpportunityScore(leads: Lead[], avgPrice: number) {
  let score = leads.length * 5;

  if (avgPrice > 500000) score += 20;
  else if (avgPrice > 300000) score += 15;
  else score += 10;

  if (score > 100) score = 100;

  return score;
}

function determineDemandLevel(total: number): "high" | "medium" | "low" {
  if (total > 15) return "high";
  if (total > 7) return "medium";
  return "low";
}

function buildOpportunityRecommendation(
  demand: "high" | "medium" | "low",
  avgPrice: number,
  topSource: string
) {
  if (demand === "high") {
    return `Alta procura. Proteger follow-up e reforcar captacao nas fontes ${topSource}.`;
  }

  if (demand === "medium") {
    return avgPrice >= 300000
      ? `Mercado equilibrado com ticket relevante. Priorizar owners de growth e cadencia de visita.`
      : `Mercado equilibrado. Trabalhar qualificacao, resposta rapida e fontes ${topSource}.`;
  }

  return `Procura baixa. Usar abordagem de investidor e nutricao comercial antes de escalar outreach.`;
}

function buildHeuristicSnapshot(opportunities: MarketOpportunity[]): MarketStrategistSnapshot {
  const generatedAt = new Date().toISOString();

  if (opportunities.length === 0) {
    return {
      generatedAt,
      mode: "heuristic",
      headline: "Sem sinais suficientes para o estrategista nesta fase.",
      summary:
        "O radar estrategista fica ativo assim que a carteira ganhar localizacao, preco e prioridade suficientes.",
      strategicActions: [
        "Aumentar o volume de leads com localizacao e preco completos.",
        "Garantir follow-ups e owners atribuidos para o radar ficar operacional.",
      ],
      opportunities: [],
    };
  }

  const topOpportunity = opportunities[0];
  const secondaryOpportunity = opportunities[1] || null;
  const topSourcesLabel = topOpportunity.topSources.slice(0, 2).join(" e ") || "fontes lideres";
  const recommendedDesk =
    topOpportunity.demandLevel === "high"
      ? "flagship"
      : topOpportunity.averagePrice >= 300000
        ? "growth"
        : "nurture";

  return {
    generatedAt,
    mode: "heuristic",
    headline: `${topOpportunity.location} lidera o radar com score ${topOpportunity.opportunityScore}, ${topOpportunity.totalLeads} leads ativas e prioridade para a mesa ${recommendedDesk}.`,
    summary: `${topOpportunity.location} concentra a frente mais forte da carteira, com ticket medio de ${topOpportunity.averagePrice} EUR, ${topOpportunity.hotLeadCount} leads quentes e fontes ${topSourcesLabel}. ${secondaryOpportunity ? `${secondaryOpportunity.location} aparece como segunda frente para protecao e expansao.` : "O foco imediato continua concentrado numa unica frente comercial."}`,
    strategicActions: [
      `Acionar a mesa ${recommendedDesk} para ${topOpportunity.location} e proteger as proximas ${Math.max(3, topOpportunity.hotLeadCount || 1)} oportunidades com resposta em menos de 24h.`,
      `Reforcar captacao e outreach nas fontes ${topSourcesLabel} em ${topOpportunity.location}.`,
      secondaryOpportunity
        ? `Preparar a segunda frente em ${secondaryOpportunity.location} com mesa ${secondaryOpportunity.demandLevel === "high" ? "flagship" : "growth"} e leitura semanal dedicada.`
        : "Consolidar ownership e follow-up antes de abrir uma segunda frente geografica.",
    ],
    opportunities,
  };
}

async function buildAiNarrative(opportunities: MarketOpportunity[]) {
  if (!openai || opportunities.length === 0) {
    return null;
  }

  const response = await openai.chat.completions.create({
    model: getOpenAIDefaultModel(),
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a European real estate strategist AI for an enterprise real estate cockpit. Return strict JSON with keys headline, summary and strategicActions. strategicActions must be an array with exactly 3 short Portuguese strings. Be concrete, commercial and market-specific. Mention the strongest location explicitly. Avoid generic wording like 'oportunidades limitadas' or vague consultant language.",
      },
      {
        role: "user",
        content: JSON.stringify({
          instruction:
            "Analisa as oportunidades de mercado e responde em portugues europeu com foco comercial, sem markdown. A headline deve citar a melhor localizacao. O summary deve citar o ticket medio, a procura e as fontes mais fortes. As acoes devem soar a operacao comercial e nao a consultoria generica.",
          opportunities,
        }),
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "";
  const parsed = JSON.parse(content) as {
    headline?: string;
    summary?: string;
    strategicActions?: string[];
  };

  if (
    !parsed.headline ||
    !parsed.summary ||
    !Array.isArray(parsed.strategicActions) ||
    parsed.strategicActions.length === 0
  ) {
    return null;
  }

  return {
    headline: parsed.headline,
    summary: parsed.summary,
    strategicActions: parsed.strategicActions.slice(0, 3),
  };
}

function isSpecificNarrative(
  narrative: { headline: string; summary: string; strategicActions: string[] },
  topOpportunity: MarketOpportunity
) {
  const combinedText = [
    narrative.headline,
    narrative.summary,
    ...narrative.strategicActions,
  ]
    .join(" ")
    .toLowerCase();

  const mentionsLocation = combinedText.includes(topOpportunity.location.toLowerCase());
  const mentionsSource = topOpportunity.topSources.some((source) =>
    combinedText.includes(source.toLowerCase())
  );
  const hasActionVerb =
    /proteger|reforcar|acionar|priorizar|abrir|consolidar|captar|executar/.test(combinedText);

  return mentionsLocation && hasActionVerb && (mentionsSource || combinedText.includes("fonte"));
}

export async function analyzeMarketOpportunities(
  scope?: WorkspaceScope
): Promise<MarketStrategistSnapshot> {
  try {
    console.log("[MarketStrategist] Starting market analysis");

    const leads = await getAllLeads(scope);

    if (!leads || leads.length === 0) {
      console.log("[MarketStrategist] No leads found");
      return buildHeuristicSnapshot([]);
    }

    const grouped = groupLeadsByLocation(leads);

    const opportunities: MarketOpportunity[] = [];

    for (const location of Object.keys(grouped)) {

      const leadsInLocation = grouped[location];

      const avgPrice = calculateAveragePrice(leadsInLocation);

      const score = calculateOpportunityScore(leadsInLocation, avgPrice);

      const demand = determineDemandLevel(leadsInLocation.length);

      const sourceCounter = new Map<string, number>();
      const officeNames = new Set<string>();

      leadsInLocation.forEach((lead) => {
        sourceCounter.set(lead.source, (sourceCounter.get(lead.source) || 0) + 1);
        officeNames.add(lead.officeName);
      });

      const topSources = Array.from(sourceCounter.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 3)
        .map(([source]) => source);

      opportunities.push({
        location: location,
        market: leadsInLocation[0].market,
        propertyType: leadsInLocation[0].property || "Imovel residencial",
        averagePrice: avgPrice,
        totalLeads: leadsInLocation.length,
        opportunityScore: score,
        demandLevel: demand,
        recommendation: buildOpportunityRecommendation(
          demand,
          avgPrice,
          topSources[0] || "principais"
        ),
        topSources,
        hotLeadCount: leadsInLocation.filter((lead) => lead.status === "quente").length,
        officeCount: officeNames.size,
      });
    }

    opportunities.sort((left, right) => {
      if (right.opportunityScore !== left.opportunityScore) {
        return right.opportunityScore - left.opportunityScore;
      }

      return right.totalLeads - left.totalLeads;
    });

    const heuristicSnapshot = buildHeuristicSnapshot(opportunities);

    try {
      const aiNarrative = await buildAiNarrative(opportunities);

      if (!aiNarrative) {
        return heuristicSnapshot;
      }

      if (!isSpecificNarrative(aiNarrative, opportunities[0])) {
        console.warn("[MarketStrategist] AI narrative too generic, using heuristic snapshot.");
        return heuristicSnapshot;
      }

      return {
        ...heuristicSnapshot,
        mode: "hybrid",
        headline: aiNarrative.headline,
        summary: aiNarrative.summary,
        strategicActions: aiNarrative.strategicActions,
      };
    } catch (aiError) {
      console.error("[MarketStrategist] AI narrative fallback:", aiError);
      return heuristicSnapshot;
    }

  } catch (error) {
    console.error("[MarketStrategist] Error during analysis:", error);
    return buildHeuristicSnapshot([]);
  }
}
