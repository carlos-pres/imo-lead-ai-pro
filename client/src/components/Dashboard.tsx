import React, { useRef } from "react";
import type { Lead, LeadStats } from "../services/api";
import {
  computeLeadPriorityScore,
  selectAverageAIScore,
  selectPriorityLead,
  selectRoiMetrics,
  selectUrgentLeadCount,
} from "../lib/selectors";
import { ActivityFeed } from "./ActivityFeed";
import { DashboardCockpitHero, DashboardErrorState, DashboardSkeleton } from "./DashboardCockpit";
import { OnboardingPanel } from "./OnboardingPanel";
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

type PortfolioGroup = {
  title: string;
  subtitle: string;
  count: number;
  leadNames: string[];
  tone: "blue" | "emerald" | "amber" | "rose";
};

function leadNames(leads: Lead[]) {
  return leads.slice(0, 2).map((lead) => lead.name);
}

function isUrgentLead(lead: Lead) {
  return lead.slaHours <= 8 || lead.pipelineStage === "proposta" || lead.pipelineStage === "visita";
}

function PortfolioCard({ group }: { group: PortfolioGroup }) {
  const toneStyles: Record<PortfolioGroup["tone"], string> = {
    blue: "border-[#174dbb24] bg-[#f7faff] text-[#132237]",
    emerald: "border-emerald-200 bg-emerald-50 text-[#132237]",
    amber: "border-amber-200 bg-amber-50 text-[#132237]",
    rose: "border-rose-200 bg-rose-50 text-[#132237]",
  };

  const note =
    group.count > 0
      ? group.leadNames.length > 0
        ? group.leadNames.join(" · ")
        : "Fila pronta para detalhar"
      : "Ainda sem dados suficientes";

  return (
    <article className={`rounded-[24px] border p-4 shadow-[0_12px_28px_rgba(19,34,55,0.04)] ${toneStyles[group.tone]}`}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#7a8698]">{group.title}</p>
      <strong className="mt-2 block text-2xl font-semibold tracking-tight text-[#132237]">{group.count}</strong>
      <p className="mt-1 text-sm font-medium text-[#415066]">{group.subtitle}</p>
      <p className="mt-3 text-sm text-[#415066]">{note}</p>
    </article>
  );
}

function SectionShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#13223714] bg-white/90 p-5 shadow-[0_16px_36px_rgba(19,34,55,0.05)]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#174dbb]">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#132237]">{title}</h2>
          {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-[#415066]">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
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
  onOpenReports,
  onFocusLead,
  onOpenWhatsApp,
  onOpenProposal,
  onImportCsv,
  onSyncApi,
}) => {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const openImportLeads = () => {
    if (onImportCsv) {
      importInputRef.current?.click();
      return;
    }

    onOpenPipeline?.();
  };

  const handleImportChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImportCsv) {
      await onImportCsv(file);
    }
    event.currentTarget.value = "";
  };

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <DashboardErrorState message={error} onRetry={onRetry} />;

  const leadPool = topHotLeads.length ? topHotLeads : followUpQueue;
  const combinedLeads = [...allLeads, ...leadPool];
  const uniqueLeadMap = new Map<string, Lead>();
  [...combinedLeads].forEach((lead) => uniqueLeadMap.set(lead.id, lead));
  const uniqueLeads = [...uniqueLeadMap.values()].sort((a, b) => computeLeadPriorityScore(b) - computeLeadPriorityScore(a));
  const priorityLead = selectPriorityLead(leadPool.length ? leadPool : uniqueLeads);
  const urgentCount = selectUrgentLeadCount(stats);
  const averagePriority = selectAverageAIScore(uniqueLeads);
  const roiMetrics = selectRoiMetrics(uniqueLeads);
  const urgentTasks = [...followUpQueue]
    .sort((a, b) => computeLeadPriorityScore(b) - computeLeadPriorityScore(a))
    .slice(0, 4);

  const portfolioGroups: PortfolioGroup[] = [
    {
      title: "Quentes",
      subtitle: "Com intenção elevada",
      count: stats.quente,
      leadNames: leadNames(uniqueLeads.filter((lead) => lead.status === "quente")),
      tone: "blue",
    },
    {
      title: "Em acompanhamento",
      subtitle: "Em seguimento",
      count: stats.morno,
      leadNames: leadNames(uniqueLeads.filter((lead) => lead.status === "morno")),
      tone: "emerald",
    },
    {
      title: "Reativação",
      subtitle: "A recuperar",
      count: stats.frio,
      leadNames: leadNames(uniqueLeads.filter((lead) => lead.status === "frio")),
      tone: "amber",
    },
    {
      title: "Urgentes",
      subtitle: "Exigem resposta hoje",
      count: urgentCount,
      leadNames: leadNames(uniqueLeads.filter(isUrgentLead)),
      tone: "rose",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fffaf4] via-[#f7faff] to-[#efe4d3] pb-16 pt-6 text-[#132237]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <input ref={importInputRef} accept=".csv,text/csv" className="hidden" onChange={handleImportChange} type="file" />

        <DashboardCockpitHero
          averageResponseHours={roiMetrics.averageResponseHours}
          onImportLeads={openImportLeads}
          onOpenAutomation={onOpenAutomation}
          onOpenPipeline={onOpenPipeline}
          onOpenProposal={onOpenProposal}
          onOpenWhatsApp={onOpenWhatsApp}
          priorityLead={priorityLead}
          urgentCount={urgentCount}
        />

        <TasksPanel
          leads={urgentTasks}
          onContactLead={() => {
            onFocusLead?.();
            onOpenWhatsApp?.();
          }}
          onImportLeads={openImportLeads}
          onOpenAutomation={onOpenAutomation}
        />

        <SectionShell
          eyebrow="Carteira ativa"
          title="Leads em operação"
          description="As prioridades organizadas por intensidade comercial para apoiar a próxima decisão sem ruído visual."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {portfolioGroups.map((group) => (
              <PortfolioCard group={group} key={group.title} />
            ))}
          </div>
        </SectionShell>

        <RoiPanel leadCount={uniqueLeads.length} metrics={roiMetrics} averagePriority={averagePriority} />

        <section className="grid gap-6 xl:grid-cols-2">
          <ActivityFeed leads={uniqueLeads} />

          <OnboardingPanel
          hasAutomation={stats.urgent_actions > 0}
          hasFollowUp={followUpQueue.length > 0}
          onImportLeads={openImportLeads}
          onOpenAutomation={onOpenAutomation}
          onOpenPipeline={onOpenPipeline}
          onSyncApi={onSyncApi}
          priorityLeadName={priorityLead?.name}
          totalLeads={stats.total}
          />
        </section>

        <div className="flex flex-wrap gap-3">
          {onOpenPipeline ? (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#1322371f] bg-white px-4 py-2.5 text-sm font-semibold text-[#132237] transition hover:border-[#174dbb4a] hover:bg-[#f7faff]"
              onClick={onOpenPipeline}
              type="button"
            >
              Abrir pipeline
            </button>
          ) : null}
          {onOpenReports ? (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#1322371f] bg-white px-4 py-2.5 text-sm font-semibold text-[#132237] transition hover:border-[#174dbb4a] hover:bg-[#f7faff]"
              onClick={onOpenReports}
              type="button"
            >
              Ver relatórios
            </button>
          ) : null}
          {onOpenAutomation ? (
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#1322371f] bg-white px-4 py-2.5 text-sm font-semibold text-[#132237] transition hover:border-[#174dbb4a] hover:bg-[#f7faff]"
              onClick={onOpenAutomation}
              type="button"
            >
              Abrir automações
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

