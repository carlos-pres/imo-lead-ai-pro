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
    summary: `Tem ${Math.max(3, stats.urgent_actions || 0)} oportunidades que exigem atenção hoje.`,
    bestOpportunityTitle: bestLead ? bestLead.name : "Sem lead prioritário",
    bestOpportunity: bestLead
      ? `A mais promissora neste momento é ${bestLead.name}.`
      : "A oportunidade mais promissora será destacada assim que houver novos leads.",
    recommendation: bestLead
      ? "Recomendo enviar o valor de mercado agora e agendar seguimento ainda hoje."
      : "Recomendo abrir o pipeline e preparar a próxima sequência de contacto.",
    justification: bestLead
      ? `O lead tem score IA ${bestLead.aiScore} e já está numa fase crítica de decisão comercial.`
      : "Não há leads quentes suficientes para priorização automática neste momento.",
    primaryCta: bestLead ? `Contactar ${bestLead.name}` : "Contactar agora",
    secondaryCta: bestLead ? `Ver proposta de ${bestLead.name}` : "Abrir pipeline",
    tertiaryCta: bestLead ? `Agendar seguimento de ${bestLead.name}` : "Ver automações",
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
        nextStep: "Abra o pipeline para validar novas entradas.",
        channel: "WhatsApp",
        reasoning: "Sem dados suficientes para recomendar uma ação específica.",
      };

  const kpis = [
    {
      label: "Leads em carteira",
      value: String(stats.total),
      detail: `${stats.quente} quentes e ${stats.morno} mornos`,
    },
    {
      label: "Score médio IA",
      value: `${stats.average_ai_score}`,
      detail: opportunityValue > 0 ? formatEuro(opportunityValue) : "Sem valor em análise",
    },
    {
      label: "Ações urgentes",
      value: String(urgentCount),
      detail: `${followUpQueue.length} follow-ups ativos`,
    },
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
        <QuickActionsBar
          onOpenPipeline={onOpenPipeline}
          onOpenAutomation={onOpenAutomation}
          onOpenWhatsApp={onOpenWhatsApp}
          onScheduleFollowUp={onScheduleFollowUp}
          leadName={priorityLead.name}
        />
      </div>
    </div>
  );
};
