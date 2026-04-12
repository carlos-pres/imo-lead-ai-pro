import type { Lead, LeadStats } from "../services/api";

export type RoiMetrics = {
  averageResponseHours: number;
  contactRate: number;
  conversionRate: number;
  recoveredPotentialValue: number;
};

export function selectPriorityLead(leads: Lead[]) {
  return [...leads]
    .sort((a, b) => computeLeadPriorityScore(b) - computeLeadPriorityScore(a))
    .at(0);
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

export function selectCoolingLeads(leads: Lead[]) {
  const now = Date.now();

  return [...leads]
    .filter((lead) => {
      const lastContactAt = lead.lastContactAt ? new Date(lead.lastContactAt).getTime() : 0;
      const hoursWithoutContact = lastContactAt ? (now - lastContactAt) / (1000 * 60 * 60) : 999;
      return (lead.status === "quente" || lead.status === "morno") && hoursWithoutContact > 48;
    })
    .sort((a, b) => computeLeadPriorityScore(b) - computeLeadPriorityScore(a));
}

export function selectHeatingLeads(leads: Lead[]) {
  return [...leads]
    .filter((lead) => lead.status !== "quente" && lead.aiScore >= 70)
    .sort((a, b) => computeLeadPriorityScore(b) - computeLeadPriorityScore(a));
}

export function computeLeadPriorityScore(lead: Lead) {
  const stageWeight = lead.pipelineStage === "proposta" ? 20 : lead.pipelineStage === "visita" ? 14 : 8;
  const heatWeight = lead.status === "quente" ? 25 : lead.status === "morno" ? 10 : 2;
  const lastContactAt = lead.lastContactAt ? new Date(lead.lastContactAt).getTime() : 0;
  const hoursWithoutContact = lastContactAt ? (Date.now() - lastContactAt) / (1000 * 60 * 60) : 72;
  const urgencyWeight = Math.max(0, 24 - Math.min(24, hoursWithoutContact / 2));
  const valueWeight = Math.min(30, lead.price / 10000);

  return Math.round(lead.aiScore * 1.6 + stageWeight + heatWeight + urgencyWeight + valueWeight);
}

export function getLeadRiskLevel(lead: Lead) {
  const now = Date.now();
  const lastContactAt = lead.lastContactAt ? new Date(lead.lastContactAt).getTime() : 0;
  const hoursWithoutContact = lastContactAt ? (now - lastContactAt) / (1000 * 60 * 60) : 999;
  const riskScore =
    (lead.status === "quente" ? 30 : lead.status === "morno" ? 20 : 10) +
    (hoursWithoutContact > 72 ? 35 : hoursWithoutContact > 48 ? 25 : 10) +
    (lead.pipelineStage === "proposta" || lead.pipelineStage === "visita" ? 20 : 6);

  if (riskScore >= 75) return "Alto";
  if (riskScore >= 50) return "Médio";
  return "Baixo";
}

export function getLeadMomentum(lead: Lead) {
  const priority = computeLeadPriorityScore(lead);
  if (priority >= 170) return "A aquecer";
  if (priority >= 130) return "Estável";
  return "A arrefecer";
}

export function selectRoiMetrics(leads: Lead[]): RoiMetrics {
  if (!leads.length) {
    return {
      averageResponseHours: 0,
      contactRate: 0,
      conversionRate: 0,
      recoveredPotentialValue: 0,
    };
  }

  const contactedLeads = leads.filter((lead) => Boolean(lead.lastContactAt));
  const convertedLeads = leads.filter(
    (lead) => lead.pipelineStage === "visita" || lead.pipelineStage === "proposta"
  );

  const responseHours = contactedLeads
    .map((lead) => {
      const createdAt = new Date(lead.createdAt).getTime();
      const lastContactAt = lead.lastContactAt ? new Date(lead.lastContactAt).getTime() : 0;

      if (!createdAt || !lastContactAt || Number.isNaN(createdAt) || Number.isNaN(lastContactAt)) {
        return 0;
      }

      return Math.max(0, (lastContactAt - createdAt) / (1000 * 60 * 60));
    })
    .filter((value) => value > 0);

  const averageResponseHours = responseHours.length
    ? Math.round(responseHours.reduce((sum, value) => sum + value, 0) / responseHours.length)
    : 0;

  const contactRate = Math.round((contactedLeads.length / leads.length) * 100);
  const conversionRate = Math.round((convertedLeads.length / leads.length) * 100);
  const recoveredPotentialValue = convertedLeads.reduce((sum, lead) => sum + (lead.price || 0), 0);

  return {
    averageResponseHours,
    contactRate,
    conversionRate,
    recoveredPotentialValue,
  };
}
