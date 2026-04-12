import React from "react";
import type { Lead, LeadStats } from "../services/api";
import { selectAverageAIScore, selectCoolingLeads, selectHeatingLeads, selectPipelineValue, selectPriorityLead, selectRecommendedNextAction, selectRoiMetrics, selectUrgentLeadCount } from "../lib/selectors";
import { formatEuro } from "../lib/utils";
import {
  AICopilotHero,
  DashboardErrorState,
  DashboardSkeleton,
  KPIOverviewRow,
  PriorityActionCard,
  PriorityLeadCard,
  QuickActionsBar,
} from "./DashboardCockpit";
import { ActivityFeed } from "./ActivityFeed";
import { OnboardingPanel } from "./OnboardingPanel";
import { PipelineSummaryPanel } from "./PipelineSummaryPanel";
import { RoiPanel } from "./RoiPanel";
import { TasksPanel } from "./TasksPanel";

interface DashboardProps {
  stats: LeadStats;
  topHotLeads: Lead[];
  followUpQueue: Lead[];
  allLeads?: Lead[];
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
  onImportCsv?: (file: File) => void | Promise<void>;
  onSyncApi?: () => void | Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  topHotLeads,
  followUpQueue,
  allLeads = [],
  isLoading = false,
  error,
  onRetry,
  onOpenPipeline,
  onOpenAutomation,
  onFocusLead,
  onOpenWhatsApp,
  onOpenProposal,
  onScheduleFollowUp,
  onImportCsv,
  onSyncApi,
}) => {
  if (isLoading) return <DashboardSkeleton />;
  if (error) return <DashboardErrorState message={error} onRetry={onRetry} />;

  const priorityLead = selectPriorityLead(topHotLeads.length ? topHotLeads : followUpQueue);
  const opportunityValue = selectPipelineValue(topHotLeads.slice(0, 3));
  const urgentCount = selectUrgentLeadCount(stats);
  const avgScore = selectAverageAIScore(topHotLeads.length ? topHotLeads : followUpQueue);
  const heatingLeads = selectHeatingLeads(topHotLeads.length ? topHotLeads : followUpQueue);
  const coolingLeads = selectCoolingLeads(topHotLeads.length ? topHotLeads : followUpQueue);
  const roiMetrics = selectRoiMetrics(allLeads.length ? allLeads : [...topHotLeads, ...followUpQueue]);
  const nextAction = selectRecommendedNextAction(priorityLead);

  const heroData = {
    greeting: "Hoje o foco está certo.",
    summary: `Tem ${Math.max(5, urgentCount || 0)} oportunidades urgentes hoje.`,
    bestOpportunityTitle: priorityLead ? priorityLead.name : "Sem lead prioritário",
    bestOpportunity: priorityLead
      ? `A melhor oportunidade é ${priorityLead.name}.`
      : "A melhor oportunidade aparece aqui assim que houver leads com prioridade alta.",
    recommendation: priorityLead
      ? `Ação recomendada agora: ${priorityLead.recommendedAction}`
      : "Ação recomendada agora: abrir pipeline.",
    justification: priorityLead
      ? `Motivo da prioridade: score elevado, contacto recente e forte intenção.`
      : "Ainda não há leads suficientes para recomendar um lead prioritário.",
    primaryCta: priorityLead ? `Abrir WhatsApp de ${priorityLead.name}` : "Abrir WhatsApp",
    secondaryCta: priorityLead ? `Abrir proposta de ${priorityLead.name}` : "Abrir proposta",
    tertiaryCta: "Ver pipeline",
  };

  const priorityLeadCard = priorityLead
    ? {
        name: priorityLead.name,
        location: priorityLead.location,
        property: priorityLead.property,
        score: priorityLead.aiScore,
        value: formatEuro(priorityLead.price),
        nextStep: priorityLead.nextStep || priorityLead.recommendedAction,
        channel: priorityLead.outreachChannel || "WhatsApp",
        reasoning: priorityLead.reasoning,
      }
    : {
        name: "Sem lead prioritário",
        location: "A aguardar novos leads",
        property: "Cockpit pronto para receber oportunidades",
        score: 0,
        value: formatEuro(0),
        nextStep: "Abrir pipeline",
        channel: "WhatsApp",
        reasoning: "Fallback elegante ativo até existirem leads suficientes para priorização.",
      };

  const kpis = [
    { label: "Leads em carteira", value: String(stats.total), detail: "Carteira ativa" },
    { label: "Quentes", value: String(stats.quente), detail: "Prontos a agir" },
    { label: "Mornos", value: String(stats.morno), detail: "Em nutrição" },
    { label: "Frios", value: String(stats.frio), detail: "Reativação" },
    { label: "Urgentes", value: String(urgentCount), detail: "Ação imediata" },
    { label: "Score médio IA", value: String(avgScore || stats.average_ai_score), detail: "Leitura executiva" },
    { label: "Tarefas pendentes", value: String(stats.overdue_followups), detail: "Seguimento" },
    { label: "Valor potencial total", value: formatEuro(opportunityValue || priorityLead?.price || 0), detail: "Pipeline ativo" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 pb-16 pt-6 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <AICopilotHero
          {...heroData}
          onPrimaryAction={onOpenWhatsApp}
          onSecondaryAction={onOpenProposal}
          onTertiaryAction={onOpenPipeline}
        />
        <OnboardingPanel
          totalLeads={stats.total}
          priorityLeadName={priorityLeadCard.name !== "Sem lead prioritário" ? priorityLeadCard.name : undefined}
          hasFollowUp={followUpQueue.length > 0}
          hasAutomation={stats.urgent_actions > 0}
          onImportCsv={onImportCsv}
          onSyncApi={onSyncApi}
          onOpenPipeline={onOpenPipeline}
          onOpenAutomation={onOpenAutomation}
          onScheduleFollowUp={onScheduleFollowUp}
        />
        <RoiPanel metrics={roiMetrics} />
        <KPIOverviewRow kpis={kpis} />
        <PriorityActionCard
          onOpenWhatsApp={onOpenWhatsApp}
          onOpenProposal={onOpenProposal}
          onScheduleFollowUp={onScheduleFollowUp}
          leadName={priorityLeadCard.name}
        />
        <div id="agent-panel">
          <PriorityLeadCard {...priorityLeadCard} onFocusLead={onFocusLead} />
        </div>
        <section className="grid gap-4 lg:grid-cols-2">
          <TasksPanel leads={followUpQueue} onScheduleFollowUp={onScheduleFollowUp} onOpenAutomation={onOpenAutomation} />
          <ActivityFeed leads={[...heatingLeads, ...coolingLeads]} />
        </section>
        <QuickActionsBar onOpenPipeline={onOpenPipeline} onOpenWhatsApp={onOpenWhatsApp} />
        <PipelineSummaryPanel
          priorityLeadName={priorityLeadCard.name}
          recommendedAction={nextAction}
          activeLeadCount={topHotLeads.length + followUpQueue.length}
          onOpenPipeline={onOpenPipeline}
        />
      </div>
    </div>
  );
};
