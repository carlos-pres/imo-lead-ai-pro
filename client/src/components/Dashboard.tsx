import React from "react";
import type { Lead, LeadStats } from "../services/api";
import { selectAverageAIScore, selectPipelineValue, selectPriorityLead, selectRecommendedNextAction, selectUrgentLeadCount } from "../lib/selectors";
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

  const priorityLead = selectPriorityLead(topHotLeads.length ? topHotLeads : followUpQueue);
  const opportunityValue = selectPipelineValue(topHotLeads.slice(0, 3));
  const urgentCount = selectUrgentLeadCount(stats);
  const avgScore = selectAverageAIScore(topHotLeads.length ? topHotLeads : followUpQueue);
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
    tertiaryCta: priorityLead ? `Agendar seguimento de ${priorityLead.name}` : "Agendar seguimento",
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
          onOpenPipeline={onOpenPipeline}
          onOpenAutomation={onOpenAutomation}
          onOpenReports={onOpenReports}
        />
        <KPIOverviewRow kpis={kpis} />
        <PriorityActionCard
          onOpenWhatsApp={onOpenWhatsApp}
          onOpenProposal={onOpenProposal}
          onScheduleFollowUp={onScheduleFollowUp}
          leadName={priorityLeadCard.name}
        />
        <PriorityLeadCard {...priorityLeadCard} onFocusLead={onFocusLead} />
        <QuickActionsBar onOpenPipeline={onOpenPipeline} onOpenWhatsApp={onOpenWhatsApp} />
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Resumo da pipeline</p>
              <h2 className="text-xl font-semibold text-white">Leitura rápida da operação</h2>
            </div>
            <button className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={onOpenPipeline} type="button">
              Ver pipeline
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
              <p className="text-sm text-slate-200">Lead prioritário</p>
              <strong className="mt-1 block text-lg text-white">{priorityLeadCard.name}</strong>
            </article>
            <article className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
              <p className="text-sm text-slate-200">Ação recomendada</p>
              <strong className="mt-1 block text-lg text-white">{nextAction}</strong>
            </article>
            <article className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
              <p className="text-sm text-slate-200">Pipeline visível</p>
              <strong className="mt-1 block text-lg text-white">{topHotLeads.length + followUpQueue.length} leads ativos</strong>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
};
