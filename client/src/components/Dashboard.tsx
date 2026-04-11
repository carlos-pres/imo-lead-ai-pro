import React from "react";
import type { Lead, LeadStats } from "../services/api";
import {
  AICopilotHero,
  DashboardErrorState,
  DashboardSkeleton,
  KPIOverviewRow,
  PriorityActionCard,
  PriorityLeadCard,
  QuickActionsBar,
} from "./DashboardCockpit";

interface DashboardProps {
  stats: LeadStats;
  topHotLeads: Lead[];
  followUpQueue: Lead[];
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  onOpenPipeline?: () => void;
  onOpenAutomation?: () => void;
  onOpenReports?: () => void;
  onFocusLead?: () => void;
  onOpenWhatsApp?: () => void;
  onOpenProposal?: () => void;
  onScheduleFollowUp?: () => void;
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  topHotLeads,
  followUpQueue,
  isLoading = false,
  error,
  onRetry,
  onOpenPipeline,
  onOpenAutomation,
  onOpenReports,
  onFocusLead,
  onOpenWhatsApp,
  onOpenProposal,
  onScheduleFollowUp,
}) => {
  if (isLoading) return <DashboardSkeleton />;
  if (error) return <DashboardErrorState message={error} onRetry={onRetry} />;

  const bestLead = topHotLeads[0];
  const opportunityValue = topHotLeads.slice(0, 3).reduce((sum, lead) => sum + lead.price, 0);
  const urgentCount = stats.overdue_followups + stats.urgent_actions;

  const heroData = {
    greeting: "Bom dia, Carlos.",
    summary: `Tem ${Math.max(3, stats.urgent_actions || 0)} oportunidades urgentes hoje.`,
    bestOpportunityTitle: bestLead ? bestLead.name : "Sem lead prioritário",
    bestOpportunity: bestLead
      ? `A melhor oportunidade é ${bestLead.name}.`
      : "A melhor oportunidade aparece aqui assim que houver novos leads.",
    recommendation: bestLead ? "Envie o valor de mercado agora." : "Abra o pipeline.",
    justification: bestLead
      ? `O lead tem score IA ${bestLead.aiScore}.`
      : "Ainda não há leads quentes suficientes.",
    primaryCta: bestLead ? `Abrir WhatsApp de ${bestLead.name}` : "Abrir WhatsApp",
    secondaryCta: bestLead ? `Abrir proposta de ${bestLead.name}` : "Abrir proposta",
    tertiaryCta: bestLead ? `Agendar seguimento de ${bestLead.name}` : "Agendar seguimento",
  };

  const priorityLead = bestLead
    ? {
        name: bestLead.name,
        location: bestLead.location,
        property: bestLead.property,
        score: bestLead.aiScore,
        value: formatEuro(bestLead.price),
        nextStep: bestLead.nextStep || bestLead.recommendedAction,
        channel: bestLead.outreachChannel || "WhatsApp",
        reasoning: bestLead.reasoning,
      }
    : {
        name: "Sem lead prioritário",
        location: "Aguardar nova entrada",
        property: "Cockpit sem nova oportunidade",
        score: 0,
        value: formatEuro(0),
        nextStep: "Abra o pipeline.",
        channel: "WhatsApp",
        reasoning: "Sem dados suficientes para recomendar uma ação específica.",
      };

  const kpis = [
    { label: "Leads em carteira", value: String(stats.total), detail: `${stats.quente} quentes e ${stats.morno} mornos` },
    { label: "Score médio IA", value: `${stats.average_ai_score}`, detail: opportunityValue > 0 ? formatEuro(opportunityValue) : "Sem valor em análise" },
    { label: "Ações urgentes", value: String(urgentCount), detail: `${followUpQueue.length} seguimentos` },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 pb-16 pt-6 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <AICopilotHero
          {...heroData}
          onOpenPipeline={onOpenPipeline}
          onOpenAutomation={onOpenAutomation}
          onOpenReports={onOpenReports}
        />
        <PriorityActionCard
          onOpenWhatsApp={onOpenWhatsApp}
          onOpenProposal={onOpenProposal}
          onScheduleFollowUp={onScheduleFollowUp}
          leadName={priorityLead.name}
        />
        <PriorityLeadCard {...priorityLead} onFocusLead={onFocusLead} />
        <KPIOverviewRow kpis={kpis} />
        <QuickActionsBar onOpenPipeline={onOpenPipeline} onOpenWhatsApp={onOpenWhatsApp} />
      </div>
    </div>
  );
};
