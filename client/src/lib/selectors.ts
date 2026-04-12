import type { Lead, LeadStats } from "../services/api";

export function selectPriorityLead(leads: Lead[]) {
  return [...leads].sort((a, b) => {
    const aScore = a.aiScore * 2 + a.price / 10000 + (a.status === "quente" ? 25 : a.status === "morno" ? 10 : 0);
    const bScore = b.aiScore * 2 + b.price / 10000 + (b.status === "quente" ? 25 : b.status === "morno" ? 10 : 0);
    return bScore - aScore;
  })[0];
}

export function selectUrgentLeadCount(stats: LeadStats) {
  return stats.urgent_actions + stats.overdue_followups;
}

export function selectPipelineValue(leads: Lead[]) {
  return leads.reduce((sum, lead) => sum + (lead.price || 0), 0);
}

export function selectAverageAIScore(leads: Lead[]) {
  if (!leads.length) return 0;
  return Math.round(leads.reduce((sum, lead) => sum + (lead.aiScore || 0), 0) / leads.length);
}

export function selectRecommendedNextAction(lead?: Lead) {
  if (!lead) return "Abrir pipeline";
  return lead.recommendedAction || lead.nextStep || "Abrir WhatsApp";
}

