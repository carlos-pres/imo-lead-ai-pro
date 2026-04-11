import { ChevronRight, RefreshCcw, Sparkles, Target, WifiOff } from "lucide-react";

type KpiItem = {
  label: string;
  value: string;
  detail: string;
};

export function AICopilotHero({
  greeting,
  summary,
  bestOpportunityTitle,
  bestOpportunity,
  recommendation,
  justification,
  primaryCta,
  secondaryCta,
  tertiaryCta,
  onOpenPipeline,
  onOpenAutomation,
  onOpenReports,
}: {
  greeting: string;
  summary: string;
  bestOpportunityTitle: string;
  bestOpportunity: string;
  recommendation: string;
  justification: string;
  primaryCta: string;
  secondaryCta: string;
  tertiaryCta: string;
  onOpenPipeline?: () => void;
  onOpenAutomation?: () => void;
  onOpenReports?: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-indigo-400/20 bg-slate-900/75 p-6 shadow-2xl shadow-indigo-950/25 sm:p-8 lg:p-10">
      <div className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-100">
            <Sparkles className="h-3.5 w-3.5" />
            Agente IA ativo
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
              Mesa de decisão comercial
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              {greeting} {summary}
            </h1>
          </div>
          <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">{bestOpportunity}</p>
          <div className="grid gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/45 p-4">
            <p className="text-sm font-semibold text-indigo-100">{recommendation}</p>
            <p className="text-sm leading-relaxed text-slate-300">{justification}</p>
          </div>
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/25 transition hover:brightness-110"
              onClick={onOpenPipeline}
              type="button"
            >
              {primaryCta}
              <Target className="h-4 w-4" />
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-950/60 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-indigo-400/50"
              onClick={onOpenAutomation}
              type="button"
            >
              {secondaryCta}
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-950/60 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/50"
              onClick={onOpenReports}
              type="button"
            >
              {tertiaryCta}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            Se é a sua primeira vez, comece por <strong className="text-slate-200">Contactar agora</strong> ou{" "}
            <strong className="text-slate-200">Abrir pipeline</strong>.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-700/80 bg-slate-950/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Melhor oportunidade
          </p>
          <div className="mt-3 space-y-3">
            <h2 className="text-2xl font-semibold text-white">{bestOpportunityTitle}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3">
                <span className="text-xs uppercase tracking-wider text-slate-400">Estado</span>
                <strong className="mt-1 block text-lg text-white">Prioridade máxima</strong>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3">
                <span className="text-xs uppercase tracking-wider text-slate-400">Janela</span>
                <strong className="mt-1 block text-lg text-white">Ainda hoje</strong>
              </div>
            </div>
            <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-4">
              <p className="text-sm font-semibold text-indigo-100">Próxima ação recomendada</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-200">{recommendation}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PriorityActionCard({
  onOpenWhatsApp,
  onOpenProposal,
  onScheduleFollowUp,
}: {
  onOpenWhatsApp?: () => void;
  onOpenProposal?: () => void;
  onScheduleFollowUp?: () => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">Passo 1, 2, 3</p>
          <h2 className="text-xl font-semibold text-white">O caminho mais rápido para começar</h2>
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-300">
        Um utilizador novo consegue avançar sem procurar menus nem aprender o sistema.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <button
          className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4 text-left transition hover:border-indigo-400/45"
          onClick={onOpenWhatsApp}
          type="button"
        >
          <p className="text-xs uppercase tracking-wider text-slate-400">1. Responder já</p>
          <strong className="mt-1 block text-white">Enviar no WhatsApp</strong>
          <p className="mt-2 text-sm text-slate-300">Abre a conversa com contexto comercial.</p>
        </button>
        <button
          className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4 text-left transition hover:border-indigo-400/45"
          onClick={onOpenProposal}
          type="button"
        >
          <p className="text-xs uppercase tracking-wider text-slate-400">2. Mostrar valor</p>
          <strong className="mt-1 block text-white">Ver proposta</strong>
          <p className="mt-2 text-sm text-slate-300">Mostra o argumento pronto a apresentar.</p>
        </button>
        <button
          className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4 text-left transition hover:border-indigo-400/45"
          onClick={onScheduleFollowUp}
          type="button"
        >
          <p className="text-xs uppercase tracking-wider text-slate-400">3. Garantir seguimento</p>
          <strong className="mt-1 block text-white">Agendar seguimento</strong>
          <p className="mt-2 text-sm text-slate-300">Evita que a oportunidade arrefeça.</p>
        </button>
      </div>
    </section>
  );
}

export function PriorityLeadCard({
  name,
  location,
  property,
  score,
  value,
  nextStep,
  channel,
  reasoning,
  onFocusLead,
}: {
  name: string;
  location: string;
  property: string;
  score: number;
  value: string;
  nextStep: string;
  channel: string;
  reasoning: string;
  onFocusLead?: () => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">
            Lead prioritário
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{name}</h2>
          <p className="mt-1 text-sm text-slate-300">
            {location} · {property}
          </p>
        </div>
        <div className="rounded-2xl border border-indigo-400/25 bg-indigo-500/10 px-4 py-3 text-right">
          <span className="text-xs uppercase tracking-wider text-indigo-100">Score IA</span>
          <strong className="block text-2xl text-white">{score}</strong>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
          <span className="text-xs uppercase tracking-wider text-slate-400">Valor</span>
          <strong className="mt-1 block text-lg text-white">{value}</strong>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
          <span className="text-xs uppercase tracking-wider text-slate-400">Canal recomendado</span>
          <strong className="mt-1 block text-lg text-white">{channel}</strong>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
          <span className="text-xs uppercase tracking-wider text-slate-400">Próxima ação</span>
          <strong className="mt-1 block text-lg text-white">{nextStep}</strong>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/55 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Justificação</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">{reasoning}</p>
      </div>
      <button
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-indigo-400/35 bg-indigo-500/10 px-4 py-2.5 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/20"
        onClick={onFocusLead}
        type="button"
      >
        Focar este lead
        <ChevronRight className="h-4 w-4" />
      </button>
    </section>
  );
}

export function KPIOverviewRow({ kpis }: { kpis: KpiItem[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {kpis.map((kpi) => (
        <article className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-5" key={kpi.label}>
          <p className="text-sm text-slate-300">{kpi.label}</p>
          <strong className="mt-2 block text-3xl font-semibold text-white">{kpi.value}</strong>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-200">
            {kpi.detail}
          </p>
        </article>
      ))}
    </section>
  );
}

export function QuickActionsBar({
  onOpenPipeline,
  onOpenAutomation,
  onOpenWhatsApp,
  onOpenProposal,
  onScheduleFollowUp,
}: {
  onOpenPipeline?: () => void;
  onOpenAutomation?: () => void;
  onOpenWhatsApp?: () => void;
  onOpenProposal?: () => void;
  onScheduleFollowUp?: () => void;
}) {
  const actions = [
    { label: "Contactar agora", onClick: onOpenWhatsApp },
    { label: "Abrir pipeline", onClick: onOpenPipeline },
    { label: "Ver automações", onClick: onOpenAutomation },
    { label: "Ver proposta", onClick: onOpenProposal },
    { label: "Agendar seguimento", onClick: onScheduleFollowUp },
  ];

  return (
    <section className="rounded-3xl border border-slate-700/70 bg-slate-900/60 p-5 sm:p-6">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Atalhos para começar
        </p>
        <p className="text-sm text-slate-300">
          Se ainda não conhece o sistema, toque primeiro em <strong className="text-slate-100">Contactar agora</strong> ou{" "}
          <strong className="text-slate-100">Abrir pipeline</strong>.
        </p>
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {actions.map((action, index) => (
          <button
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              index === 0
                ? "border-indigo-400/35 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/20"
                : "border-slate-700 bg-slate-950/60 text-slate-100 hover:border-indigo-400/45 hover:bg-slate-900"
            }`}
            key={action.label}
            onClick={action.onClick}
            type="button"
          >
            {action.label}
            <ChevronRight className="h-4 w-4" />
          </button>
        ))}
      </div>
    </section>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 pb-16 pt-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <div className="h-72 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
        <div className="h-28 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
        <div className="h-36 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-28 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
          <div className="h-28 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
          <div className="h-28 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/70" />
        </div>
      </div>
    </div>
  );
}

export function DashboardErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 pb-16 pt-6 text-slate-100">
      <div className="mx-auto flex max-w-4xl items-start px-4 sm:px-6 lg:px-8">
        <div className="w-full rounded-3xl border border-rose-400/20 bg-slate-900/80 p-6 shadow-2xl shadow-rose-950/20">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-rose-200">
              <WifiOff className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-200">Erro de ligação</p>
              <h1 className="text-2xl font-semibold text-white">Não foi possível carregar os dados do cockpit.</h1>
              <p className="text-sm text-slate-300">Verifique a ligação ou tente novamente.</p>
              <p className="text-sm text-slate-400">{message}</p>
            </div>
          </div>
          <button
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white"
            onClick={onRetry}
            type="button"
          >
            Tentar novamente
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
