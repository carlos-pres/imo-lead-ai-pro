import type { Lead } from "../services/api";
import { ActionButton } from "./ActionButton";

type DashboardCockpitHeroProps = {
  priorityLead?: Lead;
  urgentCount: number;
  averageResponseHours: number;
  onOpenWhatsApp?: () => void;
  onOpenPipeline?: () => void;
  onOpenProposal?: () => void;
  onImportLeads?: () => void;
  onOpenAutomation?: () => void;
};

function MiniStat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "accent" | "muted" }) {
  const toneStyles = {
    default: "border-[#13223714] bg-white/90 text-[#132237]",
    accent: "border-[#174dbb2a] bg-[#eff4ff] text-[#132237]",
    muted: "border-[#13223712] bg-[#f8fafc] text-[#415066]",
  } as const;

  return (
    <article className={`rounded-[22px] border p-4 shadow-[0_10px_24px_rgba(19,34,55,0.04)] ${toneStyles[tone]}`}>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#415066]">{label}</p>
      <strong className="mt-2 block text-2xl font-semibold tracking-tight text-inherit">{value}</strong>
    </article>
  );
}

function HeroEmptyState({
  onImportLeads,
  onOpenAutomation,
}: Pick<DashboardCockpitHeroProps, "onImportLeads" | "onOpenAutomation">) {
  return (
    <div className="rounded-[28px] border border-[#174dbb22] bg-gradient-to-br from-[#ffffff] via-[#fbfcff] to-[#f3f7ff] p-5 shadow-[0_18px_40px_rgba(19,34,55,0.06)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#eaf1ff] px-3 py-1 text-xs font-semibold text-[#174dbb]">Sem prioridade definida</span>
        <span className="rounded-full bg-[#f5f8ff] px-3 py-1 text-xs font-semibold text-[#415066]">IA ativa</span>
      </div>

      <div className="mt-4 max-w-3xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#174dbb]">Cockpit Comercial IA</p>
        <h2 className="text-3xl font-semibold tracking-tight text-[#132237] sm:text-4xl">Ainda sem prioridade automática</h2>
        <p className="max-w-2xl text-sm leading-6 text-[#415066]">
          Importe leads ou ative uma automação para o cockpit começar a recomendar a próxima melhor ação.
        </p>
        <p className="text-sm font-medium text-[#132237]">Ligue as suas fontes e comece a operar com IA.</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <ActionButton onClick={onImportLeads}>Importar leads</ActionButton>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#1322371f] bg-white px-4 py-2.5 text-sm font-semibold text-[#132237] transition hover:border-[#174dbb4a] hover:bg-[#f7faff]"
          onClick={onOpenAutomation}
          type="button"
        >
          Configuração guiada
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          "Sincronizar fonte",
          "Importar leads",
          "Ativar automação",
        ].map((step, index) => (
          <article className="rounded-[20px] border border-[#13223714] bg-white/80 p-4" key={step}>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#7a8698]">Passo {index + 1}</p>
            <strong className="mt-2 block text-sm font-semibold text-[#132237]">{step}</strong>
            <p className="mt-2 text-sm leading-6 text-[#415066]">
              {index === 0
                ? "Ligue a fonte principal para manter o cockpit sincronizado."
                : index === 1
                  ? "Traga a carteira para dentro da vista executiva."
                  : "Defina a primeira automação para o agente começar a agir."}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function DashboardCockpitHero({
  priorityLead,
  urgentCount,
  averageResponseHours,
  onOpenWhatsApp,
  onOpenPipeline,
  onOpenProposal,
  onImportLeads,
  onOpenAutomation,
}: DashboardCockpitHeroProps) {
  const urgentLabel = urgentCount > 0 ? `${urgentCount} oportunidades urgentes hoje` : "Sem urgência crítica";
  const responseLabel = averageResponseHours > 0 ? `${averageResponseHours}h` : "Sem histórico";
  const idealWindow = priorityLead ? `Próximas ${Math.max(4, priorityLead.slaHours || 8)}h` : "A definir";

  return (
    <section className="rounded-[32px] border border-[#1322371a] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] p-5 shadow-[0_24px_60px_rgba(19,34,55,0.08)]">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#eaf1ff] px-3 py-1 text-xs font-semibold text-[#174dbb]">IA ativa</span>
        <span className="rounded-full bg-[#f3f7ff] px-3 py-1 text-xs font-semibold text-[#415066]">{urgentLabel}</span>
        <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#415066]">Prioridade atual atualizada em tempo real</span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#174dbb]">Cockpit Comercial IA</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#132237] sm:text-5xl">Próxima melhor ação</h1>
          </div>

          {priorityLead ? (
            <div className="rounded-[28px] border border-[#13223714] bg-[#132237] p-5 text-white shadow-[0_20px_44px_rgba(19,34,55,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Lead em foco</p>
              <strong className="mt-3 block text-3xl font-semibold tracking-tight">{priorityLead.name}</strong>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
                {priorityLead.nextStep || priorityLead.recommendedAction || "Abrir pipeline"}
              </p>
              <p className="mt-3 text-sm text-white/70">
                Motivo: {priorityLead.reasoning || "Maior probabilidade de avanço nas próximas 8 horas."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white">Janela ideal: {idealWindow}</span>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white">Canal: {priorityLead.outreachChannel || "WhatsApp"}</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <ActionButton onClick={onOpenWhatsApp}>Abrir WhatsApp</ActionButton>
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                  onClick={onOpenPipeline}
                  type="button"
                >
                  Ver pipeline
                </button>
                <button
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-transparent px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                  onClick={onOpenProposal}
                  type="button"
                >
                  Abrir proposta
                </button>
              </div>
            </div>
          ) : (
            <HeroEmptyState onImportLeads={onImportLeads} onOpenAutomation={onOpenAutomation} />
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <MiniStat label="Urgentes hoje" value={String(urgentCount)} tone="accent" />
          <MiniStat label="Janela ideal" value={idealWindow} />
          <MiniStat label="Tempo médio de resposta" value={responseLabel} tone="muted" />
          <MiniStat label="IA ativa" value="Sim" tone="accent" />
        </div>
      </div>
    </section>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="h-72 animate-pulse rounded-[32px] border border-[#13223714] bg-white/80" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-64 animate-pulse rounded-[28px] border border-[#13223714] bg-white/80" />
        <div className="h-64 animate-pulse rounded-[28px] border border-[#13223714] bg-white/80" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-[28px] border border-[#13223714] bg-white/80" />
        <div className="h-72 animate-pulse rounded-[28px] border border-[#13223714] bg-white/80" />
      </div>
    </div>
  );
}

export function DashboardErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full rounded-[32px] border border-[#1322371a] bg-white/90 p-6 text-[#132237] shadow-[0_20px_44px_rgba(19,34,55,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#174dbb]">Cockpit indisponível</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Não foi possível carregar o cockpit</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#415066]">{message}</p>
        {onRetry ? (
          <ActionButton className="mt-4" onClick={onRetry}>
            Tentar novamente
          </ActionButton>
        ) : null}
      </div>
    </div>
  );
}

