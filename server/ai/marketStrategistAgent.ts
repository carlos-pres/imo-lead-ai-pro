import OpenAI from "openai";
import { storage } from "../storage";
type Lead = any;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface MarketOpportunity {
  location: string;
  propertyType: string;
  averagePrice: number;
  totalLeads: number;
  opportunityScore: number;
  demandLevel: "high" | "medium" | "low";
  recommendation: string;
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

export async function analyzeMarketOpportunities(): Promise<MarketOpportunity[]> {
  try {

    console.log("[MarketStrategist] Starting market analysis");

    const leads = await storage.getAllLeads();

    if (!leads || leads.length === 0) {
      console.log("[MarketStrategist] No leads found");
      return [];
    }

    const grouped = groupLeadsByLocation(leads);

    const opportunities: MarketOpportunity[] = [];

    for (const location of Object.keys(grouped)) {

      const leadsInLocation = grouped[location];

      const avgPrice = calculateAveragePrice(leadsInLocation);

      const score = calculateOpportunityScore(leadsInLocation, avgPrice);

      const demand = determineDemandLevel(leadsInLocation.length);

      opportunities.push({
        location: location,
        propertyType: leadsInLocation[0].propertyType,
        averagePrice: avgPrice,
        totalLeads: leadsInLocation.length,
        opportunityScore: score,
        demandLevel: demand,
        recommendation:
          demand === "high"
            ? "High demand area. Focus on acquiring listings."
            : demand === "medium"
            ? "Balanced market. Monitor price trends."
            : "Low demand area. Consider investor targeting."
      });
    }

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a European real estate strategist AI. " +
            "Analyze property markets and detect investment opportunities."
        },
        {
          role: "user",
          content:
            "Analyze these property opportunities: " +
            JSON.stringify(opportunities)
        }
      ]
    });

    const insights = aiResponse.choices[0].message.content;

    console.log("[MarketStrategist] AI insights:");
    console.log(insights);

    return opportunities;

  } catch (error) {

    console.error("[MarketStrategist] Error during analysis:", error);

    return [];
  }
}